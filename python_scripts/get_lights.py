import sys
import json
import asyncio
import logging
from pywizlight import wizlight, PilotBuilder, discovery
from typing import List, Dict, Any
from dataclasses import dataclass
from concurrent.futures import ThreadPoolExecutor
from dotenv import load_dotenv
from config import *

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@dataclass
class BulbInfo:
    ip: str
    retries: int = 0

class LightDiscovery:
    def __init__(self):
        self.semaphore = asyncio.Semaphore(MAX_CONCURRENT_CONNECTIONS)
        self.connection_pool: Dict[str, wizlight] = {}
        self.executor = ThreadPoolExecutor(max_workers=MAX_CONCURRENT_CONNECTIONS)

    async def get_connection(self, ip: str) -> wizlight:
        """Get or create a connection to a light."""
        if ip not in self.connection_pool:
            self.connection_pool[ip] = wizlight(ip)
        return self.connection_pool[ip]

    async def close_connections(self):
        """Close all connections in the pool."""
        close_tasks = []
        for ip, light in self.connection_pool.items():
            try:
                close_tasks.append(light.async_close())
            except Exception as e:
                logger.error(f"Error closing connection to {ip}: {str(e)}")
        
        if close_tasks:
            await asyncio.gather(*close_tasks, return_exceptions=True)
        self.connection_pool.clear()

    async def get_bulb_info(self, bulb_info: BulbInfo) -> Dict[str, Any]:
        """Get detailed information about a single bulb with retry logic."""
        async with self.semaphore:
            try:
                light = await self.get_connection(bulb_info.ip)
                state = await asyncio.wait_for(light.updateState(), timeout=CONNECTION_TIMEOUT)
                bulb_type = await asyncio.wait_for(light.get_bulbtype(), timeout=CONNECTION_TIMEOUT)
                
                r, g, b = state.get_rgb()
                
                return {
                    "ip": bulb_info.ip,
                    "state": {
                        "colorTemp": state.get_colortemp(),
                        "rgb": [r, g, b],
                        "scene": state.get_scene(),
                        "isOn": state.get_state(),
                        "brightness": state.get_brightness(),
                        "warmWhite": state.get_warm_white(),
                        "coldWhite": state.get_cold_white(),
                    },
                    "features": {
                        "brightness": bulb_type.features.brightness,
                        "color": bulb_type.features.color,
                        "color_tmp": bulb_type.features.color_tmp,
                        "effect": bulb_type.features.effect
                    },
                    "kelvin_range": {
                        "max": bulb_type.kelvin_range.max,
                        "min": bulb_type.kelvin_range.min
                    },
                    "name": bulb_type.name,
                    "success": True
                }
            except asyncio.TimeoutError:
                if bulb_info.retries < RETRY_ATTEMPTS:
                    bulb_info.retries += 1
                    logger.warning(f"Timeout for {bulb_info.ip}, retry {bulb_info.retries}")
                    return await self.get_bulb_info(bulb_info)
                return {
                    "ip": bulb_info.ip,
                    "success": False,
                    "error": f"Operation timed out after {RETRY_ATTEMPTS} attempts"
                }
            except Exception as e:
                return {
                    "ip": bulb_info.ip,
                    "success": False,
                    "error": str(e)
                }

    async def process_batch(self, bulbs: List[BulbInfo]) -> List[Dict[str, Any]]:
        """Process a batch of bulb information requests."""
        tasks = [self.get_bulb_info(bulb) for bulb in bulbs]
        return await asyncio.gather(*tasks, return_exceptions=True)

    async def discover_lights(self) -> Dict[str, Any]:
        """Discover and get information about all lights on the network."""
        try:
            logger.info(f"Starting light discovery on network using broadcast address: {BROADCAST_ADDRESS}")
            discovered_bulbs = await discovery.discover_lights(broadcast_space=BROADCAST_ADDRESS)
            
            if not discovered_bulbs:
                logger.info("No lights discovered on the network")
                return {
                    "success": True,
                    "count": 0,
                    "bulbs": [],
                    "message": "No lights found on the network"
                }

            bulb_infos = [BulbInfo(ip=bulb.ip) for bulb in discovered_bulbs]
            results = []

            # Process in batches
            for i in range(0, len(bulb_infos), BATCH_SIZE):
                batch = bulb_infos[i:i + BATCH_SIZE]
                logger.info(f"Processing batch {i//BATCH_SIZE + 1} of {(len(bulb_infos)-1)//BATCH_SIZE + 1}")
                batch_results = await self.process_batch(batch)
                results.extend(batch_results)

            # Filter out exceptions and failed operations
            valid_results = [r for r in results if isinstance(r, dict)]
            successful_results = [r for r in valid_results if r.get("success", False)]

            success_rate = (len(successful_results) / len(results)) * 100 if results else 0

            return {
                "success": True,
                "count": len(successful_results),
                "total_discovered": len(results),
                "success_rate": f"{success_rate:.2f}%",
                "bulbs": successful_results,
                "message": f"Found {len(successful_results)} light(s) on the network"
            }
        except Exception as e:
            error_message = str(e)
            logger.error(f"Error during discovery: {error_message}")
            return {
                "success": False,
                "count": 0,
                "bulbs": [],
                "message": f"Error during discovery: {error_message}"
            }

async def main():
    discovery_controller = None
    try:
        logger.info("Starting light discovery process")
        discovery_controller = LightDiscovery()
        result = await discovery_controller.discover_lights()
        print(json.dumps(result))
        logger.info("Discovery process completed")
    except Exception as e:
        logger.error(f"Unexpected error during discovery: {str(e)}")
        print(json.dumps({
            "success": False,
            "count": 0,
            "bulbs": [],
            "message": f"Error during discovery: {str(e)}"
        }))
    finally:
        if discovery_controller:
            await discovery_controller.close_connections()

if __name__ == '__main__':
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    try:
        asyncio.run(main())
    except Exception as e:
        logger.error(f"Fatal error: {str(e)}")
        print(json.dumps({
            "success": False,
            "count": 0,
            "bulbs": [],
            "message": f"Fatal error: {str(e)}"
        }))

import sys
import json
import asyncio
import logging
from pywizlight import wizlight, PilotBuilder
from typing import List, Dict, Any
from dataclasses import dataclass
from concurrent.futures import ThreadPoolExecutor
from config import *


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@dataclass
class LightOperation:
    ip: str
    intensity: int
    retries: int = 0

class LightController:
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

    async def set_light_warm_white(self, operation: LightOperation) -> Dict[str, Any]:
        """Set warm white for a single light with retry logic."""
        async with self.semaphore:
            try:
                light = await self.get_connection(operation.ip)
                await asyncio.wait_for(
                    light.turn_on(PilotBuilder(warm_white=operation.intensity)),
                    timeout=CONNECTION_TIMEOUT
                )
                return {
                    "success": True,
                    "ip": operation.ip,
                    "message": f"Light set to warm white with intensity {operation.intensity} successfully"
                }
            except asyncio.TimeoutError:
                if operation.retries < RETRY_ATTEMPTS:
                    operation.retries += 1
                    logger.warning(f"Timeout for {operation.ip}, retry {operation.retries}")
                    return await self.set_light_warm_white(operation)
                return {
                    "success": False,
                    "ip": operation.ip,
                    "message": f"Operation timed out after {RETRY_ATTEMPTS} attempts"
                }
            except Exception as e:
                return {
                    "success": False,
                    "ip": operation.ip,
                    "message": str(e)
                }

    async def process_batch(self, operations: List[LightOperation]) -> List[Dict[str, Any]]:
        """Process a batch of light operations."""
        tasks = [self.set_light_warm_white(op) for op in operations]
        return await asyncio.gather(*tasks, return_exceptions=True)

    async def set_lights_warm_white(self, ips: List[str], intensity: int) -> Dict[str, Any]:
        """Set warm white for multiple lights with batching."""
        operations = [LightOperation(ip=ip, intensity=intensity) for ip in ips]
        results = []
        
        # Process in batches
        for i in range(0, len(operations), BATCH_SIZE):
            batch = operations[i:i + BATCH_SIZE]
            logger.info(f"Processing batch {i//BATCH_SIZE + 1} of {(len(operations)-1)//BATCH_SIZE + 1}")
            batch_results = await self.process_batch(batch)
            results.extend(batch_results)

        # Calculate success rate
        successful = sum(1 for r in results if isinstance(r, dict) and r.get("success", False))
        success_rate = (successful / len(results)) * 100 if results else 0

        return {
            "overall_success": successful == len(results),
            "success_rate": f"{success_rate:.2f}%",
            "total_processed": len(results),
            "successful_operations": successful,
            "failed_operations": len(results) - successful,
            "results": results
        }

async def main():
    controller = None
    try:
        logger.info("Parsing input parameters")
        data = json.loads(sys.argv[1])
        ips = data['ips']
        intensity = data['intensity']
        
        if not ips:
            logger.warning("No IP addresses provided")
            response = {
                "overall_success": False,
                "message": "No IP addresses provided",
                "results": []
            }
        else:
            controller = LightController()
            result = await controller.set_lights_warm_white(ips, intensity)
            response = result
        
        print(json.dumps(response))
        logger.info("Response sent")
    except json.JSONDecodeError as e:
        logger.error(f"Error parsing JSON input: {str(e)}")
        print(json.dumps({
            "overall_success": False,
            "message": f"Invalid JSON input: {str(e)}",
            "results": []
        }))
    except KeyError as e:
        logger.error(f"Missing required parameter: {str(e)}")
        print(json.dumps({
            "overall_success": False,
            "message": f"Missing required parameter: {str(e)}",
            "results": []
        }))
    finally:
        if controller:
            await controller.close_connections()

if __name__ == '__main__':
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    try:
        asyncio.run(main())
    except Exception as e:
        logger.error(f"Fatal error: {str(e)}")
        print(json.dumps({
            "overall_success": False,
            "message": f"Fatal error: {str(e)}",
            "results": []
        }))

import sys
import json
import asyncio
import logging
from pywizlight import wizlight, PilotBuilder, discovery

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

async def get_bulb_info(bulb: wizlight):
    """Get detailed information about a single bulb."""
    try:
        # Get current state
        state = await bulb.updateState()
        # Get bulb type and features
        bulb_type = await bulb.get_bulbtype()
        
        # Get RGB values
        r, g, b = state.get_rgb()
        
        return {
            "ip": bulb.ip,
            "state": {
                "colorTemp": state.get_colortemp(),
                "rgb": [r, g, b],
                "scene": state.get_scene(),
                "isOn": state.get_state(),
                "brightness": state.get_brightness()
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
            "name": bulb_type.name
        }
    except Exception as e:
        logger.error(f"Error getting info for bulb {bulb.ip}: {str(e)}")
        return {
            "ip": bulb.ip,
            "error": str(e)
        }

async def getLights():
    try:
        logger.info("Starting light discovery on network")
        bulbs = await discovery.discover_lights(broadcast_space="192.168.18.255")
        bulb_details = []
        
        for bulb in bulbs:
            try:
                # Get detailed information for each bulb
                bulb_info = await get_bulb_info(bulb)
                bulb_details.append(bulb_info)
                logger.info(f"Successfully got info for bulb {bulb.ip}")
            except Exception as bulb_error:
                logger.error(f"Error with bulb {bulb.ip}: {str(bulb_error)}")
                continue
            finally:
                await bulb.async_close()
                
        logger.info(f"Found {len(bulb_details)} lights")
        return bulb_details
    except Exception as e:
        error_message = str(e)
        logger.error(f"Error discovering lights: {error_message}")
        return []

async def main():
    loop = None
    try:
        logger.info("Starting light discovery process")
        bulb_details = await getLights()
        
        response = {
            'success': len(bulb_details) > 0,
            'count': len(bulb_details),
            'bulbs': bulb_details,
            'message': f"Found {len(bulb_details)} light(s) on the network"
        }
        
        print(json.dumps(response))
        logger.info("Discovery process completed")
    except Exception as e:
        logger.error(f"Unexpected error during discovery: {str(e)}")
        print(json.dumps({
            'success': False,
            'count': 0,
            'bulbs': [],
            'message': f"Error during discovery: {str(e)}"
        }))
    finally:
        if loop is not None:
            loop.close()

if __name__ == '__main__':
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    try:
        asyncio.run(main())
    except Exception as e:
        logger.error(f"Fatal error: {str(e)}")

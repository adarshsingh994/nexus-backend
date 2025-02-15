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

async def getLights():
    try:
        logger.info("Starting light discovery on network")
        bulbs = await discovery.discover_lights(broadcast_space="192.168.18.255")
        ips = []
        for bulb in bulbs:
            try:
                ips.append(bulb.ip)
                await bulb.async_close()
            except Exception as bulb_error:
                logger.error(f"Error with bulb {bulb.ip}: {str(bulb_error)}")
                continue
        logger.info(f"Found {len(ips)} lights: {ips}")
        return ips
    except Exception as e:
        error_message = str(e)
        logger.error(f"Error discovering lights: {error_message}")
        return []

async def main():
    loop = None
    try:
        logger.info("Starting light discovery process")
        ips = await getLights()
        
        response = {
            'success': len(ips) > 0,
            'count': len(ips),
            'bulbs': ips,
            'message': f"Found {len(ips)} light(s) on the network"
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

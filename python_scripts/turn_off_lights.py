import sys
import json
import asyncio
import logging
from pywizlight import wizlight

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

async def turn_off_light(ip):
    try:
        logger.info(f"Attempting to turn off light at IP: {ip}")
        light = wizlight(ip)
        await light.turn_off()
        logger.info(f"Successfully turned off light at IP: {ip}")
        return {
            "success": True,
            "ip": ip,
            "message": "Light turned off successfully"
        }
    except Exception as e:
        error_message = str(e)
        logger.error(f"Error turning off light at IP {ip}: {error_message}")
        return {
            "success": False,
            "ip": ip,
            "message": error_message
        }

async def turn_off_lights(ips):
    logger.info(f"Starting to turn off {len(ips)} lights")
    tasks = [turn_off_light(ip) for ip in ips]
    results = await asyncio.gather(*tasks)
    
    overall_success = all(result["success"] for result in results)
    logger.info(f"Operation completed. Overall success: {overall_success}")
    
    return {
        "overall_success": overall_success,
        "results": results
    }

async def main():
    args = sys.argv[1:]
    logger.info(f"Received request to turn off lights: {args}")
    
    if not args:
        logger.warning("No IP addresses provided")
        response = {
            "overall_success": False,
            "message": "No IP addresses provided",
            "results": []
        }
    else:
        result = await turn_off_lights(args)
        response = {
            "overall_success": result["overall_success"],
            "results": result["results"]
        }
    
    print(json.dumps(response))
    logger.info("Response sent")

if __name__ == '__main__':
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(main())

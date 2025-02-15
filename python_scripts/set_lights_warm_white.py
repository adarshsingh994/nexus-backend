import sys
import json
import asyncio
import logging
from pywizlight import wizlight, PilotBuilder

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

async def set_light_warm_white(ip, intensity):
    light = None
    try:
        logger.info(f"Attempting to set warm white for light at IP: {ip} with intensity: {intensity}")
        light = wizlight(ip)
        await light.turn_on(PilotBuilder(warm_white=intensity))
        logger.info(f"Successfully set warm white for light at IP: {ip}")
        return {
            "success": True,
            "ip": ip,
            "message": f"Light set to warm white with intensity {intensity} successfully"
        }
    except Exception as e:
        error_message = str(e)
        logger.error(f"Error setting warm white for light at IP {ip}: {error_message}")
        return {
            "success": False,
            "ip": ip,
            "message": error_message
        }
    finally:
        if light is not None:
            try:
                await light.async_close()
            except Exception as e:
                logger.error(f"Error closing connection to light at IP {ip}: {str(e)}")

async def set_lights_warm_white(ips, intensity):
    logger.info(f"Starting to set warm white for {len(ips)} lights with intensity {intensity}")
    tasks = [set_light_warm_white(ip, intensity) for ip in ips]
    results = await asyncio.gather(*tasks)
    
    overall_success = all(result["success"] for result in results)
    logger.info(f"Operation completed. Overall success: {overall_success}")
    
    return {
        "overall_success": overall_success,
        "results": results
    }

async def main():
    loop = None
    try:
        logger.info("Parsing input parameters")
        data = json.loads(sys.argv[1])
        ips = data['ips']
        intensity = data['intensity']
        
        logger.info(f"Received request to set warm white with intensity {intensity} for lights: {ips}")
        
        if not ips:
            logger.warning("No IP addresses provided")
            response = {
                "overall_success": False,
                "message": "No IP addresses provided",
                "results": []
            }
        else:
            result = await set_lights_warm_white(ips, intensity)
            response = {
                "overall_success": result["overall_success"],
                "results": result["results"]
            }
        
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

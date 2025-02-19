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

async def turn_on_light(ip):
    light = None
    try:
        logger.info(f"Attempting to turn on light at IP: {ip}")
        light = wizlight(ip)
        await light.turn_on(PilotBuilder())
        logger.info(f"Successfully turned on light at IP: {ip}")
        return {
            "success": True,
            "ip": ip,
            "message": "Light turned on successfully"
        }
    except Exception as e:
        error_message = str(e)
        logger.error(f"Error turning on light at IP {ip}: {error_message}")
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

async def turn_on_lights(ips):
    logger.info(f"Starting to turn on {len(ips)} lights")
    tasks = [turn_on_light(ip) for ip in ips]
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
        args = sys.argv[1:]
        logger.info(f"Received request to turn on lights: {args}")
        
        if not args:
            logger.warning("No IP addresses provided")
            response = {
                "overall_success": False,
                "message": "No IP addresses provided",
                "results": []
            }
        else:
            try:
                # Parse the JSON string from the first argument
                request = json.loads(args[0])
                # Extract the IPs array from the parsed JSON
                ips = request.get('ips', [])
                
                if not ips:
                    logger.warning("No IP addresses found in request")
                    response = {
                        "overall_success": False,
                        "message": "No IP addresses found in request",
                        "results": []
                    }
                else:
                    logger.info(f"Parsed IPs from request: {ips}")
                    result = await turn_on_lights(ips)
                    response = {
                        "overall_success": result["overall_success"],
                        "results": result["results"]
                    }
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse JSON request: {str(e)}")
                response = {
                    "overall_success": False,
                    "message": f"Invalid JSON request: {str(e)}",
                    "results": []
                }
        
        print(json.dumps(response))
        logger.info("Response sent")
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        print(json.dumps({
            "overall_success": False,
            "message": f"Unexpected error: {str(e)}",
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

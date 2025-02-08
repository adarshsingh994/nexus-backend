import sys
import json
import asyncio
from pywizlight import wizlight, PilotBuilder

async def turn_on_light(ip):
    try:
        light = wizlight(ip)
        await light.turn_on(PilotBuilder())
        return True
    except Exception as e:
        print(f"Error with light {ip}: {str(e)}", file=sys.stderr)
        return False

async def turn_on_lights(ips):
    tasks = [turn_on_light(ip) for ip in ips]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    return all(results)

async def main():
    args = sys.argv[1:]  # More pythonic way to skip the first argument
    
    success = await turn_on_lights(args)
    
    response = {
        'success': success,
        'affected': args
    }
    
    print(json.dumps(response))

if __name__ == '__main__':
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(main())
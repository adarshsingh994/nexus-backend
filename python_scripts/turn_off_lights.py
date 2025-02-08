import sys
import json
import asyncio
from pywizlight import wizlight

async def turn_off_light(ip):
    try:
        light = wizlight(ip)
        await light.turn_off()
        return True
    except Exception as e:
        print(f"Error with light {ip}: {str(e)}", file=sys.stderr)
        return False

async def turn_off_lights(ips):
    tasks = [turn_off_light(ip) for ip in ips]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    return all(results)

async def main():
    args = sys.argv[1:]  # More pythonic way to skip the first argument
    
    success = await turn_off_lights(args)
    
    response = {
        'success': success,
        'affected': args
    }
    
    print(json.dumps(response))

if __name__ == '__main__':
    asyncio.run(main())
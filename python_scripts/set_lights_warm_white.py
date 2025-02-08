import sys
import json
import asyncio
from pywizlight import wizlight, PilotBuilder

async def set_light_warm_white(ip, intensity):
    try:
        light = wizlight(ip)
        await light.turn_on(PilotBuilder(warm_white=intensity))
        return True
    except Exception as e:
        print(f"Error with light {ip}: {str(e)}", file=sys.stderr)
        return False

async def set_lights_warm_white(ips, intensity):
    tasks = [set_light_warm_white(ip, intensity) for ip in ips]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    return all(results)

async def main():
    a = sys.argv[1]
    data = json.loads(sys.argv[1])

    ips = data['ips']
    intensity = data['intensity']

    success = await set_lights_warm_white(ips, intensity)
    
    response = {
        'success': success,
        'affected': ips
    }
    
    print(json.dumps(response))

if __name__ == '__main__':
    asyncio.run(main())
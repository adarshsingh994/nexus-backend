import sys
import json
import asyncio
from pywizlight import wizlight, PilotBuilder

async def set_light_color(ip, color):
    try:
        light = wizlight(ip)
        await light.turn_on(PilotBuilder(rgb= (color[0], color[1], color[2])))
        return True
    except Exception as e:
        print(f"Error with light {ip}: {str(e)}", file=sys.stderr)
        return False

async def set_lights_color(ips, color):
    tasks = [set_light_color(ip, color) for ip in ips]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    return all(results)

async def main():
    a = sys.argv[1]
    data = json.loads(sys.argv[1])

    ips = data['ips']
    color = data['color']

    success = await set_lights_color(ips, color)
    
    response = {
        'success': success,
        'affected': ips
    }
    
    print(json.dumps(response))

if __name__ == '__main__':
    asyncio.run(main())
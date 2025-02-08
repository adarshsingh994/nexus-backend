import sys
import json
import asyncio
from pywizlight import wizlight, PilotBuilder, discovery

async def getLights():
    try:
        bulbs = await discovery.discover_lights(broadcast_space="192.168.18.255")
        return [bulb.ip for bulb in bulbs]
    except Exception as e:
        print(f"Error discovering lights: {str(e)}", file=sys.stderr)
        return []

async def main():
    ips = await getLights()
    
    response = {
        'count': len(ips),
        'bulbs': ips
    }
    
    print(json.dumps(response))

if __name__ == '__main__':
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(main())
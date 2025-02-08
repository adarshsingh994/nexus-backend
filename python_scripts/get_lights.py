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
    asyncio.run(main())

# import sys
# import json
# import asyncio
# from pywizlight import wizlight, PilotBuilder, discovery

# async def getLights():
#     bulbs = await discovery.discover_lights(broadcast_space="192.168.18.255")
#     return [bulb.ip for bulb in bulbs]


# if __name__ == '__main__':
#     # Create event loop and run the async function
#     ips = asyncio.run(getLights())

#     response = {
#         'count': len(ips),
#         'bulbs': ips
#     }
    
#     print(json.dumps(response))
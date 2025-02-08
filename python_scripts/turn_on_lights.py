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
    asyncio.run(main())





# import sys
# import json
# import asyncio
# from pywizlight import wizlight, PilotBuilder

# async def turn_on_light(ip):
#     light = wizlight(ip)
#     await light.turn_on(PilotBuilder())

# async def turn_on_lights(ips):
#     tasks = [turn_on_light(ip) for ip in ips]
#     await asyncio.gather(*tasks)

# if __name__ == '__main__':
#     args = sys.argv
#     args.pop(0)

#     # Run the async function
#     asyncio.run(turn_on_lights(args))

#     response = {
#         'success': True,
#         'affected': args
#     }

#     print(json.dumps(response))



# import sys
# import json
# from pywizlight import wizlight

# args = sys.argv
# args.pop(0)

# for ip in args:
#     light = wizlight(ip)
#     await light.turn_on(PilotBuilder())

# response = {
#     'success': True,
# }

# print(json.dumps(response))
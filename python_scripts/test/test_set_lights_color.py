#!/usr/bin/env python3
import asyncio
import json
import logging
import subprocess
import random
from typing import List, Dict, Any
import time

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Fixed set of light IPs
LIGHT_IPS = [
    "192.168.18.167",
    "192.168.18.168",
    "192.168.18.175",
    "192.168.18.173",
    "192.168.18.178",
    "192.168.18.179"
]

def generate_random_color() -> List[int]:
    """Generate a random RGB color."""
    return [random.randint(0, 255) for _ in range(3)]

async def test_set_color(color: List[int]) -> Dict[str, Any]:
    """Test setting a specific color for all lights."""
    try:
        # Prepare the input data
        input_data = {
            "ips": LIGHT_IPS,
            "color": color
        }
        
        logger.info(f"Testing color: RGB{color}")
        
        # Run the set_lights_color.py script
        result = subprocess.run(
            ['python3', '../set_lights_color.py', json.dumps(input_data)],
            capture_output=True,
            text=True
        )
        
        # Parse the JSON output
        output = json.loads(result.stdout)
        
        logger.info(f"Color set result: {json.dumps(output, indent=2)}")
        return output
    except subprocess.CalledProcessError as e:
        logger.error(f"Error running set_lights_color.py: {e}")
        return {
            "success": False,
            "error": str(e),
            "stdout": e.stdout if hasattr(e, 'stdout') else None,
            "stderr": e.stderr if hasattr(e, 'stderr') else None
        }
    except json.JSONDecodeError as e:
        logger.error(f"Error parsing output: {e}")
        return {
            "success": False,
            "error": f"Invalid JSON output: {str(e)}",
            "raw_output": result.stdout if 'result' in locals() else None
        }
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return {
            "success": False,
            "error": str(e)
        }

async def run_color_tests() -> List[Dict[str, Any]]:
    """Run a series of color tests."""
    test_results = []
    
    # Test primary colors
    primary_colors = [
        [255, 0, 0],    # Red
        [0, 255, 0],    # Green
        [0, 0, 255],    # Blue
    ]
    
    # Test random colors
    random_colors = [generate_random_color() for _ in range(3)]
    
    # Combine all test colors
    test_colors = primary_colors + random_colors
    
    for color in test_colors:
        result = await test_set_color(color)
        test_results.append({
            "color": color,
            "result": result
        })
        # Wait between tests to avoid overwhelming the lights
        await asyncio.sleep(2)
    
    return test_results

async def main():
    """Run the test suite."""
    try:
        # Run color tests
        results = await run_color_tests()
        
        # Print final results
        print("\nTest Results:")
        print(json.dumps(results, indent=2))
        
        # Return the test results
        return results
    except Exception as e:
        logger.error(f"Test suite failed: {e}")
        return [{
            "success": False,
            "error": str(e)
        }]

if __name__ == "__main__":
    if asyncio.get_event_loop().is_closed():
        asyncio.set_event_loop(asyncio.new_event_loop())
    asyncio.get_event_loop().run_until_complete(main())
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

def generate_random_intensity() -> int:
    """Generate a random intensity value between 0 and 255."""
    return random.randint(0, 255)

async def test_set_intensity(intensity: int) -> Dict[str, Any]:
    """Test setting a specific warm white intensity for all lights."""
    try:
        # Prepare the input data
        input_data = {
            "ips": LIGHT_IPS,
            "intensity": intensity
        }
        
        logger.info(f"Testing warm white intensity: {intensity}")
        
        # Run the set_lights_warm_white.py script
        result = subprocess.run(
            ['python3', '../set_lights_warm_white.py', json.dumps(input_data)],
            capture_output=True,
            text=True
        )
        
        # Parse the JSON output
        output = json.loads(result.stdout)
        
        logger.info(f"Intensity set result: {json.dumps(output, indent=2)}")
        return output
    except subprocess.CalledProcessError as e:
        logger.error(f"Error running set_lights_warm_white.py: {e}")
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

async def run_intensity_tests() -> List[Dict[str, Any]]:
    """Run a series of warm white intensity tests."""
    test_results = []
    
    # Test specific intensity levels
    test_intensities = [
        0,      # Off
        64,     # Low
        128,    # Medium
        192,    # High
        255     # Maximum
    ]
    
    # Add some random intensity tests
    random_intensities = [generate_random_intensity() for _ in range(3)]
    
    # Combine all test intensities
    test_intensities.extend(random_intensities)
    
    for intensity in test_intensities:
        result = await test_set_intensity(intensity)
        test_results.append({
            "intensity": intensity,
            "result": result
        })
        # Wait between tests to avoid overwhelming the lights
        await asyncio.sleep(2)
    
    return test_results

async def main():
    """Run the test suite."""
    try:
        # Run intensity tests
        results = await run_intensity_tests()
        
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
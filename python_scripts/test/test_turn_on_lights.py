#!/usr/bin/env python3
import asyncio
import json
import logging
import subprocess
from typing import Dict, Any
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

async def test_turn_on_lights() -> Dict[str, Any]:
    """Test turning on all lights."""
    try:
        # Prepare the input data
        input_data = {
            "ips": LIGHT_IPS
        }
        
        logger.info("Testing turning on all lights")
        
        # Run the turn_on_lights.py script
        result = subprocess.run(
            ['python3', '../turn_on_lights.py', json.dumps(input_data)],
            capture_output=True,
            text=True
        )
        
        # Parse the JSON output
        output = json.loads(result.stdout)
        
        logger.info(f"Turn on result: {json.dumps(output, indent=2)}")
        return output
    except subprocess.CalledProcessError as e:
        logger.error(f"Error running turn_on_lights.py: {e}")
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

async def run_power_tests() -> Dict[str, Any]:
    """Run power control tests."""
    try:
        # Test turning on all lights
        result = await test_turn_on_lights()
        
        # Wait a moment to ensure the operation completes
        await asyncio.sleep(2)
        
        return {
            "test_type": "turn_on",
            "result": result
        }
    except Exception as e:
        logger.error(f"Power test failed: {e}")
        return {
            "test_type": "turn_on",
            "success": False,
            "error": str(e)
        }

async def main():
    """Run the test suite."""
    try:
        # Run power tests
        result = await run_power_tests()
        
        # Print final results
        print("\nTest Results:")
        print(json.dumps(result, indent=2))
        
        # Return the test results
        return result
    except Exception as e:
        logger.error(f"Test suite failed: {e}")
        return {
            "test_type": "turn_on",
            "success": False,
            "error": str(e)
        }

if __name__ == "__main__":
    if asyncio.get_event_loop().is_closed():
        asyncio.set_event_loop(asyncio.new_event_loop())
    asyncio.get_event_loop().run_until_complete(main())
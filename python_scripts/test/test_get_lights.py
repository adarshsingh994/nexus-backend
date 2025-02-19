#!/usr/bin/env python3
import asyncio
import json
import logging
import subprocess
import os
from typing import Dict, Any

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

async def test_get_lights() -> Dict[str, Any]:
    """Test the get_lights.py script."""
    try:
        logger.info("Testing get_lights.py")
        
        # Run the get_lights.py script from parent directory
        result = subprocess.run(
            ['python3', '../get_lights.py'],
            capture_output=True,
            text=True,
            cwd=os.path.dirname(os.path.abspath(__file__)),  # Ensure correct working directory
            env={**os.environ, 'PYTHONPATH': os.path.dirname(os.path.dirname(os.path.abspath(__file__)))}  # Add parent dir to PYTHONPATH
        )
        
        if result.stderr:
            logger.warning(f"Script stderr: {result.stderr}")
        
        if not result.stdout:
            return {
                "success": False,
                "error": "No output from script",
                "stderr": result.stderr
            }
        
        # Parse the JSON output
        output = json.loads(result.stdout)
        
        logger.info(f"Get lights result: {json.dumps(output, indent=2)}")
        return output
    except subprocess.CalledProcessError as e:
        logger.error(f"Error running get_lights.py: {e}")
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

async def main():
    """Run the test suite."""
    try:
        # Test get_lights.py
        result = await test_get_lights()
        
        # Print final results
        print("\nTest Results:")
        print(json.dumps(result, indent=2))
        
        # Return the test results
        return result
    except Exception as e:
        logger.error(f"Test suite failed: {e}")
        return {
            "success": False,
            "error": str(e)
        }

if __name__ == "__main__":
    if asyncio.get_event_loop().is_closed():
        asyncio.set_event_loop(asyncio.new_event_loop())
    asyncio.get_event_loop().run_until_complete(main())
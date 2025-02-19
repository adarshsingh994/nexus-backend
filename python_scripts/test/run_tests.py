#!/usr/bin/env python3
import asyncio
import importlib
import json
import logging
import os
from typing import Dict, List, Any, Union
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Test modules to run
TEST_MODULES = [
    'test_get_lights',
    'test_set_lights_color',
    'test_set_lights_cold_white',
    'test_set_lights_warm_white',
    'test_turn_on_lights',
    'test_turn_off_lights'
]

class TestRunner:
    def __init__(self):
        self.results = {}

    def format_color_test_result(self, result: List[Dict[str, Any]]) -> str:
        """Format color test results in a human-readable way."""
        output = []
        for test in result:
            color = test['color']
            test_result = test['result']
            
            success = test_result.get('overall_success', False)
            status = "✅ Succeeded" if success else "❌ Failed"
            
            output.append(f"\nTest: Set Color RGB{color}")
            output.append(f"Status: {status}")
            
            if not success and 'error' in test_result:
                output.append(f"Error: {test_result['error']}")
            
            if 'results' in test_result:
                output.append("\nDetails:")
                for light in test_result['results']:
                    ip_status = "✅" if light.get('success', False) else "❌"
                    output.append(f"  {ip_status} {light['ip']}: {light.get('message', 'No message')}")
        
        return "\n".join(output)

    def format_intensity_test_result(self, result: List[Dict[str, Any]]) -> str:
        """Format intensity test results in a human-readable way."""
        output = []
        for test in result:
            intensity = test['intensity']
            test_result = test['result']
            
            success = test_result.get('overall_success', False)
            status = "✅ Succeeded" if success else "❌ Failed"
            
            output.append(f"\nTest: Set Intensity {intensity}")
            output.append(f"Status: {status}")
            
            if not success and 'error' in test_result:
                output.append(f"Error: {test_result['error']}")
            
            if 'results' in test_result:
                output.append("\nDetails:")
                for light in test_result['results']:
                    ip_status = "✅" if light.get('success', False) else "❌"
                    output.append(f"  {ip_status} {light['ip']}: {light.get('message', 'No message')}")
        
        return "\n".join(output)

    def format_power_test_result(self, result: Dict[str, Any]) -> str:
        """Format power test results in a human-readable way."""
        output = []
        test_type = result['test_type']
        test_result = result['result']
        
        success = test_result.get('overall_success', False)
        status = "✅ Succeeded" if success else "❌ Failed"
        
        output.append(f"\nTest: {test_type.replace('_', ' ').title()}")
        output.append(f"Status: {status}")
        
        if not success and 'error' in test_result:
            output.append(f"Error: {test_result['error']}")
        
        if 'results' in test_result:
            output.append("\nDetails:")
            for light in test_result['results']:
                ip_status = "✅" if light.get('success', False) else "❌"
                output.append(f"  {ip_status} {light['ip']}: {light.get('message', 'No message')}")
        
        return "\n".join(output)

    def format_get_lights_result(self, result: Dict[str, Any]) -> str:
        """Format get lights test results in a human-readable way."""
        output = []
        
        success = result.get('success', False)
        status = "✅ Succeeded" if success else "❌ Failed"
        
        output.append("\nTest: Get Lights")
        output.append(f"Status: {status}")
        
        if not success and 'error' in result:
            output.append(f"Error: {result['error']}")
        
        if 'bulbs' in result:
            output.append("\nDiscovered Lights:")
            for light in result['bulbs']:
                output.append(f"  • {light['ip']} - {light.get('name', 'Unnamed')}")
        
        return "\n".join(output)

    async def run_test_module(self, module_name: str) -> None:
        """Run a single test module and store its results."""
        try:
            # Import the test module
            module = importlib.import_module(module_name)
            
            # Run the test
            if hasattr(module, 'main'):
                logger.info(f"Running {module_name}...")
                self.results[module_name] = await module.main()
            else:
                logger.error(f"No main function found in {module_name}")
                self.results[module_name] = {
                    "success": False,
                    "error": "No main function found in module"
                }
        except Exception as e:
            logger.error(f"Error running {module_name}: {e}")
            self.results[module_name] = {
                "success": False,
                "error": str(e)
            }

    def format_results(self) -> str:
        """Format all test results in a human-readable way."""
        output = [
            "🔍 Light Control System Test Results",
            f"📅 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"
        ]

        for module_name, result in self.results.items():
            output.append(f"\n{'='*50}")
            output.append(f"📋 {module_name.replace('test_', '').replace('_', ' ').title()}")
            output.append("="*50)

            if module_name == 'test_set_lights_color':
                output.append(self.format_color_test_result(result))
            elif module_name in ['test_set_lights_cold_white', 'test_set_lights_warm_white']:
                output.append(self.format_intensity_test_result(result))
            elif module_name in ['test_turn_on_lights', 'test_turn_off_lights']:
                output.append(self.format_power_test_result(result))
            elif module_name == 'test_get_lights':
                output.append(self.format_get_lights_result(result))
            else:
                output.append(json.dumps(result, indent=2))

        return "\n".join(output)

    def check_test_success(self, module_name: str, result: Union[Dict[str, Any], List[Dict[str, Any]]]) -> bool:
        """Check if a test was successful based on its type."""
        try:
            if module_name == 'test_get_lights':
                return result.get('success', False)
            elif module_name in ['test_turn_on_lights', 'test_turn_off_lights']:
                return result.get('result', {}).get('overall_success', False)
            elif module_name in ['test_set_lights_color', 'test_set_lights_cold_white', 'test_set_lights_warm_white']:
                if not isinstance(result, list):
                    return False
                return all(r.get('result', {}).get('overall_success', False) for r in result)
            return False
        except Exception as e:
            logger.error(f"Error checking test success: {e}")
            return False

async def main():
    """Run all tests and display results."""
    try:
        # Create test runner
        runner = TestRunner()
        
        # Run all test modules
        for module_name in TEST_MODULES:
            await runner.run_test_module(module_name)
        
        # Format and display results
        print(runner.format_results())
        
        # Determine overall success
        all_success = True
        for module_name, result in runner.results.items():
            success = runner.check_test_success(module_name, result)
            if not success:
                logger.error(f"{module_name} failed")
                all_success = False
            else:
                logger.info(f"{module_name} succeeded")
        
        return 0 if all_success else 1
    except Exception as e:
        logger.error(f"Test suite failed: {e}")
        return 1

if __name__ == "__main__":
    if asyncio.get_event_loop().is_closed():
        asyncio.set_event_loop(asyncio.new_event_loop())
    exit_code = asyncio.get_event_loop().run_until_complete(main())
    exit(exit_code)
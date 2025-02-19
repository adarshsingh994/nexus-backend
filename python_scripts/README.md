# Light Control Test Suite

This test suite provides automated testing for the light control system using a fixed set of light IPs.

## Available Light IPs

The following IP addresses are used across all tests:
```
192.168.18.167
192.168.18.168
192.168.18.175
192.168.18.173
192.168.18.178
192.168.18.179
```

## Test Files

1. `test_get_lights.py`
   - Tests light discovery functionality
   - No input parameters required
   - Uses BROADCAST_ADDRESS from .env

2. `test_set_lights_color.py`
   - Tests RGB color settings
   - Tests primary colors (red, green, blue)
   - Tests random color combinations
   - Includes 2-second delay between tests

3. `test_set_lights_cold_white.py`
   - Tests cold white intensity levels
   - Tests fixed intensities (0, 64, 128, 192, 255)
   - Tests random intensity values
   - Includes 2-second delay between tests

4. `test_set_lights_warm_white.py`
   - Tests warm white intensity levels
   - Tests fixed intensities (0, 64, 128, 192, 255)
   - Tests random intensity values
   - Includes 2-second delay between tests

5. `test_turn_on_lights.py`
   - Tests turning on all lights
   - Simple power control test
   - Includes 2-second delay after operation

6. `test_turn_off_lights.py`
   - Tests turning off all lights
   - Simple power control test
   - Includes 2-second delay after operation

## Running the Tests

You can run individual test files:

```bash
# Test light discovery
python test_get_lights.py

# Test color settings
python test_set_lights_color.py

# Test cold white settings
python test_set_lights_cold_white.py

# Test warm white settings
python test_set_lights_warm_white.py

# Test power control
python test_turn_on_lights.py
python test_turn_off_lights.py
```

## Test Features

- All tests use the fixed set of light IPs
- Tests include proper error handling and logging
- Results are output in JSON format
- Success rates and operation statistics are provided
- Automatic retries on timeouts (3 attempts)
- Connection pooling for efficient resource usage
- Batch processing support
- Proper cleanup of resources

## Test Output

Each test provides detailed output including:
- Success/failure status
- Operation statistics
- Detailed error messages if applicable
- Success rate percentage
- Individual results for each light

Example output:
```json
{
    "test_type": "color",
    "result": {
        "overall_success": true,
        "success_rate": "100.00%",
        "total_processed": 6,
        "successful_operations": 6,
        "failed_operations": 0,
        "results": [...]
    }
}
```

## Error Handling

Tests handle various error scenarios:
- Network timeouts
- Invalid responses
- Connection failures
- JSON parsing errors
- Script execution errors

## Notes

1. Tests include delays between operations to avoid overwhelming the lights
2. Random values are used to test different scenarios
3. All tests use proper connection cleanup
4. Logging is enabled for debugging purposes
5. Exit codes indicate test success/failure
# Test Data Examples

This document provides test data examples for each light control script using the actual light device IP addresses.

## Available Light IPs

The following IP addresses represent the actual light devices on the network:
```
192.168.18.167
192.168.18.168
192.168.18.175
192.168.18.173
192.168.18.178
192.168.18.179
```

## Test Data Examples

### 1. Set Lights Color

```json
{
    "ips": [
        "192.168.18.167",
        "192.168.18.168",
        "192.168.18.175",
        "192.168.18.173",
        "192.168.18.178",
        "192.168.18.179"
    ],
    "color": [255, 0, 0]  // Red color
}
```

Command:
```bash
python set_lights_color.py '{"ips": ["192.168.18.167", "192.168.18.168", "192.168.18.175", "192.168.18.173", "192.168.18.178", "192.168.18.179"], "color": [255, 0, 0]}'
```

### 2. Set Lights Cold White

```json
{
    "ips": [
        "192.168.18.167",
        "192.168.18.168",
        "192.168.18.175",
        "192.168.18.173",
        "192.168.18.178",
        "192.168.18.179"
    ],
    "intensity": 255  // Full brightness
}
```

Command:
```bash
python set_lights_cold_white.py '{"ips": ["192.168.18.167", "192.168.18.168", "192.168.18.175", "192.168.18.173", "192.168.18.178", "192.168.18.179"], "intensity": 255}'
```

### 3. Set Lights Warm White

```json
{
    "ips": [
        "192.168.18.167",
        "192.168.18.168",
        "192.168.18.175",
        "192.168.18.173",
        "192.168.18.178",
        "192.168.18.179"
    ],
    "intensity": 255  // Full brightness
}
```

Command:
```bash
python set_lights_warm_white.py '{"ips": ["192.168.18.167", "192.168.18.168", "192.168.18.175", "192.168.18.173", "192.168.18.178", "192.168.18.179"], "intensity": 255}'
```

### 4. Turn On Lights

```json
{
    "ips": [
        "192.168.18.167",
        "192.168.18.168",
        "192.168.18.175",
        "192.168.18.173",
        "192.168.18.178",
        "192.168.18.179"
    ]
}
```

Command:
```bash
python turn_on_lights.py '{"ips": ["192.168.18.167", "192.168.18.168", "192.168.18.175", "192.168.18.173", "192.168.18.178", "192.168.18.179"]}'
```

### 5. Turn Off Lights

```json
{
    "ips": [
        "192.168.18.167",
        "192.168.18.168",
        "192.168.18.175",
        "192.168.18.173",
        "192.168.18.178",
        "192.168.18.179"
    ]
}
```

Command:
```bash
python turn_off_lights.py '{"ips": ["192.168.18.167", "192.168.18.168", "192.168.18.175", "192.168.18.173", "192.168.18.178", "192.168.18.179"]}'
```

### 6. Get Lights

No input parameters required. Uses BROADCAST_ADDRESS from .env file.

Command:
```bash
python get_lights.py
```

## Testing Notes

1. All scripts support batching with a default batch size of 50 lights
2. Maximum concurrent connections is limited to 100
3. Each operation has a 5-second timeout and 3 retry attempts
4. Scripts provide detailed success rate and operation statistics in the output
5. The scripts will automatically handle connection pooling and proper resource cleanup

## Common Test Scenarios

1. Color Changes:
   - Set to different colors (red, green, blue)
   - Test color transitions
   - Test RGB value boundaries

2. White Light Control:
   - Test different intensity levels
   - Test transitions between warm and cold white
   - Test intensity boundaries (0-255)

3. Power Control:
   - Test turning all lights on/off
   - Test rapid on/off sequences
   - Test power state transitions

4. Error Handling:
   - Test with unreachable IPs
   - Test with invalid parameters
   - Test timeout scenarios
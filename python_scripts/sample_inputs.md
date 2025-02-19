# Sample Input Data for Light Control Scripts

This document provides sample JSON input data for each script in the light control system. The samples include both valid and invalid inputs for testing purposes.

## get_lights.py

This script doesn't require any input parameters as it uses the BROADCAST_ADDRESS from the .env file.

```bash
python get_lights.py
```

## set_lights_color.py

Sets RGB color for specified lights. Requires 'ips' array and 'color' array [r,g,b].

### Valid Input Examples:

```bash
# Red color (single light)
python set_lights_color.py '{"ips": ["192.168.18.100"], "color": [255, 0, 0]}'

# Blue color (multiple lights)
python set_lights_color.py '{"ips": ["192.168.18.100", "192.168.18.101", "192.168.18.102"], "color": [0, 0, 255]}'

# Green color (batch test with 1000+ lights)
python set_lights_color.py '{
  "ips": ["192.168.18.100", "192.168.18.101", ..., "192.168.18.1100"],
  "color": [0, 255, 0]
}'
```

### Invalid Input Examples:

```bash
# Missing color parameter
python set_lights_color.py '{"ips": ["192.168.18.100"]}'

# Invalid color values (must be 0-255)
python set_lights_color.py '{"ips": ["192.168.18.100"], "color": [300, 0, 0]}'

# Empty IPs array
python set_lights_color.py '{"ips": [], "color": [255, 0, 0]}'
```

## set_lights_cold_white.py

Sets cold white intensity for specified lights. Requires 'ips' array and 'intensity' number (0-255).

### Valid Input Examples:

```bash
# Full brightness (single light)
python set_lights_cold_white.py '{"ips": ["192.168.18.100"], "intensity": 255}'

# Half brightness (multiple lights)
python set_lights_cold_white.py '{"ips": ["192.168.18.100", "192.168.18.101"], "intensity": 128}'

# Low brightness (batch test with 1000+ lights)
python set_lights_cold_white.py '{
  "ips": ["192.168.18.100", "192.168.18.101", ..., "192.168.18.1100"],
  "intensity": 64
}'
```

### Invalid Input Examples:

```bash
# Missing intensity parameter
python set_lights_cold_white.py '{"ips": ["192.168.18.100"]}'

# Invalid intensity value (must be 0-255)
python set_lights_cold_white.py '{"ips": ["192.168.18.100"], "intensity": 300}'
```

## set_lights_warm_white.py

Sets warm white intensity for specified lights. Requires 'ips' array and 'intensity' number (0-255).

### Valid Input Examples:

```bash
# Full brightness (single light)
python set_lights_warm_white.py '{"ips": ["192.168.18.100"], "intensity": 255}'

# Half brightness (multiple lights)
python set_lights_warm_white.py '{"ips": ["192.168.18.100", "192.168.18.101"], "intensity": 128}'

# Low brightness (batch test with 1000+ lights)
python set_lights_warm_white.py '{
  "ips": ["192.168.18.100", "192.168.18.101", ..., "192.168.18.1100"],
  "intensity": 64
}'
```

### Invalid Input Examples:

```bash
# Missing intensity parameter
python set_lights_warm_white.py '{"ips": ["192.168.18.100"]}'

# Invalid intensity value (must be 0-255)
python set_lights_warm_white.py '{"ips": ["192.168.18.100"], "intensity": 300}'
```

## turn_off_lights.py

Turns off specified lights. Requires only 'ips' array.

### Valid Input Examples:

```bash
# Single light
python turn_off_lights.py '{"ips": ["192.168.18.100"]}'

# Multiple lights
python turn_off_lights.py '{"ips": ["192.168.18.100", "192.168.18.101", "192.168.18.102"]}'

# Batch test with 1000+ lights
python turn_off_lights.py '{
  "ips": ["192.168.18.100", "192.168.18.101", ..., "192.168.18.1100"]
}'
```

### Invalid Input Examples:

```bash
# Empty IPs array
python turn_off_lights.py '{"ips": []}'

# Missing ips parameter
python turn_off_lights.py '{}'
```

## turn_on_lights.py

Turns on specified lights. Requires only 'ips' array.

### Valid Input Examples:

```bash
# Single light
python turn_on_lights.py '{"ips": ["192.168.18.100"]}'

# Multiple lights
python turn_on_lights.py '{"ips": ["192.168.18.100", "192.168.18.101", "192.168.18.102"]}'

# Batch test with 1000+ lights
python turn_on_lights.py '{
  "ips": ["192.168.18.100", "192.168.18.101", ..., "192.168.18.1100"]
}'
```

### Invalid Input Examples:

```bash
# Empty IPs array
python turn_on_lights.py '{"ips": []}'

# Missing ips parameter
python turn_on_lights.py '{}'
```

## Testing Notes

1. All scripts now support batching with a default batch size of 50 lights per batch
2. Maximum concurrent connections is limited to 100
3. Each operation has a 5-second timeout and 3 retry attempts
4. Scripts provide detailed success rate and operation statistics in the output
5. For batch testing with 1000+ lights, the scripts will automatically process them in batches while maintaining connection pools and proper resource cleanup
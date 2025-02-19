import os

# Constants for discovery and connection management
BATCH_SIZE = 2  # Number of lights to process in each batch
MAX_CONCURRENT_CONNECTIONS = 100  # Maximum number of concurrent connections
CONNECTION_TIMEOUT = 5  # Timeout for each connection attempt in seconds
RETRY_ATTEMPTS = 3  # Number of retry attempts for failed operations
BROADCAST_ADDRESS = os.getenv('BROADCAST_ADDRESS', '192.168.18.255')
import { ENDPOINTS, ERROR_MESSAGES } from './config.js';

let globalConfig;

export function initializeStatusIndicators(config) {
    globalConfig = config;
    const { apiBaseUrl, elements } = config;
    const { statusDots, lastSync } = elements;

    // Initialize sync button and bulb count
    const syncButton = document.getElementById('syncButton');
    const bulbCount = document.querySelector('.bulb-count');
    const bulbCountNumber = document.querySelector('.bulb-count__number');
    
    syncButton.addEventListener('click', handleSync);

    function updateStatusDots(online = true) {
        statusDots.forEach(dot => {
            dot.classList.toggle('status-indicator__dot--offline', !online);
        });
    }

    function updateLastSync() {
        const now = new Date();
        lastSync.textContent = now.toLocaleTimeString();
    }

    function setSyncingState(isSyncing) {
        syncButton.classList.toggle('button--syncing', isSyncing);
        syncButton.disabled = isSyncing;
    }

    function updateBulbCount(count) {
        bulbCountNumber.textContent = count;
        bulbCount.classList.add('bulb-count--visible');
    }

    async function handleSync() {
        setSyncingState(true);
        
        try {
            // Call the default endpoint without any action to get all lights
            const response = await fetch(`${apiBaseUrl}${ENDPOINTS.LIGHTS}`);
            const data = await response.json();

            if (data.success) {
                // Update bulb count
                if (data.data && typeof data.data.count === 'number') {
                    updateBulbCount(data.data.count);
                }

                // Update status
                updateStatusDots(true);
                updateLastSync();
                console.log('Status synced:', data);
            } else {
                throw new Error(data.message || 'Failed to sync status');
            }
        } catch (error) {
            console.error(ERROR_MESSAGES.SYNC_STATUS, error);
            updateStatusDots(false);
            bulbCount.classList.remove('bulb-count--visible');
        } finally {
            setSyncingState(false);
        }
    }

    // Public API
    return {
        updateStatusDots,
        updateLastSync,
        handleSync
    };
}

// Helper function to update global config (used by other modules)
export function updateGlobalConfig(newConfig) {
    globalConfig = { ...globalConfig, ...newConfig };
}

// Export status update functions for use by other modules
export const statusUpdates = {
    updateStatusDots: (online = true) => {
        if (globalConfig && globalConfig.elements) {
            globalConfig.elements.statusDots.forEach(dot => {
                dot.classList.toggle('status-indicator__dot--offline', !online);
            });
        }
    },
    updateLastSync: () => {
        if (globalConfig && globalConfig.elements) {
            const now = new Date();
            globalConfig.elements.lastSync.textContent = now.toLocaleTimeString();
        }
    }
};
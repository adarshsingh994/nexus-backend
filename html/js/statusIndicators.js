import { ENDPOINTS, ERROR_MESSAGES } from './config.js';

let globalConfig;

export function initializeStatusIndicators(config) {
    globalConfig = config;
    const { apiBaseUrl, elements } = config;
    const { statusDots, lastSync } = elements;

    // Initialize buttons and UI elements
        const getLightsButton = document.getElementById('getLightsButton');
        const syncButton = document.getElementById('syncButton');
        const bulbCount = document.querySelector('.bulb-count');
        const bulbCountNumber = document.querySelector('.bulb-count__number');
        
        getLightsButton.addEventListener('click', handleGetLights);
        syncButton.addEventListener('click', handleSync);
    
        // Create toast container
        const toastContainer = document.createElement('div');
        toastContainer.classList.add('toast');
        document.body.appendChild(toastContainer);

    function updateStatusDots(online = true) {
        statusDots.forEach(dot => {
            dot.classList.toggle('status-indicator__dot--offline', !online);
        });
    }

    function updateLastSync() {
        const now = new Date();
        lastSync.textContent = now.toLocaleTimeString();
    }

    function showToast(message, type = 'success') {
        toastContainer.textContent = message;
        toastContainer.className = `toast toast--${type} toast--visible`;
        
        setTimeout(() => {
            toastContainer.classList.remove('toast--visible');
        }, 3000);
    }

    function setSyncingState(isSyncing) {
        getLightsButton.disabled = isSyncing;
        syncButton.disabled = isSyncing;
        syncButton.classList.toggle('button--syncing', isSyncing);
    }

    function updateBulbCount(count) {
        bulbCountNumber.textContent = count;
        bulbCount.classList.add('bulb-count--visible');
    }

    async function handleGetLights() {
        setSyncingState(true);
        
        try {
            const response = await fetch(`${apiBaseUrl}${ENDPOINTS.LIGHTS}`);
            const data = await response.json();

            if (data.success) {
                if (data.data && typeof data.data.count === 'number') {
                    updateBulbCount(data.data.count);
                }
                updateStatusDots(true);
                updateLastSync();
                showToast('Successfully retrieved lights count');
                console.log('Lights fetched:', data);
            } else {
                throw new Error(data.message || 'Failed to get lights');
            }
        } catch (error) {
            console.error(ERROR_MESSAGES.SYNC_STATUS, error);
            updateStatusDots(false);
            bulbCount.classList.remove('bulb-count--visible');
            showToast('Failed to get lights status', 'error');
        } finally {
            setSyncingState(false);
        }
    }

    async function handleSync() {
        setSyncingState(true);
        
        try {
            const response = await fetch(`${apiBaseUrl}${ENDPOINTS.SYNC}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();

            if (data.success) {
                showToast(data.message);
                updateStatusDots(true);
                updateLastSync();
                if (data.message.match(/(\d+)\s+light/)) {
                    const count = parseInt(data.message.match(/(\d+)\s+light/)[1]);
                    updateBulbCount(count);
                }
            } else {
                throw new Error(data.message || 'Failed to sync lights');
            }
        } catch (error) {
            console.error(ERROR_MESSAGES.SYNC_STATUS, error);
            updateStatusDots(false);
            showToast('Failed to sync lights', 'error');
        } finally {
            setSyncingState(false);
        }
    }

    // Public API
    return {
        updateStatusDots,
        updateLastSync,
        handleGetLights,
        handleSync,
        showToast
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
import { ENDPOINTS, ACTIONS, ERROR_MESSAGES } from './config.js';
import { statusUpdates } from './statusIndicators.js';

export function initializeLightControls(config) {
    const { apiBaseUrl } = config;
    let isOn = false;

    function updateButtonStyles() {
        const powerToggle = config.elements.powerToggle;
        if (powerToggle) {
            powerToggle.setAttribute('aria-pressed', isOn);
            powerToggle.querySelector('.button__text').textContent = isOn ? 'Turn Off' : 'Turn On';
            powerToggle.querySelector('i').classList.remove('fa-power-off');
            powerToggle.querySelector('i').classList.add(isOn ? 'fa-power-off' : 'fa-power-off');
            powerToggle.classList.toggle('button--active', isOn);
        }
    }

    async function toggleLights(action, color = null) {
        console.log('Calling API with action:', action);
        let url = `${apiBaseUrl}${ENDPOINTS.LIGHTS}`;
        const params = new URLSearchParams({ action });
        if (color) {
            params.append('color', color);
        }
        
        try {
            console.log('Making API request to:', `${url}?${params.toString()}`);
            const response = await fetch(`${url}?${params.toString()}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('API response:', data);

            if (data.overall_success) {
                isOn = action === ACTIONS.ON || action === ACTIONS.COLOR;
                updateButtonStyles();
                statusUpdates.updateStatusDots(true);
                statusUpdates.updateLastSync();
            } else {
                throw new Error(data.message || 'Failed to toggle lights');
            }

            return data;
        } catch (error) {
            console.error(ERROR_MESSAGES.TOGGLE_LIGHTS, error);
            statusUpdates.updateStatusDots(false);
            throw error;
        }
    }

    // Get DOM elements
    const powerToggle = config.elements.powerToggle;
    
    if (!powerToggle) {
        console.error('Power toggle button not found');
        return {
            toggleLights,
            updateButtonStyles,
            getIsOn: () => isOn,
            setIsOn: (value) => {
                isOn = value;
                updateButtonStyles();
            }
        };
    }

    console.log('Initializing power toggle button:', powerToggle);
    
    // Initialize event listeners
    powerToggle.addEventListener('click', async () => {
        try {
            const newState = !isOn;
            await toggleLights(newState ? ACTIONS.ON : ACTIONS.OFF);
            console.log(`Lights ${newState ? 'turned on' : 'turned off'}`);
        } catch (error) {
            console.error('Failed to toggle lights:', error);
        }
    });

    function updateButtonStyles() {
        powerToggle.setAttribute('aria-pressed', isOn);
        powerToggle.querySelector('.button__text').textContent = isOn ? 'Turn Off' : 'Turn On';
        powerToggle.querySelector('i').classList.remove('fa-power-off');
        powerToggle.querySelector('i').classList.add(isOn ? 'fa-power-off' : 'fa-power-off');
        powerToggle.classList.toggle('button--active', isOn);
    }

    async function toggleLights(action, color = null) {
        console.log('Calling API with action:', action);
        let url = `${apiBaseUrl}${ENDPOINTS.LIGHTS}`;
        const params = new URLSearchParams({ action });
        if (color) {
            params.append('color', color);
        }
        
        try {
            console.log('Making API request to:', `${url}?${params.toString()}`);
            const response = await fetch(`${url}?${params.toString()}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('API response:', data);

            if (data.overall_success) {
                isOn = action === ACTIONS.ON || action === ACTIONS.COLOR;
                updateButtonStyles();
                statusUpdates.updateStatusDots(true);
                statusUpdates.updateLastSync();
            } else {
                throw new Error(data.message || 'Failed to toggle lights');
            }

            return data;
        } catch (error) {
            console.error(ERROR_MESSAGES.TOGGLE_LIGHTS, error);
            statusUpdates.updateStatusDots(false);
            throw error;
        }
    }

    // Public API
    return {
        toggleLights,
        updateButtonStyles,
        getIsOn: () => isOn,
        setIsOn: (value) => {
            isOn = value;
            updateButtonStyles();
        }
    };
}
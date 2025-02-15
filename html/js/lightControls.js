import { ENDPOINTS, ACTIONS, ERROR_MESSAGES } from './config.js';
import { statusUpdates } from './statusIndicators.js';

export function initializeLightControls(config) {
    const { apiBaseUrl } = config;
    let isOn = false;

    // Get DOM elements
    const turnOnButton = document.getElementById('turnOn');
    const turnOffButton = document.getElementById('turnOff');

    // Initialize event listeners
    turnOnButton.addEventListener('click', () => toggleLights(ACTIONS.ON));
    turnOffButton.addEventListener('click', () => toggleLights(ACTIONS.OFF));

    function updateButtonStyles() {
        turnOnButton.classList.toggle('button--active', isOn);
        turnOffButton.classList.toggle('button--active', !isOn);
    }

    async function toggleLights(action, color = null) {
        let url = `${apiBaseUrl}${ENDPOINTS.LIGHTS}`;
        const params = new URLSearchParams({ action });
        if (color) {
            params.append('color', color);
        }
        
        try {
            const response = await fetch(`${url}?${params.toString()}`);
            const data = await response.json();

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
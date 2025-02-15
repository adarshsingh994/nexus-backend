import { ENDPOINTS, ACTIONS, ERROR_MESSAGES } from './config.js';
import { statusUpdates } from './statusIndicators.js';

export function initializeWhiteControls(config) {
    const { apiBaseUrl, elements } = config;
    const { whiteSlider, whiteValue } = elements;

    // Get DOM elements
    const setWarmWhiteButton = document.getElementById('setWarmWhite');
    const setColdWhiteButton = document.getElementById('setColdWhite');

    // Initialize event listeners
    whiteSlider.addEventListener('input', updateSliderValue);
    setWarmWhiteButton.addEventListener('click', () => setWhiteLight(ACTIONS.WARM_WHITE));
    setColdWhiteButton.addEventListener('click', () => setWhiteLight(ACTIONS.COLD_WHITE));

    function updateSliderValue() {
        const percentage = Math.round((whiteSlider.value / 255) * 100);
        whiteValue.textContent = `${percentage}%`;
    }

    async function setWhiteLight(type) {
        const intensity = whiteSlider.value;
        const url = `${apiBaseUrl}${ENDPOINTS.LIGHTS}`;
        const params = new URLSearchParams({
            action: type,
            intensity: intensity.toString()
        });
        
        try {
            const response = await fetch(`${url}?${params.toString()}`);
            const data = await response.json();

            if (data.overall_success) {
                console.log(`${type} set with intensity ${intensity}`);
                statusUpdates.updateStatusDots(true);
                statusUpdates.updateLastSync();
            } else {
                throw new Error(data.message || `Failed to set ${type}`);
            }

            return data;
        } catch (error) {
            console.error(ERROR_MESSAGES.SET_WHITE, error);
            statusUpdates.updateStatusDots(false);
            throw error;
        }
    }

    // Public API
    return {
        updateSliderValue,
        setWhiteLight,
        getIntensity: () => whiteSlider.value,
        setIntensity: (value) => {
            whiteSlider.value = value;
            updateSliderValue();
        }
    };
}
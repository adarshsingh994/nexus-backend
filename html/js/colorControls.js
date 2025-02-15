import { ENDPOINTS, ACTIONS, ERROR_MESSAGES } from './config.js';
import { statusUpdates } from './statusIndicators.js';

export function initializeColorControls(config) {
    const { apiBaseUrl, elements } = config;
    const { colorPicker, colorButtons } = elements;

    // Initialize event listeners
    colorPicker.addEventListener('input', handleColorPickerChange);
    colorButtons.forEach(button => {
        button.addEventListener('click', handleMoodColorClick);
    });

    function updateThemeColors(color) {
        const root = document.documentElement;
        root.style.setProperty('--primary', color);
        
        // Calculate darker and lighter variants
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        
        const darkR = Math.round(r * 0.8);
        const darkG = Math.round(g * 0.8);
        const darkB = Math.round(b * 0.8);
        root.style.setProperty('--primary-dark', `rgb(${darkR}, ${darkG}, ${darkB})`);
        
        const lightR = Math.round(r + (255 - r) * 0.3);
        const lightG = Math.round(g + (255 - g) * 0.3);
        const lightB = Math.round(b + (255 - b) * 0.3);
        root.style.setProperty('--primary-light', `rgb(${lightR}, ${lightG}, ${lightB})`);
    }

    function hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? 
            `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}` : 
            null;
    }

    function rgbToHex(r, g, b) {
        return '#' + [r, g, b].map(x => {
            const hex = x.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
    }

    async function setColor(color) {
        const url = `${apiBaseUrl}${ENDPOINTS.LIGHTS}`;
        const params = new URLSearchParams({
            action: ACTIONS.COLOR,
            color: color
        });
        
        try {
            const response = await fetch(`${url}?${params.toString()}`);
            const data = await response.json();

            if (data.overall_success) {
                statusUpdates.updateStatusDots(true);
                statusUpdates.updateLastSync();
            } else {
                throw new Error(data.message || 'Failed to set color');
            }

            return data;
        } catch (error) {
            console.error(ERROR_MESSAGES.SET_COLOR, error);
            statusUpdates.updateStatusDots(false);
            throw error;
        }
    }

    function handleColorPickerChange(e) {
        const color = e.target.value;
        updateThemeColors(color);
        const rgbColor = hexToRgb(color);
        if (rgbColor) {
            setColor(rgbColor);
        }
    }

    function handleMoodColorClick(e) {
        const color = e.currentTarget.dataset.color;
        if (color) {
            setColor(color);
            // Convert RGB to HEX for the color picker and theme
            const [r, g, b] = color.split(',').map(Number);
            const hex = rgbToHex(r, g, b);
            colorPicker.value = hex;
            updateThemeColors(hex);
        }
    }

    // Public API
    return {
        updateThemeColors,
        setColor,
        hexToRgb,
        rgbToHex
    };
}
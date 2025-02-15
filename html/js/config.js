// API Configuration
export const API_BASE_URL = 'http://192.168.18.4:3000/api';

// API Endpoints
export const ENDPOINTS = {
    LIGHTS: '/lights'
};

// API Actions
export const ACTIONS = {
    ON: 'on',
    OFF: 'off',
    COLOR: 'color',
    WARM_WHITE: 'warm_white',
    COLD_WHITE: 'cold_white'
};

// Default Values
export const DEFAULTS = {
    WHITE_INTENSITY: 255,
    COLOR: '#ffffff'
};

// Error Messages
export const ERROR_MESSAGES = {
    TOGGLE_LIGHTS: 'Error toggling lights:',
    SYNC_STATUS: 'Error syncing status:',
    SET_WHITE: 'Error setting white light:',
    SET_COLOR: 'Error setting color:'
};
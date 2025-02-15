import { initializeLightControls } from './lightControls.js';
import { initializeColorControls } from './colorControls.js';
import { initializeStatusIndicators } from './statusIndicators.js';
import { initializeWhiteControls } from './whiteControls.js';
import { API_BASE_URL } from './config.js';

// Initialize all modules when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Test API connection
    console.log('fetching')
    fetch(`${API_BASE_URL}/lights`)
        .then(response => response.json())
        .then(data => {
            console.log('API connection successful:', data);
        })
        .catch(error => {
            console.error('API connection failed:', error);
            // Update status dots to show offline state
            document.querySelectorAll('.status-indicator__dot').forEach(dot => {
                dot.classList.add('status-indicator__dot--offline');
            });
        });

    const config = {
        apiBaseUrl: API_BASE_URL,
        elements: {
            colorPicker: document.getElementById('colorPicker'),
            whiteSlider: document.getElementById('whiteSlider'),
            whiteValue: document.getElementById('whiteValue'),
            lastSync: document.getElementById('lastSync'),
            statusDots: document.querySelectorAll('.status-indicator__dot'),
            colorButtons: document.querySelectorAll('.color-btn')
        }
    };

    // Initialize all modules with shared configuration
    const modules = {
        lightControls: initializeLightControls(config),
        colorControls: initializeColorControls(config),
        statusIndicators: initializeStatusIndicators(config),
        whiteControls: initializeWhiteControls(config)
    };

    // Initial setup
    modules.statusIndicators.updateSliderValue();
    modules.statusIndicators.handleSync();

    // Add error handling for fetch requests
    window.addEventListener('unhandledrejection', event => {
        console.error('Unhandled promise rejection:', event.reason);
        if (event.reason.message.includes('Failed to fetch') || 
            event.reason.message.includes('NetworkError')) {
            // Update all status indicators to show offline state
            document.querySelectorAll('.status-indicator__dot').forEach(dot => {
                dot.classList.add('status-indicator__dot--offline');
            });
        }
    });
});
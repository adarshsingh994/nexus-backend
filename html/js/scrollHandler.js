// Scroll performance optimization
let scrollTimeout;
const body = document.body;

// Add scroll listener to pause animations during scroll
window.addEventListener('scroll', () => {
    // Add scrolling class immediately when scroll starts
    body.classList.add('is-scrolling');
    
    // Clear any existing timeout
    clearTimeout(scrollTimeout);
    
    // Set a new timeout to remove the class after scroll ends
    scrollTimeout = setTimeout(() => {
        body.classList.remove('is-scrolling');
    }, 150); // Wait 150ms after scroll ends before resuming animations
}, { passive: true }); // Use passive listener for better scroll performance
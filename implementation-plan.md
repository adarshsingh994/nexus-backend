# Light Control Toggle Button Implementation Plan

## Current State
- Two separate buttons for power on/off
- Uses neumorphic design with shadow effects
- Responsive design for mobile devices
- API integration for light control

## Implementation Steps

1. HTML Changes
   - Replace the two separate buttons with a single toggle button
   - Update button text and icon to reflect state
   - Maintain neumorphic design pattern

2. CSS Updates
   - Create new toggle button styles
   - Implement state-based styling (on/off)
   - Enhance touch target size for mobile
   - Add smooth transitions for state changes
   - Maintain existing neumorphic shadow effects

3. JavaScript Updates
   - Modify light controls to handle toggle state
   - Update button text/icon based on state
   - Maintain API integration
   - Add appropriate state feedback

## Detailed Implementation

### HTML Structure
```html
<button id="powerToggle" class="button button--toggle" aria-pressed="false">
    <i class="fas fa-power-off"></i>
    <span class="button__text">Turn On</span>
</button>
```

### CSS Styling
```css
.button--toggle {
    min-width: 120px;
    min-height: 48px; /* Enhanced touch target */
    position: relative;
    transition: all 0.3s ease;
}

.button--toggle[aria-pressed="true"] {
    color: var(--primary);
    box-shadow: var(--shadow-inset-sm);
}

.button--toggle[aria-pressed="false"] {
    color: var(--text);
    box-shadow: var(--shadow-sm);
}
```

### JavaScript Logic
```javascript
const powerToggle = document.getElementById('powerToggle');
let isOn = false;

powerToggle.addEventListener('click', () => {
    const newState = !isOn;
    toggleLights(newState ? ACTIONS.ON : ACTIONS.OFF);
});

function updateToggleState(isOn) {
    powerToggle.setAttribute('aria-pressed', isOn);
    powerToggle.querySelector('.button__text').textContent = isOn ? 'Turn Off' : 'Turn On';
}
```

## Mobile Considerations
- Increased touch target size (48px minimum)
- Clear visual feedback for touch interactions
- Smooth state transitions
- Proper touch event handling

## Testing Plan
1. Verify toggle button styling matches neumorphic design
2. Test touch interactions on mobile devices
3. Verify API integration for both on/off states
4. Test state persistence and visual feedback
5. Verify accessibility features (aria-pressed, focus states)

## Success Criteria
- Single button toggles lights on/off
- Clear visual indication of current state
- Smooth transitions between states
- Mobile-friendly touch interactions
- Maintains existing API functionality
- Follows neumorphic design pattern
# Loading State Troubleshooting Guide

## Overview

This guide helps developers diagnose and fix common issues with the eConsultation AI loading state management system. The system is designed to prevent unwanted automatic loading states and ensure predictable loading behavior.

## Quick Diagnosis

### 1. Check Current Loading States

```javascript
// In browser console (development mode)
window.loadingStateManager?.getDebugInfo()

// Or in React component
const { getDebugInfo } = useLoadingState();
console.log(getDebugInfo());
```

### 2. Check for Automatic Loading Detection

```javascript
// Check for unwanted automatic loading
const debugInfo = window.loadingStateManager?.getDebugInfo();
if (debugInfo?.automaticLoadingDetections?.length > 0) {
  console.warn('Automatic loading detected:', debugInfo.automaticLoadingDetections);
}
```

### 3. Verify CSS Animation Control

```javascript
// Check for automatic CSS animations
const elements = document.querySelectorAll('[class*="animate-"]');
elements.forEach(el => {
  const style = getComputedStyle(el);
  if (style.animation !== 'none' && !el.className.includes('loading-') && !el.className.includes('-active')) {
    console.warn('Uncontrolled animation detected:', el);
  }
});
```

## Common Issues and Solutions

### Issue 1: Spinning Circle Appears Automatically

**Symptoms:**
- Loading spinner appears on page load without user action
- Spinning circle shows up after 2-3 seconds automatically
- Loading state active without explicit user trigger

**Diagnosis:**
```javascript
// Check for automatic loading triggers
const debugInfo = window.loadingStateManager?.getDebugInfo();
console.log('Automatic loading detections:', debugInfo?.automaticLoadingDetections);
console.log('Unexpected loading warnings:', debugInfo?.unexpectedLoadingWarnings);
```

**Common Causes:**

1. **useEffect triggering loading**
```jsx
// ❌ PROBLEM: Automatic loading in useEffect
useEffect(() => {
  startLoading('fetchData'); // No user action!
  fetchData();
}, []);

// ✅ SOLUTION: Remove automatic loading
useEffect(() => {
  // Don't start loading automatically
  // Let user trigger loading explicitly
}, []);

const handleLoadClick = (event) => {
  startLoading('fetchData', {
    userAction: 'Load data button click',
    triggerElement: event.target
  });
  fetchData();
};
```

2. **CSS animations running automatically**
```css
/* ❌ PROBLEM: Global animation that runs automatically */
.some-element {
  animation: spin 1s linear infinite;
}

/* ✅ SOLUTION: Controlled animation */
.some-element.loading-spinner-active {
  animation: spin 1s linear infinite;
}
```

3. **Third-party library causing animations**
```jsx
// Check for third-party CSS or JS libraries
// Look in browser DevTools > Elements > Computed styles
// Search for elements with active animations
```

**Solutions:**

1. **Remove automatic loading triggers:**
```jsx
// Remove all startLoading calls from useEffect hooks
// Replace with user-triggered loading
```

2. **Update CSS to use controlled classes:**
```jsx
// Ensure all loading animations use loading-*-active classes
<div className={`animate-spin ${isLoading('op') ? 'loading-spinner-active' : ''}`}>
```

3. **Add debug logging to track triggers:**
```jsx
const { startLoading } = useLoadingState();

// Wrap startLoading to add debugging
const debugStartLoading = (operation, options = {}) => {
  console.log('Loading started:', operation, options, new Error().stack);
  startLoading(operation, options);
};
```

### Issue 2: Loading State Stuck/Never Stops

**Symptoms:**
- Loading indicator never disappears
- Button remains disabled after operation completes
- Loading overlay stays visible

**Diagnosis:**
```javascript
// Check active operations
const { getActiveOperations } = useLoadingState();
console.log('Active operations:', getActiveOperations());

// Check operation history
const { getOperationHistory } = useLoadingState();
console.log('Recent operations:', getOperationHistory().slice(-10));
```

**Common Causes:**

1. **Missing stopLoading call**
```jsx
// ❌ PROBLEM: stopLoading not called on error
const handleClick = async () => {
  startLoading('myOp');
  try {
    await performOperation();
    stopLoading('myOp'); // Only called on success!
  } catch (error) {
    // stopLoading never called on error
  }
};

// ✅ SOLUTION: Use finally block
const handleClick = async () => {
  try {
    startLoading('myOp', { userAction: 'button click' });
    await performOperation();
  } catch (error) {
    console.error('Operation failed:', error);
  } finally {
    stopLoading('myOp'); // Always called
  }
};
```

2. **Mismatched operation names**
```jsx
// ❌ PROBLEM: Different operation names
startLoading('fetchData');
// ... later
stopLoading('fetchdata'); // Typo! Different name

// ✅ SOLUTION: Use constants
const OPERATIONS = {
  FETCH_DATA: 'fetchData'
};

startLoading(OPERATIONS.FETCH_DATA);
stopLoading(OPERATIONS.FETCH_DATA);
```

3. **Promise rejection not handled**
```jsx
// ❌ PROBLEM: Unhandled promise rejection
const handleClick = () => {
  startLoading('myOp');
  performOperation() // No .catch() or try/catch
    .then(result => {
      stopLoading('myOp');
    });
};

// ✅ SOLUTION: Handle all promise outcomes
const handleClick = async () => {
  try {
    startLoading('myOp', { userAction: 'button click' });
    const result = await performOperation();
    // Handle success
  } catch (error) {
    // Handle error
    console.error('Operation failed:', error);
  } finally {
    stopLoading('myOp');
  }
};
```

**Solutions:**

1. **Use withLoading helper:**
```jsx
const { withLoading } = useLoadingState();

const handleClick = async () => {
  try {
    const result = await withLoading(
      'myOperation',
      async () => await performOperation(),
      { userAction: 'button click' }
    );
    // Handle result
  } catch (error) {
    // Handle error
  }
  // Loading automatically stopped
};
```

2. **Manual cleanup:**
```jsx
// Force stop all loading states
const { cleanup } = useLoadingState();
cleanup(); // Stops all active loading states
```

3. **Add timeout protection:**
```jsx
const handleClick = async () => {
  const timeoutId = setTimeout(() => {
    stopLoading('myOp');
    console.warn('Operation timed out');
  }, 30000); // 30 second timeout

  try {
    startLoading('myOp', { userAction: 'button click' });
    await performOperation();
    clearTimeout(timeoutId);
  } finally {
    stopLoading('myOp');
  }
};
```

### Issue 3: Loading State Not Updating UI

**Symptoms:**
- Loading state changes but UI doesn't update
- Button doesn't show loading state
- Loading indicator doesn't appear

**Diagnosis:**
```javascript
// Check if hook is being used correctly
const { isLoading } = useLoadingState();
console.log('Is loading:', isLoading('myOp'));

// Check if component is re-rendering
console.log('Component render:', Date.now());
```

**Common Causes:**

1. **Not using useLoadingState hook**
```jsx
// ❌ PROBLEM: Direct LoadingStateManager usage
const manager = new LoadingStateManager();
manager.startLoading('myOp');
// Component won't re-render

// ✅ SOLUTION: Use hook
const { startLoading, isLoading } = useLoadingState();
startLoading('myOp');
// Hook triggers re-render
```

2. **Stale closure in useEffect**
```jsx
// ❌ PROBLEM: Stale closure
const { isLoading } = useLoadingState();

useEffect(() => {
  const checkLoading = () => {
    console.log(isLoading('myOp')); // Stale value
  };
  
  const interval = setInterval(checkLoading, 1000);
  return () => clearInterval(interval);
}, []); // Missing dependency

// ✅ SOLUTION: Include dependencies
useEffect(() => {
  const checkLoading = () => {
    console.log(isLoading('myOp'));
  };
  
  const interval = setInterval(checkLoading, 1000);
  return () => clearInterval(interval);
}, [isLoading]); // Include dependency
```

3. **Component not subscribed to loading state**
```jsx
// ❌ PROBLEM: Component doesn't use loading state
const MyComponent = () => {
  // Component doesn't call useLoadingState
  return <button>Click me</button>;
};

// ✅ SOLUTION: Use hook to subscribe
const MyComponent = () => {
  const { isLoading } = useLoadingState();
  
  return (
    <button disabled={isLoading('myOp')}>
      {isLoading('myOp') ? 'Loading...' : 'Click me'}
    </button>
  );
};
```

**Solutions:**

1. **Always use useLoadingState hook:**
```jsx
const { startLoading, stopLoading, isLoading } = useLoadingState();
```

2. **Force re-render for debugging:**
```jsx
const [, forceUpdate] = useReducer(x => x + 1, 0);

// Call forceUpdate() to trigger re-render
```

3. **Check React DevTools:**
- Open React DevTools
- Find your component
- Check if loading state is in component state
- Verify re-renders are happening

### Issue 4: CSS Animations Not Working

**Symptoms:**
- Loading spinner doesn't animate
- CSS transitions not working
- Visual loading effects not appearing

**Diagnosis:**
```javascript
// Check CSS classes
const element = document.querySelector('.my-loading-element');
console.log('Classes:', element.className);
console.log('Computed style:', getComputedStyle(element).animation);

// Check for loading-active classes
const hasActiveClass = element.className.includes('loading-') && element.className.includes('-active');
console.log('Has active class:', hasActiveClass);
```

**Common Causes:**

1. **Missing loading-active class**
```jsx
// ❌ PROBLEM: Only base animation class
<div className="animate-spin">
  <svg>...</svg>
</div>

// ✅ SOLUTION: Add loading-active class
<div className={`animate-spin ${isLoading('myOp') ? 'loading-spinner-active' : ''}`}>
  <svg>...</svg>
</div>
```

2. **CSS override issues**
```css
/* ❌ PROBLEM: CSS specificity issues */
.my-element {
  animation: none !important; /* Overrides loading animation */
}

/* ✅ SOLUTION: More specific selector */
.my-element.loading-spinner-active {
  animation: spin 1s linear infinite !important;
}
```

3. **Tailwind CSS purging classes**
```javascript
// ✅ SOLUTION: Add to Tailwind safelist
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  safelist: [
    'loading-spinner-active',
    'loading-pulse-active',
    'loading-fade-active'
  ]
};
```

**Solutions:**

1. **Use LoadingIndicator components:**
```jsx
import { Spinner, LoadingButton } from '../components/LoadingIndicator';

<Spinner active={isLoading('myOp')} />
<LoadingButton loading={isLoading('myOp')} onClick={handleClick}>
  Click Me
</LoadingButton>
```

2. **Check CSS loading control:**
```jsx
// Verify CSS system is working
const testElement = document.createElement('div');
testElement.className = 'animate-spin loading-spinner-active';
document.body.appendChild(testElement);
console.log('Animation:', getComputedStyle(testElement).animation);
document.body.removeChild(testElement);
```

### Issue 5: Multiple Loading States Conflicting

**Symptoms:**
- Multiple loading indicators for same operation
- Loading states interfering with each other
- Inconsistent loading behavior

**Diagnosis:**
```javascript
// Check for duplicate operations
const { getActiveOperations } = useLoadingState();
const operations = getActiveOperations();
console.log('Active operations:', Object.keys(operations));

// Check operation history for patterns
const { getOperationHistory } = useLoadingState();
const history = getOperationHistory();
const recentOps = history.slice(-20).map(op => op.operation);
console.log('Recent operations:', recentOps);
```

**Common Causes:**

1. **Multiple components starting same operation**
```jsx
// ❌ PROBLEM: Multiple components with same operation name
// Component A
startLoading('fetchData');

// Component B (different component, same operation name)
startLoading('fetchData'); // Conflicts with Component A

// ✅ SOLUTION: Use unique operation names
// Component A
startLoading('fetchCommentsData');

// Component B
startLoading('fetchStatsData');
```

2. **Rapid clicking causing multiple operations**
```jsx
// ❌ PROBLEM: No protection against rapid clicks
const handleClick = async () => {
  startLoading('myOp');
  await performOperation();
  stopLoading('myOp');
};

// ✅ SOLUTION: Check if already loading
const handleClick = async () => {
  if (isLoading('myOp')) {
    return; // Prevent duplicate operations
  }
  
  try {
    startLoading('myOp', { userAction: 'button click' });
    await performOperation();
  } finally {
    stopLoading('myOp');
  }
};
```

3. **Component re-mounting causing duplicate operations**
```jsx
// ❌ PROBLEM: useEffect running on every mount
useEffect(() => {
  if (shouldLoad) {
    startLoading('autoLoad');
    loadData();
  }
}, [shouldLoad]); // Runs on every shouldLoad change

// ✅ SOLUTION: Add loading check
useEffect(() => {
  if (shouldLoad && !isLoading('autoLoad')) {
    startLoading('autoLoad', { userAction: 'component mount' });
    loadData();
  }
}, [shouldLoad, isLoading]);
```

**Solutions:**

1. **Use operation prefixes:**
```jsx
// Prefix operations with component name
const COMPONENT_PREFIX = 'MyComponent';

startLoading(`${COMPONENT_PREFIX}_fetchData`);
startLoading(`${COMPONENT_PREFIX}_submitForm`);
```

2. **Implement operation queuing:**
```jsx
const { withLoading } = useLoadingState();

const handleMultipleClicks = async () => {
  // withLoading automatically prevents duplicates
  await withLoading('myOp', performOperation, { userAction: 'button click' });
};
```

3. **Use React.memo to prevent unnecessary re-renders:**
```jsx
const MyComponent = React.memo(({ data }) => {
  const { isLoading } = useLoadingState();
  
  return (
    <div>
      {isLoading('fetchData') && <Spinner />}
      {/* Component content */}
    </div>
  );
});
```

## Debug Tools and Commands

### Browser Console Commands (Development Only)

```javascript
// Get current loading state
window.loadingStateManager?.getDebugInfo()

// Get operation history
window.loadingStateManager?.getOperationHistory()

// Force stop all loading
window.loadingStateManager?.cleanup()

// Check for automatic loading
window.loadingStateManager?.getDebugInfo()?.automaticLoadingDetections

// Get performance metrics
window.loadingStateManager?.getDebugInfo()?.performanceMetrics

// Check CSS animation control
window.loadingDebugUtils?.checkCSSAnimationControl()

// Run health check
window.loadingDebugUtils?.runHealthCheck()
```

### Keyboard Shortcuts (Development Only)

- `Ctrl+Shift+L`: Toggle loading debug panel
- `Ctrl+Shift+R`: Generate debug report
- `Ctrl+Shift+H`: Run health check
- `Ctrl+Shift+C`: Clear debug history

### Debug Panel

Enable the debug panel in development:

```jsx
import { LoadingStateDebugPanel } from '../components/LoadingStateDebugPanel';

// Add to your app (development only)
{process.env.NODE_ENV === 'development' && (
  <LoadingStateDebugPanel />
)}
```

## Testing and Validation

### Automated Tests

Run the loading state tests:

```bash
# Run all loading state tests
npm test -- --testPathPattern="LoadingState|Loading" --watchAll=false

# Run specific test suites
npm test -- --testPathPattern="AutomatedLoadingDetection" --watchAll=false
npm test -- --testPathPattern="CSSLoadingControl" --watchAll=false
npm test -- --testPathPattern="LoadingStateManager" --watchAll=false
```

### Manual Testing Checklist

1. **Page Load Test:**
   - [ ] No loading indicators appear on page load
   - [ ] No automatic animations start
   - [ ] Console shows no automatic loading warnings

2. **User Action Test:**
   - [ ] Loading appears only when user clicks buttons
   - [ ] Loading disappears when operation completes
   - [ ] Loading shows appropriate feedback

3. **Error Handling Test:**
   - [ ] Loading stops when operations fail
   - [ ] Error messages appear appropriately
   - [ ] No stuck loading states

4. **CSS Animation Test:**
   - [ ] Animations only work with loading-active classes
   - [ ] No global animations run automatically
   - [ ] Loading indicators animate correctly

### Health Check Script

```javascript
// Run comprehensive health check
const runHealthCheck = () => {
  const issues = [];
  
  // Check for active loading states
  const activeOps = window.loadingStateManager?.getActiveOperations();
  if (activeOps && Object.keys(activeOps).length > 0) {
    issues.push(`Active loading operations: ${Object.keys(activeOps).join(', ')}`);
  }
  
  // Check for automatic animations
  const animatedElements = document.querySelectorAll('[style*="animation"], [class*="animate-"]');
  animatedElements.forEach(el => {
    const style = getComputedStyle(el);
    if (style.animation !== 'none' && !el.className.includes('loading-') && !el.className.includes('-active')) {
      issues.push(`Uncontrolled animation on element: ${el.tagName}.${el.className}`);
    }
  });
  
  // Check for unexpected loading warnings
  const debugInfo = window.loadingStateManager?.getDebugInfo();
  if (debugInfo?.unexpectedLoadingWarnings?.length > 0) {
    issues.push(`Unexpected loading warnings: ${debugInfo.unexpectedLoadingWarnings.length}`);
  }
  
  if (issues.length === 0) {
    console.log('✅ Health check passed - no issues detected');
  } else {
    console.warn('❌ Health check failed - issues detected:');
    issues.forEach(issue => console.warn('  -', issue));
  }
  
  return issues.length === 0;
};

// Run health check
runHealthCheck();
```

## Performance Troubleshooting

### Issue: Slow Loading State Updates

**Diagnosis:**
```javascript
// Check performance metrics
const debugInfo = window.loadingStateManager?.getDebugInfo();
console.log('Performance metrics:', debugInfo?.performanceMetrics);

// Measure loading state update time
const start = performance.now();
startLoading('testOp', { userAction: 'performance test' });
const end = performance.now();
console.log('Loading state update time:', end - start, 'ms');
stopLoading('testOp');
```

**Solutions:**
1. Reduce number of concurrent loading operations
2. Use React.memo for components that don't need frequent updates
3. Optimize loading state checks with useMemo

### Issue: Memory Leaks

**Diagnosis:**
```javascript
// Check operation history size
const history = window.loadingStateManager?.getOperationHistory();
console.log('Operation history size:', history?.length);

// Check for cleanup
window.addEventListener('beforeunload', () => {
  const activeOps = window.loadingStateManager?.getActiveOperations();
  if (Object.keys(activeOps || {}).length > 0) {
    console.warn('Active operations on page unload:', activeOps);
  }
});
```

**Solutions:**
1. Call cleanup() on component unmount
2. Limit operation history size
3. Use proper cleanup in useEffect

## Production Issues

### Issue: Loading States Not Working in Production

**Common Causes:**
1. Debug mode disabled in production
2. Console logging removed by build process
3. CSS classes purged by build optimization

**Solutions:**
1. Check production configuration
2. Verify CSS classes are included in build
3. Test production build locally

### Issue: Performance Impact in Production

**Diagnosis:**
```javascript
// Check if production safeguards are enabled
const safeguards = window.loadingStateManager?.productionSafeguards;
console.log('Production safeguards enabled:', !!safeguards);
```

**Solutions:**
1. Ensure production safeguards are properly configured
2. Disable debug logging in production
3. Optimize loading state operations

## Getting Help

### Before Asking for Help

1. Run the health check script
2. Check browser console for errors and warnings
3. Review recent code changes
4. Test in different browsers
5. Check if issue occurs in development vs production

### Information to Provide

When reporting issues, include:

1. **Environment:** Development/Production, Browser, OS
2. **Steps to Reproduce:** Exact steps that cause the issue
3. **Expected Behavior:** What should happen
4. **Actual Behavior:** What actually happens
5. **Debug Information:** Output from debug commands
6. **Console Logs:** Any errors or warnings in console
7. **Code Samples:** Relevant code that might be causing the issue

### Debug Information Template

```javascript
// Copy and paste this debug information when reporting issues
const debugReport = {
  timestamp: new Date().toISOString(),
  environment: process.env.NODE_ENV,
  userAgent: navigator.userAgent,
  debugInfo: window.loadingStateManager?.getDebugInfo(),
  operationHistory: window.loadingStateManager?.getOperationHistory()?.slice(-10),
  activeOperations: window.loadingStateManager?.getActiveOperations(),
  healthCheck: runHealthCheck()
};

console.log('Debug Report:', JSON.stringify(debugReport, null, 2));
```

## Related Documentation

- [Loading State Developer Guidelines](./LOADING_STATE_DEVELOPER_GUIDELINES.md)
- [LoadingStateManager API Reference](./components/LoadingStateManager.README.md)
- [CSS Loading Control System](./styles/CSS_LOADING_CONTROL_README.md)
- [Production Safeguards](./utils/PRODUCTION_SAFEGUARDS_README.md)
# LoadingStateManager API Reference

## Overview

The LoadingStateManager provides a comprehensive API for managing loading states in the eConsultation AI application. This document provides detailed information about all available methods, options, and usage patterns.

## Table of Contents

1. [LoadingStateManager Class](#loadingstatemanager-class)
2. [useLoadingState Hook](#useloadingstate-hook)
3. [Loading Indicator Components](#loading-indicator-components)
4. [Helper Functions](#helper-functions)
5. [Debug and Monitoring APIs](#debug-and-monitoring-apis)
6. [Production Safeguards APIs](#production-safeguards-apis)
7. [Error Handling APIs](#error-handling-apis)
8. [CSS Integration APIs](#css-integration-apis)

## LoadingStateManager Class

### Constructor

```javascript
new LoadingStateManager(debugMode = process.env.NODE_ENV === 'development')
```

**Parameters:**
- `debugMode` (boolean): Enable debug logging and monitoring. Defaults to development mode.

**Returns:** LoadingStateManager instance

**Example:**
```javascript
import LoadingStateManager from './components/LoadingStateManager';

const loadingManager = new LoadingStateManager(true); // Force debug mode
```

### Core Methods

#### startLoading(operation, options)

Start a loading operation with explicit operation name and user action correlation.

**Parameters:**
- `operation` (string, required): Unique name for the operation
- `options` (object, optional): Configuration options

**Options:**
- `userAction` (string): Description of user action that triggered loading
- `triggerElement` (HTMLElement): DOM element that triggered the loading
- `timeout` (number): Custom timeout in milliseconds (default: 30000)
- `onError` (function): Error callback for this operation
- `onTimeout` (function): Timeout callback for this operation
- `expectedDuration` (number): Expected duration for UX validation

**Returns:** string - Operation ID

**Example:**
```javascript
const operationId = loadingManager.startLoading('fetchComments', {
  userAction: 'Load comments button click',
  triggerElement: event.target,
  timeout: 15000,
  expectedDuration: 3000,
  onError: (error) => console.error('Loading failed:', error),
  onTimeout: () => console.warn('Loading timed out')
});
```

**Throws:**
- `Error` - If operation name is invalid or missing

#### stopLoading(operation, options)

Stop a loading operation and clean up associated resources.

**Parameters:**
- `operation` (string, required): Name of operation to stop
- `options` (object, optional): Stop options

**Options:**
- `isTimeout` (boolean): Whether stop was triggered by timeout
- `isError` (boolean): Whether stop was triggered by error
- `cancelled` (boolean): Whether operation was cancelled by user

**Returns:** void

**Example:**
```javascript
loadingManager.stopLoading('fetchComments', {
  isError: false,
  cancelled: false
});
```

#### isLoading(operation)

Check if a specific operation or any operation is loading.

**Parameters:**
- `operation` (string, optional): Specific operation to check. If omitted, checks if any operation is loading.

**Returns:** boolean

**Example:**
```javascript
// Check specific operation
if (loadingManager.isLoading('fetchComments')) {
  console.log('Comments are loading');
}

// Check if any operation is loading
if (loadingManager.isLoading()) {
  console.log('Something is loading');
}
```

#### getActiveOperations()

Get all currently active loading operations.

**Returns:** Object - Object with operation names as keys and operation data as values

**Example:**
```javascript
const activeOps = loadingManager.getActiveOperations();
console.log('Active operations:', Object.keys(activeOps));
console.log('Operation details:', activeOps);
```

#### cleanup()

Clean up all active loading states. Useful for component unmount.

**Returns:** void

**Example:**
```javascript
// In React component cleanup
useEffect(() => {
  return () => {
    loadingManager.cleanup();
  };
}, []);
```

### Debug and Monitoring Methods

#### getDebugInfo()

Get comprehensive debug information about loading state system.

**Returns:** Object - Debug information

**Properties:**
- `activeOperations` (Array): Currently active operations
- `operationCount` (number): Number of active operations
- `debugMode` (boolean): Whether debug mode is enabled
- `sessionId` (string): Debug session identifier
- `unexpectedLoadingWarnings` (Array): Warnings about non-user-triggered loading
- `performanceMetrics` (Object): Performance data for operations
- `automaticLoadingDetections` (Array): Detected automatic loading triggers

**Example:**
```javascript
const debugInfo = loadingManager.getDebugInfo();
console.log('Debug Info:', debugInfo);

if (debugInfo.unexpectedLoadingWarnings.length > 0) {
  console.warn('Issues detected:', debugInfo.unexpectedLoadingWarnings);
}
```

#### getOperationHistory()

Get history of loading operations for debugging.

**Returns:** Array - Array of operation records with timing and debug information

**Example:**
```javascript
const history = loadingManager.getOperationHistory();
console.log('Recent operations:', history.slice(0, 10));

// Analyze performance
const slowOperations = history.filter(op => op.duration > 5000);
console.log('Slow operations:', slowOperations);
```

#### generateSummaryReport()

Generate comprehensive summary report of loading state system health.

**Returns:** Object - Summary report

**Example:**
```javascript
const report = loadingManager.generateSummaryReport();
console.log('System Health:', report.overallHealth);
console.log('Performance Summary:', report.performanceSummary);
```

### Error Handling Methods

#### setErrorCallback(operation, callback)

Set error callback for specific operation.

**Parameters:**
- `operation` (string): Operation name
- `callback` (function): Error callback function

**Example:**
```javascript
loadingManager.setErrorCallback('fetchComments', (error) => {
  console.error('Comments loading failed:', error);
  showErrorMessage('Failed to load comments');
});
```

#### handleLoadingError(operation, error, options)

Handle loading state errors with proper cleanup.

**Parameters:**
- `operation` (string): Operation name
- `error` (Error): Error object
- `options` (object): Original operation options

**Example:**
```javascript
try {
  await performOperation();
} catch (error) {
  loadingManager.handleLoadingError('myOperation', error, options);
  throw error;
}
```

## useLoadingState Hook

React hook that provides easy integration with LoadingStateManager.

### Basic Usage

```javascript
import { useLoadingState } from '../hooks/useLoadingState';

function MyComponent() {
  const { startLoading, stopLoading, isLoading } = useLoadingState();
  
  // Use loading state methods
}
```

### Hook Return Object

The hook returns an object with the following properties and methods:

#### Methods

- `startLoading(operation, options)`: Start loading operation
- `stopLoading(operation, options)`: Stop loading operation
- `isLoading(operation?)`: Check loading state
- `withLoading(operation, asyncFn, options)`: Helper for wrapping async operations
- `createLoadingHandler(operation, handler, options)`: Create loading-aware event handler
- `getActiveOperations()`: Get active operations
- `getOperationHistory()`: Get operation history
- `getDebugInfo()`: Get debug information
- `cleanup()`: Clean up all loading states

#### Properties

- `hasAnyLoading` (boolean): True if any operation is loading
- `activeOperationCount` (number): Number of active operations
- `loadingManager` (LoadingStateManager): Direct access to manager instance

### Helper Methods

#### withLoading(operation, asyncFn, options)

Wrap an async function with loading state management.

**Parameters:**
- `operation` (string): Operation name
- `asyncFn` (function): Async function to execute
- `options` (object): Loading options

**Returns:** Promise - Result of async function

**Example:**
```javascript
const { withLoading } = useLoadingState();

const handleClick = async () => {
  try {
    const result = await withLoading(
      'fetchData',
      async () => {
        const response = await fetch('/api/data');
        return response.json();
      },
      {
        userAction: 'Button click',
        expectedDuration: 2000
      }
    );
    
    setData(result);
  } catch (error) {
    setError(error.message);
  }
};
```

#### createLoadingHandler(operation, handler, options)

Create an event handler that automatically manages loading state.

**Parameters:**
- `operation` (string): Operation name
- `handler` (function): Event handler function
- `options` (object): Loading options

**Returns:** function - Loading-aware event handler

**Example:**
```javascript
const { createLoadingHandler } = useLoadingState();

const handleSubmit = createLoadingHandler(
  'submitForm',
  async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    await submitForm(formData);
  },
  {
    userAction: 'Form submission',
    timeout: 10000
  }
);

return <form onSubmit={handleSubmit}>...</form>;
```

## Loading Indicator Components

### LoadingButton

Button component with integrated loading state.

**Props:**
- `loading` (boolean): Whether button is in loading state
- `loadingText` (string): Text to show when loading
- `onClick` (function): Click handler
- `disabled` (boolean): Whether button is disabled
- `className` (string): CSS classes
- `children` (ReactNode): Button content

**Example:**
```javascript
import { LoadingButton } from '../components/LoadingIndicator';

<LoadingButton
  loading={isLoading('submitForm')}
  loadingText="Submitting..."
  onClick={handleSubmit}
  className="bg-blue-600 text-white px-4 py-2 rounded"
>
  Submit Form
</LoadingButton>
```

### LoadingOverlay

Full-screen loading overlay component.

**Props:**
- `active` (boolean): Whether overlay is active
- `message` (string): Loading message to display
- `operation` (string): Operation name for debugging
- `showProgress` (boolean): Whether to show progress indicator
- `onCancel` (function): Cancel callback (optional)

**Example:**
```javascript
import { LoadingOverlay } from '../components/LoadingIndicator';

<LoadingOverlay
  active={isLoading('uploadFile')}
  message="Uploading file..."
  operation="uploadFile"
  showProgress={true}
  onCancel={() => cancelUpload()}
/>
```

### InlineLoadingIndicator

Inline loading indicator for text content.

**Props:**
- `loading` (boolean): Whether loading is active
- `loadingText` (string): Text to show when loading
- `normalText` (string): Text to show when not loading
- `className` (string): CSS classes

**Example:**
```javascript
import { InlineLoadingIndicator } from '../components/LoadingIndicator';

<InlineLoadingIndicator
  loading={isLoading('fetchStats')}
  loadingText="Loading statistics..."
  normalText="Statistics ready"
  className="text-sm text-gray-600"
/>
```

### Spinner

Basic spinner component with controlled animation.

**Props:**
- `active` (boolean): Whether spinner is active
- `size` (string): Size ('sm', 'md', 'lg')
- `color` (string): Color class
- `className` (string): Additional CSS classes

**Example:**
```javascript
import { Spinner } from '../components/LoadingIndicator';

<Spinner
  active={isLoading('fetchData')}
  size="md"
  color="text-blue-600"
  className="mx-auto"
/>
```

## Debug and Monitoring APIs

### LoadingStateDebugPanel

Development-only debug panel component.

**Props:**
- `loadingManager` (LoadingStateManager): Manager instance
- `position` (string): Panel position ('top-right', 'bottom-left', etc.)
- `collapsed` (boolean): Whether panel starts collapsed

**Example:**
```javascript
import { LoadingStateDebugPanel } from '../components/LoadingStateDebugPanel';

// Only show in development
{process.env.NODE_ENV === 'development' && (
  <LoadingStateDebugPanel
    loadingManager={loadingManager}
    position="top-right"
    collapsed={false}
  />
)}
```

### Debug Utilities

#### loadingDebugUtils

Global debug utilities available in development mode.

**Methods:**
- `runHealthCheck()`: Run comprehensive health check
- `checkCSSAnimationControl()`: Verify CSS animation control
- `generateDebugReport()`: Generate detailed debug report
- `clearDebugHistory()`: Clear debug history
- `exportDebugData()`: Export debug data for analysis

**Example:**
```javascript
// Available in browser console (development only)
window.loadingDebugUtils.runHealthCheck();
window.loadingDebugUtils.generateDebugReport();
```

## Production Safeguards APIs

### Production Configuration

#### ProductionConfig

Environment-aware configuration management.

**Methods:**
- `get(key, defaultValue)`: Get configuration value
- `isEnabled(feature)`: Check if feature is enabled
- `getPerformanceThresholds()`: Get performance thresholds
- `createLogger(component)`: Create component logger

**Example:**
```javascript
import { ProductionConfig } from '../utils/productionConfig';

const debugEnabled = ProductionConfig.isEnabled('enableDebugLogging');
const slowThreshold = ProductionConfig.get('slowOperationMs', 5000);
const logger = ProductionConfig.createLogger('MyComponent');
```

### Performance Monitoring

#### Performance Thresholds

Default performance thresholds for monitoring:

```javascript
{
  slowOperationMs: 5000,        // Operations slower than 5s
  verySlowOperationMs: 15000,   // Operations slower than 15s
  stuckOperationMs: 30000,      // Operations that might be stuck
  maxConcurrentOperations: 5,   // Maximum concurrent operations
  rapidCyclingThreshold: 3,     // Rapid cycling detection
  flashingThreshold: 200,       // Minimum loading display time
  progressFeedbackThreshold: 5000 // Show progress after 5s
}
```

#### Performance Metrics

Performance metrics tracked for each operation:

- `duration`: Operation duration in milliseconds
- `averageDuration`: Average duration for this operation type
- `operationCount`: Total number of times operation has run
- `errorRate`: Percentage of operations that failed
- `timeoutRate`: Percentage of operations that timed out
- `userTriggeredRate`: Percentage of user-triggered operations

## Error Handling APIs

### Error Types

#### LoadingStateError

Custom error type for loading state issues.

**Properties:**
- `operation` (string): Operation name
- `phase` (string): Loading phase ('start', 'stop', 'timeout')
- `originalError` (Error): Original error if any
- `debugInfo` (object): Debug information

**Example:**
```javascript
try {
  loadingManager.startLoading('invalidOperation');
} catch (error) {
  if (error instanceof LoadingStateError) {
    console.error('Loading state error:', error.operation, error.phase);
  }
}
```

### Error Callbacks

#### Global Error Handler

Set global error handler for all loading operations.

```javascript
loadingManager.setGlobalErrorHandler((operation, error, options) => {
  console.error(`Global loading error in ${operation}:`, error);
  
  // Send to error reporting service
  errorReportingService.report({
    type: 'loading_state_error',
    operation,
    error: error.message,
    userAction: options.userAction
  });
});
```

## CSS Integration APIs

### Controlled CSS Classes

The system provides controlled CSS classes that only activate when explicitly enabled:

#### Animation Classes

- `.loading-spinner-active`: Enables spinning animation
- `.loading-pulse-active`: Enables pulse animation
- `.loading-fade-active`: Enables fade animation
- `.loading-slide-active`: Enables slide animation
- `.loading-bounce-active`: Enables bounce animation

#### State Classes

- `.loading-button-active`: Button loading state
- `.loading-overlay-active`: Overlay loading state
- `.loading-text-active`: Text loading state
- `.loading-input-active`: Input loading state

#### Usage Pattern

```jsx
// CSS classes only animate when loading-*-active is present
<div className={`animate-spin ${isLoading('op') ? 'loading-spinner-active' : ''}`}>
  <svg>...</svg>
</div>
```

### CSS Validation

#### checkCSSAnimationControl()

Validate that CSS animation control is working correctly.

**Returns:** Object - Validation results

**Example:**
```javascript
const validation = loadingManager.checkCSSAnimationControl();
console.log('CSS Control Valid:', validation.isValid);
console.log('Issues Found:', validation.issues);
```

## Environment Configuration

### Development Mode

Features available in development mode:

- Full debug logging with stack traces
- User interaction tracking
- Automatic loading detection
- Debug panel and console commands
- Performance monitoring
- CSS animation validation

### Production Mode

Features in production mode:

- Sanitized logging (no sensitive data)
- Performance monitoring
- Error reporting
- User experience validation
- Analytics integration
- Minimal debug overhead

### Configuration Options

#### Environment Variables

```bash
# Feature flags
REACT_APP_ENABLE_DEBUG_LOGGING=true
REACT_APP_ENABLE_PERFORMANCE_MONITORING=true
REACT_APP_ENABLE_UX_VALIDATION=true

# Performance thresholds
REACT_APP_SLOW_OPERATION_MS=5000
REACT_APP_STUCK_OPERATION_MS=30000

# Analytics
REACT_APP_ANALYTICS_ENDPOINT=https://analytics.example.com/api/events
```

#### Runtime Configuration

```javascript
// localStorage configuration (development only)
localStorage.setItem('loadingStateConfig', JSON.stringify({
  enableDebugLogging: true,
  verboseLogging: true,
  slowOperationMs: 3000
}));

// URL parameters
?debug=true&performance=true&verbose=true
```

## Migration Guide

### From useState to LoadingStateManager

```javascript
// Before: Manual state management
const [loading, setLoading] = useState(false);

const handleClick = async () => {
  setLoading(true);
  try {
    await fetchData();
  } finally {
    setLoading(false);
  }
};

// After: LoadingStateManager
const { startLoading, stopLoading, isLoading } = useLoadingState();

const handleClick = async (event) => {
  try {
    startLoading('fetchData', {
      userAction: 'Button click',
      triggerElement: event.target
    });
    await fetchData();
  } finally {
    stopLoading('fetchData');
  }
};
```

### From Multiple Loading States

```javascript
// Before: Multiple useState hooks
const [loadingComments, setLoadingComments] = useState(false);
const [loadingStats, setLoadingStats] = useState(false);

// After: Named operations
const { isLoading } = useLoadingState();

const commentsLoading = isLoading('fetchComments');
const statsLoading = isLoading('fetchStats');
```

## Best Practices

### Operation Naming

Use descriptive, consistent operation names:

```javascript
// Good
'fetchUserComments'
'submitContactForm'
'uploadCsvFile'
'generateWordCloud'

// Avoid
'loading'
'op1'
'fetch'
```

### Error Handling

Always use try/finally blocks:

```javascript
try {
  startLoading('operation', options);
  await performOperation();
} catch (error) {
  handleError(error);
} finally {
  stopLoading('operation');
}
```

### User Action Correlation

Always provide user action context:

```javascript
startLoading('operation', {
  userAction: 'Specific user action description',
  triggerElement: event.target
});
```

### Performance Optimization

- Use operation names efficiently
- Clean up properly on component unmount
- Limit concurrent operations
- Set appropriate timeouts

## Troubleshooting

For troubleshooting information, see the [Loading State Troubleshooting Guide](./LOADING_STATE_TROUBLESHOOTING.md).

## Related Documentation

- [Loading State Developer Guidelines](./LOADING_STATE_DEVELOPER_GUIDELINES.md)
- [CSS Loading Control System](./styles/CSS_LOADING_CONTROL_README.md)
- [Production Safeguards](./utils/PRODUCTION_SAFEGUARDS_README.md)
- [Troubleshooting Guide](./LOADING_STATE_TROUBLESHOOTING.md)
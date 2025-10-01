# LoadingStateManager

A centralized loading state management system designed to eliminate unwanted automatic loading states and ensure all loading indicators only appear when explicitly triggered by user actions.

## Overview

The LoadingStateManager provides:
- **Centralized Control**: Single source of truth for all loading states
- **Debug Logging**: Comprehensive logging with stack traces for debugging
- **User Action Correlation**: Ensures loading states correlate to specific user actions
- **Automatic Cleanup**: Prevents memory leaks and orphaned loading states
- **Development Tools**: Debug panels and monitoring for development

## Core Components

### 1. LoadingStateManager (Class)
The main class that manages all loading operations.

### 2. useLoadingState (Hook)
React hook that provides easy integration with React components.

### 3. LoadingIndicator Components
Visual components for displaying loading states.

### 4. CSS Classes
Controlled CSS animations that only activate when explicitly enabled.

## Quick Start

### Basic Usage with Hook

```jsx
import { useLoadingState } from '../hooks/useLoadingState';
import { LoadingButton } from '../components/LoadingIndicator';

function MyComponent() {
  const { startLoading, stopLoading, isLoading } = useLoadingState();

  const handleClick = async (event) => {
    try {
      startLoading('myOperation', {
        userAction: 'Button click',
        triggerElement: event.target
      });

      // Your async operation
      await fetchData();
      
    } finally {
      stopLoading('myOperation');
    }
  };

  return (
    <LoadingButton
      loading={isLoading('myOperation')}
      loadingText="Loading..."
      onClick={handleClick}
    >
      Click Me
    </LoadingButton>
  );
}
```

### Using withLoading Helper

```jsx
const { withLoading } = useLoadingState();

const handleClick = async () => {
  try {
    const result = await withLoading(
      'myOperation',
      async () => {
        return await fetchData();
      },
      {
        userAction: 'Button click'
      }
    );
    console.log('Result:', result);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### Using createLoadingHandler

```jsx
const { createLoadingHandler } = useLoadingState();

const handleClick = createLoadingHandler(
  'myOperation',
  async (event) => {
    await fetchData();
  },
  {
    userAction: 'Button click'
  }
);
```

## API Reference

### LoadingStateManager Methods

#### `startLoading(operation, options)`
Start a loading operation.

**Parameters:**
- `operation` (string): Unique name for the operation
- `options` (object):
  - `userAction` (string): Description of user action that triggered loading
  - `triggerElement` (HTMLElement): DOM element that triggered the loading

**Returns:** Operation ID string

#### `stopLoading(operation)`
Stop a loading operation.

**Parameters:**
- `operation` (string): Name of operation to stop

#### `isLoading(operation?)`
Check if operation(s) are loading.

**Parameters:**
- `operation` (string, optional): Specific operation to check. If omitted, checks if any operation is loading.

**Returns:** Boolean

#### `getActiveOperations()`
Get all currently active loading operations.

**Returns:** Object with operation names as keys

#### `getOperationHistory()`
Get history of loading operations for debugging.

**Returns:** Array of operation records

#### `cleanup()`
Clean up all active loading states (called automatically on unmount).

### useLoadingState Hook

Returns an object with:
- `startLoading(operation, options)`: Start loading function
- `stopLoading(operation)`: Stop loading function  
- `isLoading(operation?)`: Check loading state function
- `withLoading(operation, asyncFn, options)`: Helper for wrapping async operations
- `createLoadingHandler(operation, handler, options)`: Create loading-aware event handler
- `getActiveOperations()`: Get active operations
- `getOperationHistory()`: Get operation history
- `getDebugInfo()`: Get debug information
- `hasAnyLoading`: Boolean indicating if any operation is loading
- `activeOperationCount`: Number of active operations
- `loadingManager`: Direct access to LoadingStateManager instance

## Loading Indicator Components

### LoadingButton
Button with integrated loading state.

```jsx
<LoadingButton
  loading={isLoading('myOp')}
  loadingText="Processing..."
  onClick={handleClick}
  className="bg-blue-600 text-white px-4 py-2 rounded"
>
  Click Me
</LoadingButton>
```

### LoadingOverlay
Full-screen loading overlay.

```jsx
<LoadingOverlay
  active={isLoading('myOp')}
  message="Loading data..."
  operation="myOp"
/>
```

### InlineLoadingIndicator
Inline loading indicator for text.

```jsx
<InlineLoadingIndicator
  loading={isLoading('myOp')}
  loadingText="Loading..."
  normalText="Ready"
/>
```

### LoadingDebugPanel
Development-only debug panel showing active operations.

```jsx
<LoadingDebugPanel loadingManager={loadingManager} />
```

## CSS Classes

The system uses controlled CSS classes that only activate when explicitly enabled:

- `.loading-spinner-active`: Spinning animation (only when active)
- `.loading-overlay-active`: Full-screen overlay
- `.loading-button-active`: Button loading state
- `.loading-skeleton-active`: Skeleton loading animation

## Best Practices

### 1. Always Provide User Action Context
```jsx
// Good
startLoading('fetchComments', {
  userAction: 'Load comments button click',
  triggerElement: event.target
});

// Avoid
startLoading('fetchComments'); // No context
```

### 2. Use Descriptive Operation Names
```jsx
// Good
startLoading('fetchUserComments');
startLoading('submitContactForm');
startLoading('generateWordCloud');

// Avoid
startLoading('loading');
startLoading('op1');
```

### 3. Always Stop Loading in Finally Block
```jsx
try {
  startLoading('myOperation', options);
  await doSomething();
} catch (error) {
  handleError(error);
} finally {
  stopLoading('myOperation'); // Always stop loading
}
```

### 4. Use Helpers for Common Patterns
```jsx
// Use withLoading for simple async operations
const result = await withLoading('myOp', fetchData, options);

// Use createLoadingHandler for event handlers
const handleClick = createLoadingHandler('myOp', asyncHandler, options);
```

## Debugging

### Development Mode
In development mode, the LoadingStateManager provides:
- Console logging of all loading state changes
- Stack trace capture for debugging
- Warnings for operations without clear user correlation
- Debug panel showing active operations

### Debug Information
```jsx
const { getDebugInfo } = useLoadingState();

console.log(getDebugInfo());
// {
//   activeOperations: ['fetchComments', 'submitForm'],
//   operationCount: 2,
//   history: [...],
//   debugMode: true
// }
```

### Operation History
```jsx
const { getOperationHistory } = useLoadingState();

console.log(getOperationHistory());
// Array of operation records with timing and debug info
```

## Common Patterns

### API Calls
```jsx
const fetchComments = async (event) => {
  try {
    startLoading('fetchComments', {
      userAction: 'Load comments button click',
      triggerElement: event.target
    });

    const response = await fetch('/api/comments');
    const data = await response.json();
    setComments(data);
  } catch (error) {
    setError('Failed to load comments');
  } finally {
    stopLoading('fetchComments');
  }
};
```

### Form Submission
```jsx
const handleSubmit = createLoadingHandler(
  'submitForm',
  async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    await submitForm(formData);
  },
  {
    userAction: 'Form submission'
  }
);
```

### File Upload
```jsx
const handleFileUpload = async (file, event) => {
  await withLoading(
    'uploadFile',
    async () => {
      const formData = new FormData();
      formData.append('file', file);
      return await uploadFile(formData);
    },
    {
      userAction: 'File upload',
      triggerElement: event.target
    }
  );
};
```

## Troubleshooting

### Loading State Not Updating UI
Make sure you're using the `useLoadingState` hook, which triggers re-renders:
```jsx
const { isLoading } = useLoadingState(); // ✓ Triggers re-renders
// Not: const manager = new LoadingStateManager(); // ✗ Won't trigger re-renders
```

### Warning: Loading Without User Action
If you see warnings about loading states without user correlation:
1. Add explicit `userAction` in options
2. Pass `triggerElement` from event
3. Check if loading is triggered from useEffect or automatic code

### Loading State Stuck
If loading states don't stop:
1. Ensure `stopLoading` is called in finally block
2. Check for unhandled promise rejections
3. Use `cleanup()` to reset all states
4. Check operation names match exactly

### Performance Issues
If you experience performance issues:
1. Disable debug mode in production
2. Limit operation history size
3. Clean up unused loading states
4. Avoid creating new LoadingStateManager instances frequently

## Migration Guide

### From Direct State Management
```jsx
// Before
const [loading, setLoading] = useState(false);

const handleClick = async () => {
  setLoading(true);
  try {
    await fetchData();
  } finally {
    setLoading(false);
  }
};

// After
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
```jsx
// Before
const [loadingComments, setLoadingComments] = useState(false);
const [loadingStats, setLoadingStats] = useState(false);

// After
const { startLoading, stopLoading, isLoading } = useLoadingState();

// Use named operations
isLoading('fetchComments')
isLoading('fetchStats')
```
# Loading State Developer Guidelines

## Overview

This document provides comprehensive guidelines for developers working with the eConsultation AI loading state management system. The system is designed to eliminate unwanted automatic loading states and ensure all loading indicators only appear when explicitly triggered by user actions.

## Quick Start

### 1. Basic Loading State Implementation

```jsx
import { useLoadingState } from '../hooks/useLoadingState';
import { LoadingButton } from '../components/LoadingIndicator';

function MyComponent() {
  const { startLoading, stopLoading, isLoading } = useLoadingState();

  const handleUserAction = async (event) => {
    try {
      startLoading('myOperation', {
        userAction: 'Button click',
        triggerElement: event.target
      });

      const result = await performAsyncOperation();
      // Handle result
      
    } catch (error) {
      // Handle error
      console.error('Operation failed:', error);
    } finally {
      stopLoading('myOperation');
    }
  };

  return (
    <LoadingButton
      loading={isLoading('myOperation')}
      onClick={handleUserAction}
    >
      Perform Action
    </LoadingButton>
  );
}
```

### 2. Using Helper Functions

```jsx
const { withLoading, createLoadingHandler } = useLoadingState();

// Option 1: withLoading helper
const handleClick = async () => {
  const result = await withLoading(
    'fetchData',
    async () => await fetchData(),
    { userAction: 'Button click' }
  );
};

// Option 2: createLoadingHandler
const handleClick = createLoadingHandler(
  'fetchData',
  async () => await fetchData(),
  { userAction: 'Button click' }
);
```

## Core Principles

### 1. Explicit User Action Correlation

**Rule**: Every loading state MUST be triggered by an explicit user action.

```jsx
// ✅ CORRECT: User-triggered loading
const handleButtonClick = (event) => {
  startLoading('fetchComments', {
    userAction: 'Load comments button click',
    triggerElement: event.target
  });
};

// ❌ INCORRECT: Automatic loading in useEffect
useEffect(() => {
  startLoading('fetchComments'); // No user action!
  fetchComments();
}, []);
```

### 2. Descriptive Operation Names

**Rule**: Use clear, descriptive names for loading operations.

```jsx
// ✅ CORRECT: Descriptive names
startLoading('fetchUserComments');
startLoading('submitContactForm');
startLoading('generateWordCloud');
startLoading('uploadCsvFile');

// ❌ INCORRECT: Generic names
startLoading('loading');
startLoading('op1');
startLoading('fetch');
```

### 3. Proper Error Handling

**Rule**: Always stop loading in finally blocks and handle errors appropriately.

```jsx
// ✅ CORRECT: Proper error handling
const handleOperation = async (event) => {
  try {
    startLoading('myOperation', {
      userAction: 'Button click',
      triggerElement: event.target
    });
    
    const result = await performOperation();
    setData(result);
    
  } catch (error) {
    setError('Operation failed: ' + error.message);
    // Loading will be stopped in finally block
  } finally {
    stopLoading('myOperation'); // Always stop loading
  }
};

// ❌ INCORRECT: Missing finally block
const handleOperation = async () => {
  startLoading('myOperation');
  try {
    const result = await performOperation();
    stopLoading('myOperation'); // Won't run if error occurs!
  } catch (error) {
    // Loading state stuck if error occurs
  }
};
```

## Adding New Loading States

### Step 1: Identify the User Action

Before adding a loading state, clearly identify:
- What user action triggers the loading?
- What specific operation is being performed?
- How long is the operation expected to take?
- What feedback should the user receive?

### Step 2: Choose Operation Name

Use this naming convention:
- `fetch[DataType]` - For data fetching (e.g., `fetchComments`, `fetchDashboardStats`)
- `submit[FormType]` - For form submissions (e.g., `submitComment`, `submitContactForm`)
- `upload[FileType]` - For file uploads (e.g., `uploadCsvFile`, `uploadImage`)
- `generate[OutputType]` - For generation tasks (e.g., `generateWordCloud`, `generateReport`)
- `delete[ItemType]` - For deletion operations (e.g., `deleteComment`, `deleteFile`)

### Step 3: Implement Loading State

```jsx
const handleNewOperation = async (event) => {
  try {
    // Start loading with descriptive information
    startLoading('myNewOperation', {
      userAction: 'Specific user action description',
      triggerElement: event.target,
      expectedDuration: 3000 // Optional: expected duration in ms
    });

    // Perform the operation
    const result = await performNewOperation();
    
    // Handle success
    handleSuccess(result);
    
  } catch (error) {
    // Handle error
    handleError(error);
  } finally {
    // Always stop loading
    stopLoading('myNewOperation');
  }
};
```

### Step 4: Add UI Feedback

Choose appropriate loading indicator:

```jsx
// For buttons
<LoadingButton loading={isLoading('myOperation')} onClick={handleClick}>
  Click Me
</LoadingButton>

// For overlays
<LoadingOverlay active={isLoading('myOperation')} message="Processing..." />

// For inline indicators
<InlineLoadingIndicator 
  loading={isLoading('myOperation')} 
  loadingText="Loading..." 
  normalText="Ready" 
/>

// For custom indicators
{isLoading('myOperation') && <CustomSpinner />}
```

### Step 5: Add Tests

```jsx
// Test file: MyComponent.test.js
import { render, fireEvent, waitFor } from '@testing-library/react';
import MyComponent from './MyComponent';

test('shows loading state when user clicks button', async () => {
  const { getByText, getByRole } = render(<MyComponent />);
  
  const button = getByText('Click Me');
  fireEvent.click(button);
  
  // Verify loading state appears
  expect(getByRole('status')).toBeInTheDocument();
  
  // Wait for loading to complete
  await waitFor(() => {
    expect(getByText('Click Me')).not.toBeDisabled();
  });
});
```

## Common Patterns

### 1. API Calls

```jsx
const fetchData = async (endpoint, operation, userAction) => {
  try {
    startLoading(operation, { userAction });
    
    const response = await fetch(endpoint);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
    
  } catch (error) {
    console.error(`${operation} failed:`, error);
    throw error;
  } finally {
    stopLoading(operation);
  }
};

// Usage
const handleLoadComments = (event) => {
  fetchData('/api/comments', 'fetchComments', 'Load comments button click')
    .then(setComments)
    .catch(error => setError(error.message));
};
```

### 2. Form Submissions

```jsx
const handleFormSubmit = async (event) => {
  event.preventDefault();
  
  const formData = new FormData(event.target);
  const operation = 'submitContactForm';
  
  try {
    startLoading(operation, {
      userAction: 'Contact form submission',
      triggerElement: event.target
    });
    
    const response = await fetch('/api/contact', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error('Submission failed');
    }
    
    setMessage('Form submitted successfully!');
    event.target.reset();
    
  } catch (error) {
    setError('Failed to submit form: ' + error.message);
  } finally {
    stopLoading(operation);
  }
};
```

### 3. File Uploads

```jsx
const handleFileUpload = async (file, event) => {
  const operation = 'uploadCsvFile';
  
  try {
    startLoading(operation, {
      userAction: 'CSV file upload',
      triggerElement: event.target
    });
    
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error('Upload failed');
    }
    
    const result = await response.json();
    setUploadResult(result);
    
  } catch (error) {
    setError('Upload failed: ' + error.message);
  } finally {
    stopLoading(operation);
  }
};
```

### 4. Multiple Concurrent Operations

```jsx
const handleMultipleOperations = async (event) => {
  try {
    // Start multiple operations
    startLoading('fetchComments', { userAction: 'Dashboard load' });
    startLoading('fetchStats', { userAction: 'Dashboard load' });
    
    // Run operations concurrently
    const [comments, stats] = await Promise.all([
      fetch('/api/comments').then(r => r.json()),
      fetch('/api/stats').then(r => r.json())
    ]);
    
    setComments(comments);
    setStats(stats);
    
  } catch (error) {
    setError('Failed to load dashboard data');
  } finally {
    // Stop all operations
    stopLoading('fetchComments');
    stopLoading('fetchStats');
  }
};
```

## CSS Integration

### Using Controlled CSS Classes

```jsx
// The CSS system requires explicit activation
const MySpinner = ({ active }) => (
  <div className={`animate-spin ${active ? 'loading-spinner-active' : ''}`}>
    <svg>...</svg>
  </div>
);

// Usage with loading state
<MySpinner active={isLoading('myOperation')} />
```

### Custom Loading Indicators

```jsx
const CustomLoadingIndicator = ({ operation, children }) => {
  const { isLoading } = useLoadingState();
  const loading = isLoading(operation);
  
  return (
    <div className={`relative ${loading ? 'loading-container-active' : ''}`}>
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center loading-overlay-active">
          <div className="animate-spin loading-spinner-active">
            <svg className="w-6 h-6">...</svg>
          </div>
        </div>
      )}
      {children}
    </div>
  );
};
```

## Debugging and Troubleshooting

### Development Tools

```jsx
// Access debug information
const { getDebugInfo, getOperationHistory } = useLoadingState();

// Log current state
console.log('Debug Info:', getDebugInfo());
console.log('Operation History:', getOperationHistory());

// Check for issues
const debugInfo = getDebugInfo();
if (debugInfo.unexpectedLoadingWarnings.length > 0) {
  console.warn('Unexpected loading detected:', debugInfo.unexpectedLoadingWarnings);
}
```

### Common Issues and Solutions

#### Issue 1: Loading State Stuck

**Symptoms**: Loading indicator never disappears
**Causes**: 
- Missing `stopLoading` call
- Exception thrown before `stopLoading`
- Mismatched operation names

**Solution**:
```jsx
// Always use try/finally
try {
  startLoading('myOperation', options);
  await performOperation();
} finally {
  stopLoading('myOperation'); // Always called
}

// Or use withLoading helper
await withLoading('myOperation', performOperation, options);
```

#### Issue 2: Loading Without User Action Warning

**Symptoms**: Console warnings about non-user-triggered loading
**Causes**: 
- Loading triggered in useEffect
- Missing userAction in options
- Automatic/background loading

**Solution**:
```jsx
// Don't trigger loading automatically
useEffect(() => {
  // ❌ Don't do this
  startLoading('autoLoad');
}, []);

// Instead, require user action
const handleLoadClick = (event) => {
  startLoading('loadData', {
    userAction: 'Load data button click',
    triggerElement: event.target
  });
};
```

#### Issue 3: Multiple Loading States for Same Operation

**Symptoms**: Multiple loading indicators for same operation
**Causes**: 
- Calling startLoading multiple times
- Not checking if already loading

**Solution**:
```jsx
const handleClick = async (event) => {
  // Check if already loading
  if (isLoading('myOperation')) {
    return; // Prevent duplicate loading
  }
  
  try {
    startLoading('myOperation', options);
    await performOperation();
  } finally {
    stopLoading('myOperation');
  }
};
```

### Debug Console Commands (Development Only)

```javascript
// Available in browser console during development
window.loadingStateManager.getDebugInfo()
window.loadingStateManager.getOperationHistory()
window.loadingStateManager.cleanup() // Reset all states

// Keyboard shortcuts (when debug panel is enabled)
// Ctrl+Shift+L: Toggle debug panel
// Ctrl+Shift+R: Generate debug report
// Ctrl+Shift+C: Clear operation history
```

## Performance Considerations

### Best Practices

1. **Use Operation Names Efficiently**: Reuse operation names for similar operations
2. **Clean Up Properly**: Always stop loading states to prevent memory leaks
3. **Limit Concurrent Operations**: Avoid too many simultaneous loading states
4. **Use Appropriate Timeouts**: Set reasonable timeouts for long operations

```jsx
// Good: Efficient operation management
const handleMultipleClicks = async (event) => {
  if (isLoading('fetchData')) return; // Prevent duplicate requests
  
  try {
    startLoading('fetchData', { userAction: 'Button click' });
    await fetchData();
  } finally {
    stopLoading('fetchData');
  }
};

// Good: Timeout protection
const handleLongOperation = async (event) => {
  const timeoutId = setTimeout(() => {
    stopLoading('longOperation');
    setError('Operation timed out');
  }, 30000); // 30 second timeout
  
  try {
    startLoading('longOperation', { userAction: 'Long operation start' });
    await performLongOperation();
    clearTimeout(timeoutId);
  } finally {
    stopLoading('longOperation');
  }
};
```

## Testing Guidelines

### Unit Tests

```jsx
import { renderHook, act } from '@testing-library/react';
import { useLoadingState } from '../hooks/useLoadingState';

test('loading state management', () => {
  const { result } = renderHook(() => useLoadingState());
  
  // Test starting loading
  act(() => {
    result.current.startLoading('testOp', { userAction: 'test' });
  });
  
  expect(result.current.isLoading('testOp')).toBe(true);
  
  // Test stopping loading
  act(() => {
    result.current.stopLoading('testOp');
  });
  
  expect(result.current.isLoading('testOp')).toBe(false);
});
```

### Integration Tests

```jsx
import { render, fireEvent, waitFor } from '@testing-library/react';
import MyComponent from './MyComponent';

test('complete loading flow', async () => {
  const { getByText, queryByRole } = render(<MyComponent />);
  
  // Initially no loading
  expect(queryByRole('status')).not.toBeInTheDocument();
  
  // Click button to start loading
  fireEvent.click(getByText('Load Data'));
  
  // Loading should appear
  expect(queryByRole('status')).toBeInTheDocument();
  
  // Wait for loading to complete
  await waitFor(() => {
    expect(queryByRole('status')).not.toBeInTheDocument();
  });
});
```

## Migration Guide

### From useState Loading States

```jsx
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

```jsx
// Before: Multiple useState hooks
const [loadingComments, setLoadingComments] = useState(false);
const [loadingStats, setLoadingStats] = useState(false);
const [loadingUsers, setLoadingUsers] = useState(false);

// After: Single LoadingStateManager
const { startLoading, stopLoading, isLoading } = useLoadingState();

// Use named operations
isLoading('fetchComments')
isLoading('fetchStats')
isLoading('fetchUsers')
```

## Security Considerations

1. **No Sensitive Data in Debug Logs**: Debug information is sanitized in production
2. **User Action Validation**: User actions are validated to prevent injection
3. **Operation Name Sanitization**: Operation names are sanitized for logging
4. **Stack Trace Redaction**: Stack traces are redacted in production builds

## Contributing

When contributing to the loading state system:

1. **Follow Naming Conventions**: Use descriptive operation names
2. **Add Tests**: Include unit and integration tests
3. **Update Documentation**: Update this guide for new patterns
4. **Consider Performance**: Ensure changes don't impact performance
5. **Test in Production Mode**: Verify behavior in production builds

## Related Documentation

- [LoadingStateManager API Reference](./components/LoadingStateManager.README.md)
- [CSS Loading Control System](./styles/CSS_LOADING_CONTROL_README.md)
- [Production Safeguards](./utils/PRODUCTION_SAFEGUARDS_README.md)
- [Troubleshooting Guide](./LOADING_STATE_TROUBLESHOOTING.md)

## Support

For questions or issues:

1. Check the [Troubleshooting Guide](./LOADING_STATE_TROUBLESHOOTING.md)
2. Review existing tests for examples
3. Use the debug tools in development mode
4. Check the browser console for warnings and errors
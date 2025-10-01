# API Service Layer

This directory contains the centralized API service layer for the eConsultation AI application.

## Overview

The API service layer provides:
- **5-second timeout** for all requests (as per requirements)
- **Automatic retry logic** for failed requests (2 retries with 1-second delay)
- **User-friendly error handling** and messages
- **Integration with loading state management**

## Files

### `apiService.js`
The core API service with all backend endpoints:
- `submitComment(comment, config)` - Submit comment for analysis
- `fetchComments(config)` - Get all comments
- `fetchDashboardStats(config)` - Get dashboard statistics
- `generateWordcloud(sentiment, config)` - Generate word cloud
- `uploadCSV(file, config)` - Upload CSV file
- `checkHealth(config)` - Check backend health
- `getDetailedHealth(config)` - Get detailed health info

### `useApiService.js`
React hook that integrates the API service with loading states:
- Automatically manages loading states for each operation
- Provides success/error/timeout callbacks
- Integrates with the existing `useSimpleLoading` hook

## Usage

### Basic Usage in Components

```javascript
import useApiService from '../hooks/useApiService';

function MyComponent() {
  const apiService = useApiService();
  const [message, setMessage] = useState('');

  const handleSubmitComment = async () => {
    try {
      await apiService.submitComment(
        { stakeholder_type: 'citizen', raw_text: 'Test comment' },
        {
          onSuccess: (result) => {
            setMessage(`Comment processed: ${result.sentiment_label}`);
          },
          onError: (error) => {
            setMessage(error.message);
          },
          onTimeout: (message) => {
            setMessage(message);
          }
        }
      );
    } catch (error) {
      // Error already handled in onError callback
    }
  };

  return (
    <div>
      <button onClick={handleSubmitComment}>Submit Comment</button>
      {message && <p>{message}</p>}
    </div>
  );
}
```

### Direct API Service Usage

```javascript
import ApiService from '../services/apiService';

// Direct usage without loading states
try {
  const comments = await ApiService.fetchComments();
  console.log('Comments:', comments);
} catch (error) {
  console.error('Error:', error.message);
}
```

## Configuration

### Default Configuration
```javascript
const DEFAULT_CONFIG = {
  timeout: 5000,     // 5 seconds
  retries: 2,        // 2 retry attempts
  retryDelay: 1000,  // 1 second between retries
  headers: {
    'Content-Type': 'application/json',
  }
};
```

### Custom Configuration
```javascript
// Override timeout for specific operations
await apiService.uploadCSV(file, {
  timeout: 30000, // 30 seconds for large files
  onSuccess: (result) => console.log('Upload complete:', result)
});
```

## Error Handling

The API service automatically transforms backend errors into user-friendly messages:

- **Timeout errors**: "Operation timed out. Please try again."
- **Network errors**: "Connection error. Please check your internet connection."
- **HTTP 400**: "Invalid request. Please check your input and try again."
- **HTTP 404**: "Requested resource not found."
- **HTTP 500**: "Server error. Please try again later."

## Retry Logic

The service automatically retries failed requests with these rules:
- **Maximum retries**: 2 attempts
- **Retry delay**: 1 second between attempts
- **No retry for**: 400 (Bad Request), 404 (Not Found), timeout errors
- **Retry for**: Network errors, 500+ server errors

## Integration with Loading States

When using `useApiService`, loading states are automatically managed:

```javascript
const apiService = useApiService();
const { isLoading } = useSimpleLoading();

// Check if specific operation is loading
if (isLoading('submitComment')) {
  return <div>Processing comment...</div>;
}
```

## Requirements Satisfied

This implementation satisfies the following requirements:
- **Requirement 3.2**: API calls complete within 5 seconds or show timeout messaging
- **Requirement 4.1**: Backend unavailable shows clear connection error message
- **Requirement 4.2**: API request failures show specific error information and retry options

## Performance Targets

- **Comment Processing**: < 2 seconds (with 25-second timeout for AI processing)
- **Dashboard Loading**: < 3 seconds (with 20-second timeout)
- **Word Cloud Generation**: < 10 seconds (with 30-second timeout)
- **CSV Upload**: Progress indicators with 60-second timeout
- **API Response Time**: < 1 second for simple requests (5-second default timeout)
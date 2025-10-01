/**
 * Error Handling Tests
 * 
 * Tests for the comprehensive error handling and recovery system:
 * - ErrorBoundary component functionality
 * - ErrorRecovery component behavior
 * - Error handling service functionality
 * - Timeout detection and cleanup
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ErrorBoundary from '../ErrorBoundary';
import ErrorRecovery from '../ErrorRecovery';
import { 
  transformError, 
  categorizeError, 
  ERROR_CATEGORIES,
  RECOVERY_ACTIONS,
  createRetryHandler,
  errorHandlingService 
} from '../../services/errorHandlingService';

// Mock component that throws an error
const ThrowError = ({ shouldThrow = false, errorType = 'generic' }) => {
  if (shouldThrow) {
    if (errorType === 'network') {
      throw new Error('Failed to fetch');
    } else if (errorType === 'timeout') {
      const error = new Error('Request timed out');
      error.name = 'AbortError';
      throw error;
    } else if (errorType === 'chunk') {
      const error = new Error('Loading chunk 1 failed');
      error.name = 'ChunkLoadError';
      throw error;
    } else {
      throw new Error('Test error');
    }
  }
  return <div>No error</div>;
};

describe('ErrorBoundary', () => {
  let consoleSpy;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  test('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  test('displays error UI when child component throws', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText(/Test error/)).toBeInTheDocument();
  });

  test('calls onError callback when error occurs', () => {
    const onError = jest.fn();
    
    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Test error' }),
      expect.any(Object)
    );
  });

  test('shows retry button and handles retry', () => {
    const onRetry = jest.fn();
    
    render(
      <ErrorBoundary onRetry={onRetry}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const retryButton = screen.getByText('Try Again');
    fireEvent.click(retryButton);

    expect(onRetry).toHaveBeenCalledWith(1);
  });

  test('shows different error messages for different error types', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} errorType="network" />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Failed to load application resources/)).toBeInTheDocument();

    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} errorType="chunk" />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Failed to load application resources/)).toBeInTheDocument();
  });

  test('shows technical details in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const detailsButton = screen.getByText('Show Technical Details');
    fireEvent.click(detailsButton);

    expect(screen.getByText('Stack Trace:')).toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });
});

describe('ErrorRecovery', () => {
  const mockError = new Error('Test error message');

  test('renders error message and recovery actions', () => {
    render(
      <ErrorRecovery 
        error={mockError}
        operation="test operation"
      />
    );

    expect(screen.getByText(/Test error message/)).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  test('calls onRetry when retry button is clicked', async () => {
    const onRetry = jest.fn().mockResolvedValue();
    
    render(
      <ErrorRecovery 
        error={mockError}
        operation="test operation"
        onRetry={onRetry}
      />
    );

    const retryButton = screen.getByText('Try Again');
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(onRetry).toHaveBeenCalled();
    });
  });

  test('shows suggestions when available', () => {
    render(
      <ErrorRecovery 
        error={mockError}
        operation="test operation"
      />
    );

    expect(screen.getByText('What you can try')).toBeInTheDocument();
  });

  test('disables retry button after max retries', () => {
    render(
      <ErrorRecovery 
        error={mockError}
        operation="test operation"
        context={{ retryCount: 3 }}
        maxRetries={3}
      />
    );

    const retryButton = screen.getByText('Try Again');
    expect(retryButton).toBeDisabled();
  });

  test('shows different recovery actions based on error type', () => {
    const networkError = new Error('Failed to fetch');
    
    render(
      <ErrorRecovery 
        error={networkError}
        operation="network request"
      />
    );

    expect(screen.getByText('Try Again')).toBeInTheDocument();
    expect(screen.getByText('Go Home')).toBeInTheDocument();
  });
});

describe('Error Handling Service', () => {
  describe('categorizeError', () => {
    test('categorizes network errors correctly', () => {
      const networkError = new Error('Failed to fetch');
      expect(categorizeError(networkError)).toBe(ERROR_CATEGORIES.NETWORK);

      const corsError = new Error('CORS error');
      expect(categorizeError(corsError)).toBe(ERROR_CATEGORIES.NETWORK);
    });

    test('categorizes timeout errors correctly', () => {
      const timeoutError = new Error('Request timed out');
      expect(categorizeError(timeoutError)).toBe(ERROR_CATEGORIES.TIMEOUT);

      const abortError = new Error('Aborted');
      abortError.name = 'AbortError';
      expect(categorizeError(abortError)).toBe(ERROR_CATEGORIES.TIMEOUT);
    });

    test('categorizes server errors correctly', () => {
      const serverError = new Error('Internal server error');
      serverError.status = 500;
      expect(categorizeError(serverError)).toBe(ERROR_CATEGORIES.SERVER);
    });

    test('categorizes client errors correctly', () => {
      const clientError = new Error('Bad request');
      clientError.status = 400;
      expect(categorizeError(clientError)).toBe(ERROR_CATEGORIES.CLIENT);
    });

    test('returns unknown for unrecognized errors', () => {
      const unknownError = new Error('Some random error');
      expect(categorizeError(unknownError)).toBe(ERROR_CATEGORIES.UNKNOWN);
    });
  });

  describe('transformError', () => {
    test('transforms network errors with appropriate message', () => {
      const networkError = new Error('Failed to fetch');
      const result = transformError(networkError, 'loading data');

      expect(result.category).toBe(ERROR_CATEGORIES.NETWORK);
      expect(result.title).toBe('Connection Error');
      expect(result.message).toContain('loading data');
      expect(result.recoveryActions).toContain(RECOVERY_ACTIONS.RETRY);
    });

    test('transforms timeout errors with duration info', () => {
      const timeoutError = new Error('Request timed out');
      timeoutError.name = 'AbortError';
      const result = transformError(timeoutError, 'API call', { duration: 5000 });

      expect(result.category).toBe(ERROR_CATEGORIES.TIMEOUT);
      expect(result.title).toBe('Request Timed Out');
      expect(result.message).toContain('5s');
    });

    test('includes retry count in suggestions', () => {
      const error = new Error('Test error');
      const result = transformError(error, 'operation', { retryCount: 2 });

      expect(result.suggestions[0]).toContain('3 times');
    });

    test('suggests additional actions after multiple retries', () => {
      const error = new Error('Test error');
      const result = transformError(error, 'operation', { retryCount: 2 });

      expect(result.recoveryActions).toContain(RECOVERY_ACTIONS.RELOAD);
      expect(result.recoveryActions).toContain(RECOVERY_ACTIONS.GO_HOME);
    });
  });

  describe('createRetryHandler', () => {
    test('retries operation on failure', async () => {
      let attempts = 0;
      const operation = jest.fn().mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Temporary failure');
        }
        return 'success';
      });

      const retryHandler = createRetryHandler(operation, {
        maxRetries: 3,
        baseDelay: 10 // Short delay for testing
      });

      const result = await retryHandler();
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    test('stops retrying after max attempts', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Persistent failure'));
      const onMaxRetriesReached = jest.fn();

      const retryHandler = createRetryHandler(operation, {
        maxRetries: 2,
        baseDelay: 10,
        onMaxRetriesReached
      });

      await expect(retryHandler()).rejects.toThrow('Persistent failure');
      expect(operation).toHaveBeenCalledTimes(2);
      expect(onMaxRetriesReached).toHaveBeenCalled();
    });

    test('calls onRetry callback on each retry', async () => {
      let attempts = 0;
      const operation = jest.fn().mockImplementation(() => {
        attempts++;
        if (attempts < 2) {
          throw new Error('Temporary failure');
        }
        return 'success';
      });

      const onRetry = jest.fn();
      const retryHandler = createRetryHandler(operation, {
        maxRetries: 2,
        baseDelay: 10,
        onRetry
      });

      await retryHandler();
      expect(onRetry).toHaveBeenCalledWith(
        expect.any(Error),
        1,
        expect.any(Number)
      );
    });
  });

  describe('ErrorHandlingService', () => {
    beforeEach(() => {
      errorHandlingService.clearHistory();
    });

    test('records errors in history', () => {
      const error = new Error('Test error');
      const record = errorHandlingService.recordError(error, 'test operation');

      expect(record.id).toBeDefined();
      expect(record.error.message).toBe('Test error');
      expect(record.operation).toBe('test operation');
    });

    test('maintains error history size limit', () => {
      // Add more errors than the limit
      for (let i = 0; i < 60; i++) {
        errorHandlingService.recordError(new Error(`Error ${i}`), 'operation');
      }

      const stats = errorHandlingService.getErrorStats();
      expect(stats.total).toBeLessThanOrEqual(50);
    });

    test('provides error statistics', () => {
      errorHandlingService.recordError(new Error('Network error'), 'fetch');
      errorHandlingService.recordError(new Error('Timeout'), 'request');

      const stats = errorHandlingService.getErrorStats();
      expect(stats.total).toBe(2);
      expect(stats.categories).toBeDefined();
    });

    test('handles errors with full processing', () => {
      const error = new Error('Test error');
      const result = errorHandlingService.handleError(error, 'test operation');

      expect(result.category).toBeDefined();
      expect(result.title).toBeDefined();
      expect(result.message).toBeDefined();
      expect(result.errorRecord).toBeDefined();
    });
  });
});

describe('Integration Tests', () => {
  test('ErrorBoundary integrates with error handling service', () => {
    const onError = jest.fn();
    
    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Verify error boundary caught the error
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(onError).toHaveBeenCalled();
  });

  test('Error recovery shows appropriate actions for different error types', () => {
    const timeoutError = new Error('Request timed out');
    timeoutError.name = 'AbortError';
    
    render(
      <ErrorRecovery 
        error={timeoutError}
        operation="API request"
      />
    );

    expect(screen.getByText('Request Timed Out')).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });
});
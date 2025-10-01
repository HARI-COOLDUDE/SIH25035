/**
 * LoadingErrorHandling.test.js - Comprehensive tests for loading error handling
 * 
 * Tests timeout protection, automatic cleanup, error boundaries, and user feedback
 */

import LoadingStateManager from '../LoadingStateManager';

describe('LoadingStateManager Error Handling', () => {
  let manager;
  let mockErrorCallback;
  let mockTimeoutCallback;
  let mockCleanupCallback;

  beforeEach(() => {
    jest.useFakeTimers();
    manager = new LoadingStateManager(true); // Enable debug mode
    mockErrorCallback = jest.fn();
    mockTimeoutCallback = jest.fn();
    mockCleanupCallback = jest.fn();
  });

  afterEach(() => {
    jest.useRealTimers();
    manager.cleanup();
  });

  describe('Timeout Protection', () => {
    it('should set timeout protection when starting loading', () => {
      const operation = 'testOperation';
      const timeout = 5000;

      manager.startLoading(operation, { timeout });

      expect(manager.timeouts.has(operation)).toBe(true);
      expect(manager.isLoading(operation)).toBe(true);
    });

    it('should trigger timeout after specified duration', () => {
      const operation = 'timeoutTest';
      const timeout = 5000;

      manager.startLoading(operation, { 
        timeout,
        onTimeout: mockTimeoutCallback 
      });

      expect(manager.isLoading(operation)).toBe(true);

      // Fast-forward time to trigger timeout
      jest.advanceTimersByTime(timeout);

      expect(manager.isLoading(operation)).toBe(false);
      expect(mockTimeoutCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'LoadingTimeoutError',
          operation,
          timeout
        }),
        operation
      );
    });

    it('should clear timeout when operation completes normally', () => {
      const operation = 'normalCompletion';
      const timeout = 5000;

      manager.startLoading(operation, { timeout });
      expect(manager.timeouts.has(operation)).toBe(true);

      manager.stopLoading(operation);
      expect(manager.timeouts.has(operation)).toBe(false);
      expect(manager.isLoading(operation)).toBe(false);
    });

    it('should not timeout if operation completes before timeout', () => {
      const operation = 'quickOperation';
      const timeout = 5000;

      manager.startLoading(operation, { 
        timeout,
        onTimeout: mockTimeoutCallback 
      });

      // Complete operation before timeout
      jest.advanceTimersByTime(2000);
      manager.stopLoading(operation);

      // Advance past timeout
      jest.advanceTimersByTime(4000);

      expect(mockTimeoutCallback).not.toHaveBeenCalled();
    });

    it('should use default timeout when none specified', () => {
      const operation = 'defaultTimeoutTest';

      manager.startLoading(operation);

      expect(manager.timeouts.has(operation)).toBe(true);
      expect(manager.isLoading(operation)).toBe(true);

      // Should timeout after default timeout (30 seconds)
      jest.advanceTimersByTime(manager.defaultTimeout);

      expect(manager.isLoading(operation)).toBe(false);
    });
  });

  describe('Error Callbacks', () => {
    it('should call error callback when set', () => {
      const operation = 'errorTest';
      const testError = new Error('Test error');

      manager.setErrorCallback(operation, mockErrorCallback);
      manager.handleLoadingError(operation, testError);

      expect(mockErrorCallback).toHaveBeenCalledWith(testError, operation);
    });

    it('should call error callback on timeout', () => {
      const operation = 'timeoutErrorTest';
      const timeout = 1000;

      manager.setErrorCallback(operation, mockErrorCallback);
      manager.startLoading(operation, { timeout });

      jest.advanceTimersByTime(timeout);

      expect(mockErrorCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'LoadingTimeoutError'
        }),
        operation
      );
    });

    it('should handle error callback exceptions gracefully', () => {
      const operation = 'callbackErrorTest';
      const testError = new Error('Test error');
      const faultyCallback = jest.fn(() => {
        throw new Error('Callback error');
      });

      manager.setErrorCallback(operation, faultyCallback);
      
      // Should not throw despite callback error
      expect(() => {
        manager.handleLoadingError(operation, testError);
      }).not.toThrow();

      expect(faultyCallback).toHaveBeenCalled();
    });
  });

  describe('Cleanup Callbacks', () => {
    it('should register and call cleanup callbacks', () => {
      manager.addCleanupCallback(mockCleanupCallback);
      
      manager.cleanup();

      expect(mockCleanupCallback).toHaveBeenCalled();
    });

    it('should handle multiple cleanup callbacks', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      const callback3 = jest.fn();

      manager.addCleanupCallback(callback1);
      manager.addCleanupCallback(callback2);
      manager.addCleanupCallback(callback3);

      manager.cleanup();

      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
      expect(callback3).toHaveBeenCalled();
    });

    it('should handle cleanup callback exceptions gracefully', () => {
      const faultyCallback = jest.fn(() => {
        throw new Error('Cleanup error');
      });
      const goodCallback = jest.fn();

      manager.addCleanupCallback(faultyCallback);
      manager.addCleanupCallback(goodCallback);

      expect(() => {
        manager.cleanup();
      }).not.toThrow();

      expect(faultyCallback).toHaveBeenCalled();
      expect(goodCallback).toHaveBeenCalled();
    });
  });

  describe('Error Boundary Callbacks', () => {
    it('should register and trigger error boundary callbacks', () => {
      const mockBoundaryCallback = jest.fn();
      const testError = new Error('Boundary test error');
      const operation = 'boundaryTest';

      manager.addErrorBoundaryCallback(mockBoundaryCallback);
      manager.triggerErrorBoundaryCallbacks(testError, operation);

      expect(mockBoundaryCallback).toHaveBeenCalledWith(testError, operation);
    });

    it('should handle multiple error boundary callbacks', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      const testError = new Error('Multi-boundary test');
      const operation = 'multiBoundaryTest';

      manager.addErrorBoundaryCallback(callback1);
      manager.addErrorBoundaryCallback(callback2);
      manager.triggerErrorBoundaryCallbacks(testError, operation);

      expect(callback1).toHaveBeenCalledWith(testError, operation);
      expect(callback2).toHaveBeenCalledWith(testError, operation);
    });
  });

  describe('Force Stop All Loading', () => {
    it('should stop all active loading operations', () => {
      const operations = ['op1', 'op2', 'op3'];

      // Start multiple operations
      operations.forEach(op => {
        manager.startLoading(op);
      });

      expect(Object.keys(manager.loadingStates)).toHaveLength(3);

      manager.forceStopAllLoading('Test force stop');

      expect(Object.keys(manager.loadingStates)).toHaveLength(0);
      expect(manager.timeouts.size).toBe(0);
    });

    it('should clear all timeouts when force stopping', () => {
      const operations = ['timeout1', 'timeout2'];

      operations.forEach(op => {
        manager.startLoading(op, { timeout: 10000 });
      });

      expect(manager.timeouts.size).toBe(2);

      manager.forceStopAllLoading('Clear timeouts test');

      expect(manager.timeouts.size).toBe(0);
    });

    it('should handle errors during force stop gracefully', () => {
      const operation = 'problematicOp';

      manager.startLoading(operation);
      
      // Corrupt the loading state to simulate an error
      manager.loadingStates[operation] = null;

      expect(() => {
        manager.forceStopAllLoading('Error handling test');
      }).not.toThrow();

      expect(Object.keys(manager.loadingStates)).toHaveLength(0);
    });
  });

  describe('Automatic Cleanup on Component Unmount', () => {
    it('should clean up all resources on cleanup', () => {
      const operations = ['cleanup1', 'cleanup2'];
      const cleanupCallback = jest.fn();

      manager.addCleanupCallback(cleanupCallback);

      operations.forEach(op => {
        manager.startLoading(op, { timeout: 10000 });
      });

      expect(Object.keys(manager.loadingStates)).toHaveLength(2);
      expect(manager.timeouts.size).toBe(2);

      manager.cleanup();

      expect(Object.keys(manager.loadingStates)).toHaveLength(0);
      expect(manager.timeouts.size).toBe(0);
      expect(manager.cleanupCallbacks).toHaveLength(0);
      expect(manager.errorBoundaryCallbacks).toHaveLength(0);
      expect(cleanupCallback).toHaveBeenCalled();
    });
  });

  describe('Error Context Enhancement', () => {
    it('should enhance errors with loading context', () => {
      const operation = 'contextTest';
      const testError = new Error('Context test error');

      manager.startLoading(operation);
      manager.handleLoadingError(operation, testError);

      expect(testError.operation).toBe(operation);
      expect(testError.loadingContext).toBeDefined();
      expect(testError.loadingContext.activeOperations).toContain(operation);
      expect(testError.loadingContext.sessionId).toBe(manager.debugSessionId);
    });

    it('should track operation history for errors', () => {
      const operation = 'historyTest';
      const testError = new Error('History test error');

      manager.startLoading(operation);
      manager.handleLoadingError(operation, testError);

      const history = manager.getOperationHistory();
      const errorEntry = history.find(entry => entry.action === 'ERROR');

      expect(errorEntry).toBeDefined();
      expect(errorEntry.name).toBe(operation);
      expect(errorEntry.error).toBe(testError.message);
    });
  });

  describe('User Feedback Integration', () => {
    it('should provide user-friendly error messages for timeouts', () => {
      const operation = 'userFeedbackTimeout';
      const timeout = 1000;
      let capturedError = null;

      manager.startLoading(operation, {
        timeout,
        onTimeout: (error) => {
          capturedError = error;
        }
      });

      vi.advanceTimersByTime(timeout);

      expect(capturedError).toBeDefined();
      expect(capturedError.name).toBe('LoadingTimeoutError');
      expect(capturedError.message).toContain('timed out');
      expect(capturedError.timeout).toBe(timeout);
    });

    it('should provide operation context in error messages', () => {
      const operation = 'contextualError';
      const testError = new Error('Test error');

      manager.handleLoadingError(operation, testError);

      expect(testError.operation).toBe(operation);
      expect(testError.loadingContext).toBeDefined();
    });
  });
});

describe('LoadingStateManager Integration with React Hook', () => {
  let manager;

  beforeEach(() => {
    jest.useFakeTimers();
    manager = new LoadingStateManager(true);
  });

  afterEach(() => {
    jest.useRealTimers();
    manager.cleanup();
  });

  it('should integrate error handling with React lifecycle', () => {
    const cleanupCallback = jest.fn();
    const errorBoundaryCallback = jest.fn();

    // Simulate React hook setup
    manager.addCleanupCallback(cleanupCallback);
    manager.addErrorBoundaryCallback(errorBoundaryCallback);

    // Start some operations
    manager.startLoading('reactOp1');
    manager.startLoading('reactOp2', { timeout: 1000 });

    // Simulate component unmount
    manager.cleanup();

    expect(cleanupCallback).toHaveBeenCalled();
    expect(Object.keys(manager.loadingStates)).toHaveLength(0);
  });

  it('should handle errors during React component lifecycle', () => {
    const errorBoundaryCallback = jest.fn();
    const testError = new Error('React lifecycle error');

    manager.addErrorBoundaryCallback(errorBoundaryCallback);
    manager.triggerErrorBoundaryCallbacks(testError, 'reactOperation');

    expect(errorBoundaryCallback).toHaveBeenCalledWith(testError, 'reactOperation');
  });
});
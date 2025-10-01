/**
 * ErrorHandlingBasic.test.js - Basic tests for error handling functionality
 */

import LoadingStateManager from '../LoadingStateManager';

describe('LoadingStateManager Error Handling - Basic Tests', () => {
  let manager;

  beforeEach(() => {
    jest.useFakeTimers();
    manager = new LoadingStateManager(true);
  });

  afterEach(() => {
    jest.useRealTimers();
    manager.cleanup();
  });

  test('should set and clear timeout protection', () => {
    const operation = 'timeoutTest';
    
    manager.startLoading(operation, { timeout: 5000 });
    
    // Should have timeout set
    expect(manager.timeouts.has(operation)).toBe(true);
    
    manager.stopLoading(operation);
    
    // Should have timeout cleared
    expect(manager.timeouts.has(operation)).toBe(false);
  });

  test('should handle timeout after specified duration', () => {
    const operation = 'timeoutOperation';
    const timeout = 1000;
    let timeoutCalled = false;
    
    manager.startLoading(operation, { 
      timeout,
      onTimeout: () => { timeoutCalled = true; }
    });
    
    expect(manager.isLoading(operation)).toBe(true);
    
    // Advance time to trigger timeout
    jest.advanceTimersByTime(timeout);
    
    expect(manager.isLoading(operation)).toBe(false);
    expect(timeoutCalled).toBe(true);
  });

  test('should register and call error callbacks', () => {
    const operation = 'errorTest';
    let errorCalled = false;
    let capturedError = null;
    
    const errorCallback = (error) => {
      errorCalled = true;
      capturedError = error;
    };
    
    manager.setErrorCallback(operation, errorCallback);
    
    const testError = new Error('Test error');
    manager.handleLoadingError(operation, testError);
    
    expect(errorCalled).toBe(true);
    expect(capturedError).toBe(testError);
  });

  test('should register and call cleanup callbacks', () => {
    let cleanupCalled = false;
    
    const cleanupCallback = () => {
      cleanupCalled = true;
    };
    
    manager.addCleanupCallback(cleanupCallback);
    manager.cleanup();
    
    expect(cleanupCalled).toBe(true);
  });

  test('should force stop all loading operations', () => {
    const operations = ['op1', 'op2', 'op3'];
    
    // Start multiple operations
    operations.forEach(op => {
      manager.startLoading(op);
    });
    
    expect(Object.keys(manager.loadingStates)).toHaveLength(3);
    
    manager.forceStopAllLoading('Test force stop');
    
    expect(Object.keys(manager.loadingStates)).toHaveLength(0);
  });

  test('should enhance errors with loading context', () => {
    const operation = 'contextTest';
    const testError = new Error('Context test error');
    
    manager.startLoading(operation);
    manager.handleLoadingError(operation, testError);
    
    expect(testError.operation).toBe(operation);
    expect(testError.loadingContext).toBeDefined();
    expect(testError.loadingContext.activeOperations).toContain(operation);
  });
});
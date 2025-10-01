/**
 * LoadingStateManager Tests
 * 
 * Comprehensive tests to ensure LoadingStateManager works correctly
 * and prevents unwanted automatic loading states.
 */

import LoadingStateManager from '../LoadingStateManager';

// Mock console methods for testing
const originalConsole = { ...console };
beforeEach(() => {
  console.log = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
});

afterEach(() => {
  Object.assign(console, originalConsole);
});

describe('LoadingStateManager', () => {
  let manager;

  beforeEach(() => {
    manager = new LoadingStateManager(true); // Enable debug mode for tests
  });

  afterEach(() => {
    manager.cleanup();
  });

  describe('Basic Loading State Management', () => {
    test('should start and stop loading operations correctly', () => {
      expect(manager.isLoading('testOperation')).toBe(false);
      
      const operationId = manager.startLoading('testOperation', {
        userAction: 'button click'
      });
      
      expect(manager.isLoading('testOperation')).toBe(true);
      expect(operationId).toBeTruthy();
      
      manager.stopLoading('testOperation');
      
      expect(manager.isLoading('testOperation')).toBe(false);
    });

    test('should handle multiple concurrent loading operations', () => {
      manager.startLoading('operation1', { userAction: 'click1' });
      manager.startLoading('operation2', { userAction: 'click2' });
      
      expect(manager.isLoading('operation1')).toBe(true);
      expect(manager.isLoading('operation2')).toBe(true);
      expect(manager.isLoading()).toBe(true); // Any operation loading
      
      manager.stopLoading('operation1');
      
      expect(manager.isLoading('operation1')).toBe(false);
      expect(manager.isLoading('operation2')).toBe(true);
      expect(manager.isLoading()).toBe(true); // Still has operation2
      
      manager.stopLoading('operation2');
      
      expect(manager.isLoading()).toBe(false); // No operations loading
    });

    test('should return correct active operations', () => {
      manager.startLoading('op1', { userAction: 'test1' });
      manager.startLoading('op2', { userAction: 'test2' });
      
      const activeOps = manager.getActiveOperations();
      
      expect(Object.keys(activeOps)).toHaveLength(2);
      expect(activeOps.op1).toBeDefined();
      expect(activeOps.op2).toBeDefined();
      expect(activeOps.op1.name).toBe('op1');
      expect(activeOps.op2.name).toBe('op2');
    });
  });

  describe('Input Validation', () => {
    test('should throw error for invalid operation names', () => {
      expect(() => manager.startLoading()).toThrow();
      expect(() => manager.startLoading(null)).toThrow();
      expect(() => manager.startLoading('')).toThrow();
      expect(() => manager.startLoading(123)).toThrow();
    });

    test('should handle stopping non-existent operations gracefully', () => {
      expect(() => manager.stopLoading('nonExistent')).not.toThrow();
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('non-existent loading operation')
      );
    });

    test('should handle invalid stop operation parameters', () => {
      expect(() => manager.stopLoading()).not.toThrow();
      expect(() => manager.stopLoading(null)).not.toThrow();
      expect(() => manager.stopLoading('')).not.toThrow();
    });
  });

  describe('Debug Logging and Stack Traces', () => {
    test('should log loading events in debug mode', () => {
      manager.startLoading('testOp', { userAction: 'test click' });
      
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('STARTED: testOp'),
        expect.any(Object)
      );
      
      manager.stopLoading('testOp');
      
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('STOPPED: testOp'),
        expect.any(Object)
      );
    });

    test('should capture stack traces', () => {
      const operationId = manager.startLoading('testOp', { userAction: 'test' });
      const activeOps = manager.getActiveOperations();
      
      expect(activeOps.testOp.debugInfo.stackTrace).toBeDefined();
      expect(Array.isArray(activeOps.testOp.debugInfo.stackTrace)).toBe(true);
      expect(activeOps.testOp.debugInfo.stackTrace.length).toBeGreaterThan(0);
    });

    test('should not log in non-debug mode', () => {
      const nonDebugManager = new LoadingStateManager(false);
      
      nonDebugManager.startLoading('testOp', { userAction: 'test' });
      
      // Should not have debug logs
      expect(console.log).not.toHaveBeenCalledWith(
        expect.stringContaining('STARTED: testOp'),
        expect.any(Object)
      );
      
      nonDebugManager.cleanup();
    });
  });

  describe('User Action Correlation', () => {
    test('should detect explicit user actions', () => {
      manager.startLoading('testOp', { userAction: 'button click' });
      const activeOps = manager.getActiveOperations();
      
      expect(activeOps.testOp.userTriggered).toBe(true);
      expect(activeOps.testOp.debugInfo.userAction).toBe('button click');
    });

    test('should detect trigger elements', () => {
      const mockElement = { tagName: 'BUTTON' };
      manager.startLoading('testOp', { triggerElement: mockElement });
      const activeOps = manager.getActiveOperations();
      
      expect(activeOps.testOp.userTriggered).toBe(true);
      expect(activeOps.testOp.debugInfo.triggerElement).toBe('BUTTON');
    });

    test('should warn about operations without clear user correlation', () => {
      // Create a stack trace that looks like automatic trigger
      const originalGetStackTrace = manager.getStackTrace;
      manager.getStackTrace = jest.fn().mockReturnValue([
        'at useEffect (React.js:123:45)',
        'at componentDidMount (Component.js:67:89)',
        'at automaticFunction (app.js:12:34)'
      ]);
      
      manager.startLoading('suspiciousOp');
      
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Loading state started without clear user action correlation'),
        expect.any(Object)
      );
      
      // Restore original method
      manager.getStackTrace = originalGetStackTrace;
    });

    test('should analyze stack traces for user interaction patterns', () => {
      // This test verifies the stack trace analysis logic
      const stackTrace = [
        'at handleClick (App.js:123:45)',
        'at onClick (Button.js:67:89)',
        'at fetchComments (api.js:12:34)'
      ];
      
      const validation = manager.validateUserAction(stackTrace, {});
      
      expect(validation.isUserTriggered).toBe(true);
      expect(validation.confidence).toBe('medium');
    });
  });

  describe('Operation History', () => {
    test('should maintain operation history', () => {
      manager.startLoading('op1', { userAction: 'test1' });
      manager.stopLoading('op1');
      manager.startLoading('op2', { userAction: 'test2' });
      manager.stopLoading('op2');
      
      const history = manager.getOperationHistory();
      
      expect(history.length).toBe(4); // 2 starts + 2 stops
      expect(history[0].action).toBe('STOP'); // Most recent first
      expect(history[0].name).toBe('op2');
      expect(history[1].action).toBe('START');
      expect(history[1].name).toBe('op2');
    });

    test('should limit history size', () => {
      // Create more operations than the max history size
      for (let i = 0; i < 150; i++) {
        manager.startLoading(`op${i}`, { userAction: `test${i}` });
        manager.stopLoading(`op${i}`);
      }
      
      const history = manager.getOperationHistory();
      
      expect(history.length).toBeLessThanOrEqual(100); // Max history size
    });
  });

  describe('Cleanup and Error Handling', () => {
    test('should cleanup all active operations', () => {
      manager.startLoading('op1', { userAction: 'test1' });
      manager.startLoading('op2', { userAction: 'test2' });
      
      expect(manager.isLoading()).toBe(true);
      
      manager.cleanup();
      
      expect(manager.isLoading()).toBe(false);
      expect(Object.keys(manager.getActiveOperations())).toHaveLength(0);
    });

    test('should warn about long-running operations', (done) => {
      manager.startLoading('longOp', { userAction: 'test' });
      
      // Mock a long-running operation by manipulating the start time
      const activeOps = manager.getActiveOperations();
      activeOps.longOp.startTime = Date.now() - 35000; // 35 seconds ago
      
      manager.stopLoading('longOp');
      
      setTimeout(() => {
        expect(console.warn).toHaveBeenCalledWith(
          expect.stringContaining('Long-running operation detected'),
          expect.any(Object)
        );
        done();
      }, 10);
    });

    test('should handle duration calculation correctly', () => {
      const startTime = Date.now();
      manager.startLoading('timedOp', { userAction: 'test' });
      
      // Wait a small amount of time
      setTimeout(() => {
        manager.stopLoading('timedOp');
        
        const history = manager.getOperationHistory();
        const stopEvent = history.find(h => h.action === 'STOP' && h.name === 'timedOp');
        
        expect(stopEvent.duration).toBeGreaterThan(0);
        expect(stopEvent.duration).toBeLessThan(1000); // Should be very quick
      }, 10);
    });
  });

  describe('Debug Information', () => {
    test('should provide comprehensive debug information', () => {
      manager.startLoading('debugOp', { userAction: 'debug test' });
      
      const debugInfo = manager.getDebugInfo();
      
      expect(debugInfo.activeOperations).toContain('debugOp');
      expect(debugInfo.operationCount).toBe(1);
      expect(debugInfo.debugMode).toBe(true);
      expect(Array.isArray(debugInfo.history)).toBe(true);
    });

    test('should allow toggling debug mode', () => {
      expect(manager.debugMode).toBe(true);
      
      manager.setDebugMode(false);
      expect(manager.debugMode).toBe(false);
      
      manager.setDebugMode(true);
      expect(manager.debugMode).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    test('should handle rapid start/stop cycles', () => {
      for (let i = 0; i < 10; i++) {
        manager.startLoading('rapidOp', { userAction: `rapid${i}` });
        manager.stopLoading('rapidOp');
      }
      
      expect(manager.isLoading('rapidOp')).toBe(false);
      expect(manager.getOperationHistory().length).toBe(20); // 10 starts + 10 stops
    });

    test('should handle same operation started multiple times', () => {
      manager.startLoading('duplicateOp', { userAction: 'first' });
      
      // Starting the same operation again should replace the previous one
      manager.startLoading('duplicateOp', { userAction: 'second' });
      
      const activeOps = manager.getActiveOperations();
      expect(Object.keys(activeOps)).toHaveLength(1);
      expect(activeOps.duplicateOp.debugInfo.userAction).toBe('second');
    });

    test('should handle operations with special characters', () => {
      const specialOp = 'op-with_special.chars@123';
      
      expect(() => {
        manager.startLoading(specialOp, { userAction: 'special test' });
        expect(manager.isLoading(specialOp)).toBe(true);
        manager.stopLoading(specialOp);
        expect(manager.isLoading(specialOp)).toBe(false);
      }).not.toThrow();
    });
  });
});
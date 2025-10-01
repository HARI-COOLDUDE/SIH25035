/**
 * Tests for LoadingStateManager Enhanced Debugging System
 * 
 * This test file verifies the enhanced debugging capabilities including:
 * - Development-mode logging for all loading state changes
 * - Stack trace capture for loading state triggers
 * - User action correlation tracking
 * - Runtime warnings for unexpected loading states
 */

import LoadingStateManager from '../LoadingStateManager';

// Mock console methods for testing
const mockConsole = {
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  group: jest.fn(),
  groupEnd: jest.fn()
};

// Store original console methods
const originalConsole = {
  log: console.log,
  warn: console.warn,
  error: console.error,
  group: console.group,
  groupEnd: console.groupEnd
};

describe('LoadingStateManager Enhanced Debugging System', () => {
  let manager;

  beforeEach(() => {
    // Mock console methods
    Object.assign(console, mockConsole);
    
    // Clear all mock calls
    Object.values(mockConsole).forEach(mock => mock.mockClear());
    
    // Create manager in debug mode
    manager = new LoadingStateManager(true);
  });

  afterEach(() => {
    // Restore original console methods
    Object.assign(console, originalConsole);
    
    // Cleanup manager
    if (manager) {
      manager.cleanup();
    }
  });

  describe('Development-mode logging', () => {
    test('should log system information on initialization', () => {
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('[LoadingStateManager] Initialized in debug mode')
      );
      expect(mockConsole.group).toHaveBeenCalledWith(
        expect.stringContaining('[LoadingStateManager] System Info')
      );
    });

    test('should log loading state changes with enhanced information', () => {
      const operation = 'testOperation';
      const options = {
        userAction: 'button click',
        triggerElement: { tagName: 'BUTTON' }
      };

      manager.startLoading(operation, options);
      
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('STARTED: testOperation'),
        expect.objectContaining({
          operation,
          action: 'STARTED',
          userTriggered: true,
          userAction: 'button click',
          sessionId: expect.any(String)
        })
      );

      manager.stopLoading(operation);
      
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('STOPPED: testOperation'),
        expect.objectContaining({
          operation,
          action: 'STOPPED',
          performanceMetrics: expect.objectContaining({
            duration: expect.any(Number)
          })
        })
      );
    });

    test('should use warning log level for non-user-triggered operations', () => {
      const operation = 'automaticOperation';
      
      // Simulate automatic loading by not providing user action info
      manager.startLoading(operation, {});
      
      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining('STARTED: automaticOperation'),
        expect.any(Object)
      );
    });
  });

  describe('Stack trace capture', () => {
    test('should capture and include stack trace in operation data', () => {
      const operation = 'stackTraceTest';
      
      manager.startLoading(operation, { userAction: 'test' });
      
      const activeOps = manager.getActiveOperations();
      const operationData = activeOps[operation];
      
      expect(operationData.debugInfo.stackTrace).toBeDefined();
      expect(Array.isArray(operationData.debugInfo.stackTrace)).toBe(true);
      expect(operationData.debugInfo.stackTrace.length).toBeGreaterThan(0);
    });

    test('should include stack trace in debug logs', () => {
      const operation = 'stackTraceLogTest';
      
      manager.startLoading(operation, { userAction: 'test' });
      
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          stackTrace: expect.any(Array)
        })
      );
    });
  });

  describe('User action correlation tracking', () => {
    test('should track high confidence user actions', () => {
      const operation = 'highConfidenceTest';
      const options = {
        userAction: 'explicit button click',
        triggerElement: { tagName: 'BUTTON' }
      };
      
      manager.startLoading(operation, options);
      
      const debugInfo = manager.getComprehensiveDebugInfo();
      const correlation = debugInfo.userActionCorrelations.find(c => c.operation === operation);
      
      expect(correlation).toBeDefined();
      expect(correlation.confidence).toBe('high');
      expect(correlation.isUserTriggered).toBe(true);
      expect(correlation.userAction).toBe('explicit button click');
    });

    test('should detect and warn about low confidence correlations', () => {
      const operation = 'lowConfidenceTest';
      
      // Start loading without clear user action
      manager.startLoading(operation, {});
      
      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining('Non-user-triggered loading analysis'),
        expect.any(Object)
      );
      
      const debugInfo = manager.getComprehensiveDebugInfo();
      expect(debugInfo.statistics.lowConfidenceCorrelations).toBeGreaterThan(0);
    });

    test('should correlate user actions with loading operations', () => {
      const operation = 'correlationTest';
      const userAction = 'form submission';
      
      manager.startLoading(operation, { userAction });
      
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('User Action Correlation'),
        expect.objectContaining({
          userAction,
          confidence: expect.any(String),
          isUserTriggered: expect.any(Boolean)
        })
      );
    });
  });

  describe('Runtime warnings for unexpected loading states', () => {
    test('should detect automatic loading patterns', () => {
      const operation = 'automaticTest';
      
      // Mock stack trace that contains useEffect pattern
      const originalGetStackTrace = manager.getStackTrace;
      manager.getStackTrace = jest.fn(() => [
        'at useEffect (react.js:123)',
        'at Component.render (component.js:456)',
        'at automaticTest (test.js:789)'
      ]);
      
      manager.startLoading(operation, {});
      
      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining('AUTOMATIC LOADING DETECTED'),
        expect.objectContaining({
          triggers: expect.arrayContaining(['useEffect hook']),
          recommendation: expect.stringContaining('user action handler')
        })
      );
      
      // Restore original method
      manager.getStackTrace = originalGetStackTrace;
    });

    test('should warn about long-running operations', (done) => {
      const operation = 'longRunningTest';
      
      manager.startLoading(operation, { userAction: 'test' });
      
      // Mock a long duration
      const activeOp = manager.getActiveOperations()[operation];
      activeOp.startTime = Date.now() - 35000; // 35 seconds ago
      
      manager.stopLoading(operation);
      
      expect(mockConsole.group).toHaveBeenCalledWith(
        expect.stringContaining('UNEXPECTED LOADING WARNING')
      );
      
      done();
    });

    test('should track unexpected loading warnings', () => {
      const operation = 'unexpectedTest';
      
      manager.logUnexpectedLoading(operation, {
        reason: 'test warning',
        recommendation: 'fix this issue'
      });
      
      const debugInfo = manager.getComprehensiveDebugInfo();
      expect(debugInfo.unexpectedLoadingWarnings).toHaveLength(1);
      expect(debugInfo.unexpectedLoadingWarnings[0]).toMatchObject({
        operation,
        context: expect.objectContaining({
          reason: 'test warning',
          recommendation: 'fix this issue'
        })
      });
    });
  });

  describe('Performance metrics tracking', () => {
    test('should track operation performance metrics', () => {
      const operation = 'performanceTest';
      
      manager.startLoading(operation, { userAction: 'test' });
      
      // Wait a bit to ensure measurable duration
      setTimeout(() => {
        manager.stopLoading(operation);
        
        const debugInfo = manager.getComprehensiveDebugInfo();
        const metrics = debugInfo.performanceMetrics[operation];
        
        expect(metrics).toBeDefined();
        expect(metrics.count).toBe(1);
        expect(metrics.totalDuration).toBeGreaterThan(0);
        expect(metrics.averageDuration).toBeGreaterThan(0);
        expect(metrics.minDuration).toBeGreaterThan(0);
        expect(metrics.maxDuration).toBeGreaterThan(0);
      }, 10);
    });

    test('should warn about performance issues', () => {
      const operation = 'slowOperation';
      
      // Mock performance tracking to simulate slow operation
      manager.trackPerformanceMetrics(operation, 15000, { userTriggered: true });
      
      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining('PERFORMANCE WARNING'),
        expect.objectContaining({
          operation,
          duration: 15000
        })
      );
    });
  });

  describe('Comprehensive debug information', () => {
    test('should provide comprehensive debug information', () => {
      const operation = 'comprehensiveTest';
      
      manager.startLoading(operation, { userAction: 'test action' });
      manager.stopLoading(operation);
      
      const debugInfo = manager.getComprehensiveDebugInfo();
      
      expect(debugInfo).toMatchObject({
        sessionId: expect.any(String),
        debugMode: true,
        timestamp: expect.any(String),
        activeOperations: expect.any(Array),
        operationCount: expect.any(Number),
        operationHistory: expect.any(Array),
        performanceMetrics: expect.any(Object),
        userActionCorrelations: expect.any(Array),
        systemInfo: expect.objectContaining({
          userAgent: expect.any(String),
          viewport: expect.any(String),
          url: expect.any(String)
        }),
        statistics: expect.objectContaining({
          totalOperationsStarted: expect.any(Number),
          totalOperationsCompleted: expect.any(Number),
          averageOperationDuration: expect.any(Number)
        })
      });
    });

    test('should generate summary report with recommendations', () => {
      const operation = 'reportTest';
      
      // Create some test data
      manager.startLoading(operation, {});
      manager.stopLoading(operation);
      
      const report = manager.generateSummaryReport();
      
      expect(report).toMatchObject({
        sessionId: expect.any(String),
        reportTimestamp: expect.any(String),
        overallHealth: expect.objectContaining({
          totalOperations: expect.any(Number),
          unexpectedLoadingRate: expect.any(Number),
          automaticLoadingRate: expect.any(Number)
        }),
        issues: expect.objectContaining({
          unexpectedLoading: expect.any(Number),
          automaticLoading: expect.any(Number)
        }),
        recommendations: expect.any(Array),
        problematicOperations: expect.any(Array)
      });
    });
  });

  describe('Debug data export', () => {
    test('should export debug data for analysis', () => {
      const operation = 'exportTest';
      
      manager.startLoading(operation, { userAction: 'test' });
      manager.stopLoading(operation);
      
      const exportData = manager.exportDebugData();
      
      expect(exportData).toMatchObject({
        exportTimestamp: expect.any(String),
        exportVersion: expect.any(String),
        sessionId: expect.any(String),
        debugMode: true
      });
    });

    test('should optionally exclude stack traces from export', () => {
      const operation = 'exportNoStackTest';
      
      manager.startLoading(operation, { userAction: 'test' });
      manager.stopLoading(operation);
      
      const exportData = manager.exportDebugData(false);
      
      // Check that stack traces are removed
      exportData.operationHistory.forEach(op => {
        if (op.debugInfo) {
          expect(op.debugInfo.stackTrace).toBeUndefined();
        }
      });
    });
  });
});
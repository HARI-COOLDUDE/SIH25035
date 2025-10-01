/**
 * Tests for LoadingStateDebugger
 * 
 * These tests verify the debugging system functionality including issue detection,
 * report generation, and monitoring capabilities.
 */

import LoadingStateManager from '../LoadingStateManager';
import LoadingStateDebugger from '../LoadingStateDebugger';

// Mock console methods to capture debug output
const mockConsole = {
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  group: jest.fn(),
  groupEnd: jest.fn()
};

// Mock DOM methods
Object.defineProperty(window, 'navigator', {
  value: { userAgent: 'test-agent' },
  writable: true
});

Object.defineProperty(window, 'location', {
  value: { href: 'http://test.com' },
  writable: true
});

describe('LoadingStateDebugger', () => {
  let manager;
  let debuggerInstance;

  beforeEach(() => {
    // Enable debug mode
    manager = new LoadingStateManager(true);
    debuggerInstance = new LoadingStateDebugger(manager);
    
    // Mock console methods
    global.console = mockConsole;
    
    // Clear mock calls
    Object.values(mockConsole).forEach(mock => mock.mockClear());
  });

  afterEach(() => {
    if (debuggerInstance) {
      debuggerInstance.cleanup();
    }
    if (manager) {
      manager.cleanup();
    }
  });

  describe('Initialization', () => {
    test('should initialize with default detectors and generators', () => {
      expect(debuggerInstance.issueDetectors.length).toBeGreaterThan(0);
      expect(debuggerInstance.reportGenerators.length).toBeGreaterThan(0);
      expect(debuggerInstance.debugMode).toBe(true);
    });

    test('should register custom issue detector', () => {
      const customDetector = jest.fn(() => []);
      debuggerInstance.registerIssueDetector('custom', customDetector);
      
      const detector = debuggerInstance.issueDetectors.find(d => d.name === 'custom');
      expect(detector).toBeDefined();
      expect(detector.detector).toBe(customDetector);
    });

    test('should register custom report generator', () => {
      const customGenerator = jest.fn(() => ({}));
      debuggerInstance.registerReportGenerator('custom', customGenerator);
      
      const generator = debuggerInstance.reportGenerators.find(g => g.name === 'custom');
      expect(generator).toBeDefined();
      expect(generator.generator).toBe(customGenerator);
    });
  });

  describe('Issue Detection', () => {
    test('should detect automatic loading issues', () => {
      // Simulate automatic loading detection
      manager.automaticLoadingDetections.push({
        operation: 'testOperation',
        triggers: ['useEffect hook'],
        timestamp: Date.now(),
        sessionId: manager.debugSessionId
      });

      const issues = debuggerInstance.detectAutomaticLoading();
      
      expect(issues.length).toBe(1);
      expect(issues[0].type).toBe('automatic_loading');
      expect(issues[0].severity).toBe('high');
      expect(issues[0].operation).toBe('testOperation');
    });

    test('should detect stuck loading states', () => {
      // Simulate stuck loading state
      const stuckOperation = {
        id: 'stuck_123',
        name: 'stuckOperation',
        startTime: Date.now() - 150000, // 2.5 minutes ago
        userTriggered: true,
        debugInfo: {
          stackTrace: ['test stack'],
          triggerElement: 'button',
          userAction: 'click'
        }
      };
      
      manager.loadingStates['stuckOperation'] = stuckOperation;

      const issues = debuggerInstance.detectStuckLoading();
      
      expect(issues.length).toBe(1);
      expect(issues[0].type).toBe('stuck_loading');
      expect(issues[0].severity).toBe('critical');
      expect(issues[0].operation).toBe('stuckOperation');
    });

    test('should detect rapid cycling issues', () => {
      // Simulate rapid cycling by adding multiple START operations
      const now = Date.now();
      for (let i = 0; i < 12; i++) {
        manager.operationHistory.unshift({
          action: 'START',
          name: 'rapidOperation',
          timestamp: now - (i * 1000) // Spread over last 12 seconds
        });
      }

      const issues = debuggerInstance.detectRapidCycling();
      
      expect(issues.length).toBe(1);
      expect(issues[0].type).toBe('rapid_cycling');
      expect(issues[0].severity).toBe('critical');
      expect(issues[0].operation).toBe('rapidOperation');
    });

    test('should detect performance issues', () => {
      // Simulate slow operation metrics
      manager.performanceMetrics['slowOperation'] = {
        count: 5,
        totalDuration: 60000,
        averageDuration: 12000, // 12 seconds average
        minDuration: 8000,
        maxDuration: 35000, // 35 seconds max
        operations: [
          { duration: 12000, timestamp: Date.now() },
          { duration: 35000, timestamp: Date.now() - 1000 }
        ]
      };

      const issues = debuggerInstance.detectPerformanceIssues();
      
      expect(issues.length).toBeGreaterThan(0);
      expect(issues.some(i => i.type === 'slow_operation')).toBe(true);
      expect(issues.some(i => i.type === 'very_slow_operation')).toBe(true);
    });

    test('should detect all issues comprehensively', () => {
      // Set up various issues
      manager.automaticLoadingDetections.push({
        operation: 'autoOp',
        triggers: ['useEffect'],
        timestamp: Date.now()
      });

      manager.loadingStates['stuckOp'] = {
        name: 'stuckOp',
        startTime: Date.now() - 150000,
        userTriggered: true
      };

      const issues = debuggerInstance.detectAllIssues();
      
      expect(issues.length).toBeGreaterThan(0);
      expect(issues.every(issue => issue.detector)).toBe(true);
      
      // Should be sorted by severity
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      for (let i = 1; i < issues.length; i++) {
        const prevSeverity = severityOrder[issues[i-1].severity] || 0;
        const currSeverity = severityOrder[issues[i].severity] || 0;
        expect(prevSeverity).toBeGreaterThanOrEqual(currSeverity);
      }
    });
  });

  describe('Report Generation', () => {
    test('should generate comprehensive report', () => {
      const report = debuggerInstance.generateReport('comprehensive');
      
      expect(report).toBeDefined();
      expect(report.reportType).toBe('comprehensive');
      expect(report.timestamp).toBeDefined();
      expect(report.sessionId).toBe(manager.debugSessionId);
      expect(report.summary).toBeDefined();
      expect(report.loadingStateHealth).toBeDefined();
      expect(report.userActionCorrelation).toBeDefined();
      expect(report.detectedIssues).toBeDefined();
      expect(report.systemInfo).toBeDefined();
    });

    test('should generate security report', () => {
      // Add some security-relevant data
      manager.automaticLoadingDetections.push({
        operation: 'securityRisk',
        triggers: ['useEffect'],
        timestamp: Date.now()
      });

      const report = debuggerInstance.generateReport('security');
      
      expect(report).toBeDefined();
      expect(report.reportType).toBe('security');
      expect(report.automaticLoadingRisks).toBeDefined();
      expect(report.debugDataExposure).toBeDefined();
      expect(report.performanceRisks).toBeDefined();
    });

    test('should generate performance report', () => {
      // Add performance data
      manager.performanceMetrics['testOp'] = {
        count: 3,
        averageDuration: 5000,
        minDuration: 2000,
        maxDuration: 8000,
        operations: [
          { duration: 5000, timestamp: Date.now() }
        ]
      };

      const report = debuggerInstance.generateReport('performance');
      
      expect(report).toBeDefined();
      expect(report.reportType).toBe('performance');
      expect(report.summary).toBeDefined();
      expect(report.operationMetrics).toBeDefined();
      expect(report.issues).toBeDefined();
      expect(report.recommendations).toBeDefined();
    });

    test('should generate user experience report', () => {
      const report = debuggerInstance.generateReport('user_experience');
      
      expect(report).toBeDefined();
      expect(report.reportType).toBe('user_experience');
      expect(report.summary).toBeDefined();
      expect(report.userActionCorrelation).toBeDefined();
      expect(report.uxIssues).toBeDefined();
      expect(report.recommendations).toBeDefined();
    });

    test('should handle unknown report type', () => {
      const report = debuggerInstance.generateReport('unknown');
      
      expect(report).toBeNull();
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('Unknown report type: unknown')
      );
    });
  });

  describe('Health Calculation', () => {
    test('should calculate excellent health with no issues', () => {
      const health = debuggerInstance.calculateOverallHealth([]);
      expect(health).toBe('excellent');
    });

    test('should calculate critical health with critical issues', () => {
      const issues = [{ severity: 'critical' }];
      const health = debuggerInstance.calculateOverallHealth(issues);
      expect(health).toBe('critical');
    });

    test('should calculate poor health with multiple high issues', () => {
      const issues = [
        { severity: 'high' },
        { severity: 'high' },
        { severity: 'high' }
      ];
      const health = debuggerInstance.calculateOverallHealth(issues);
      expect(health).toBe('poor');
    });

    test('should calculate fair health with some high and medium issues', () => {
      const issues = [
        { severity: 'high' },
        { severity: 'medium' },
        { severity: 'medium' }
      ];
      const health = debuggerInstance.calculateOverallHealth(issues);
      expect(health).toBe('fair');
    });

    test('should calculate good health with only medium issues', () => {
      const issues = [{ severity: 'medium' }];
      const health = debuggerInstance.calculateOverallHealth(issues);
      expect(health).toBe('good');
    });
  });

  describe('Real-time Monitoring', () => {
    test('should start and stop real-time monitoring', () => {
      expect(debuggerInstance.realTimeMonitorInterval).toBeDefined();
      
      debuggerInstance.stopRealTimeMonitoring();
      expect(debuggerInstance.realTimeMonitorInterval).toBeNull();
    });

    test('should generate immediate alerts for critical issues', () => {
      const criticalIssues = [
        {
          type: 'stuck_loading',
          severity: 'critical',
          operation: 'testOp',
          message: 'Test critical issue',
          recommendation: 'Fix it'
        }
      ];

      debuggerInstance.generateImmediateAlert(criticalIssues);
      
      expect(mockConsole.group).toHaveBeenCalledWith(
        expect.stringContaining('CRITICAL ALERT')
      );
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('1 critical loading state issues detected')
      );
    });
  });

  describe('Data Export', () => {
    test('should export debug data as JSON', () => {
      const jsonData = debuggerInstance.exportDebugData('json');
      
      expect(typeof jsonData).toBe('string');
      expect(() => JSON.parse(jsonData)).not.toThrow();
      
      const parsed = JSON.parse(jsonData);
      expect(parsed.reportType).toBe('comprehensive');
      expect(parsed.exportTimestamp).toBeDefined();
    });

    test('should export debug data as CSV', () => {
      // Add some issues for CSV export
      manager.automaticLoadingDetections.push({
        operation: 'testOp',
        triggers: ['useEffect'],
        timestamp: Date.now()
      });

      const csvData = debuggerInstance.exportDebugData('csv');
      
      expect(typeof csvData).toBe('string');
      expect(csvData).toContain('Type,Severity,Operation,Message,Recommendation,Timestamp');
      expect(csvData.split('\n').length).toBeGreaterThan(1);
    });

    test('should throw error for unsupported export format', () => {
      expect(() => {
        debuggerInstance.exportDebugData('xml');
      }).toThrow('Unsupported export format: xml');
    });
  });

  describe('Variance Calculation', () => {
    test('should calculate variance correctly', () => {
      const numbers = [1, 2, 3, 4, 5];
      const variance = debuggerInstance.calculateVariance(numbers);
      
      // Expected variance for [1,2,3,4,5] is 2
      expect(variance).toBe(2);
    });

    test('should handle empty array', () => {
      const variance = debuggerInstance.calculateVariance([]);
      expect(variance).toBe(0);
    });

    test('should handle single value', () => {
      const variance = debuggerInstance.calculateVariance([5]);
      expect(variance).toBe(0);
    });
  });

  describe('CSV Conversion', () => {
    test('should convert report to CSV format correctly', () => {
      const report = {
        detectedIssues: [
          {
            type: 'test_issue',
            severity: 'high',
            operation: 'testOp',
            message: 'Test message with "quotes"',
            recommendation: 'Test recommendation',
            timestamp: Date.now()
          }
        ]
      };

      const csv = debuggerInstance.convertReportToCSV(report);
      const lines = csv.split('\n');
      
      expect(lines[0]).toBe('Type,Severity,Operation,Message,Recommendation,Timestamp');
      expect(lines[1]).toContain('test_issue,high,testOp');
      expect(lines[1]).toContain('"Test message with ""quotes"""'); // Escaped quotes
    });
  });

  describe('Cleanup', () => {
    test('should cleanup resources properly', () => {
      const stopMonitoringSpy = jest.spyOn(debuggerInstance, 'stopRealTimeMonitoring');
      
      debuggerInstance.cleanup();
      
      expect(stopMonitoringSpy).toHaveBeenCalled();
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('Cleanup completed')
      );
    });
  });

  describe('Integration with LoadingStateManager', () => {
    test('should work with actual loading operations', async () => {
      // Start a loading operation
      const operationId = manager.startLoading('testOperation', {
        userAction: 'button click',
        triggerElement: { tagName: 'BUTTON' }
      });

      // Let it run for a bit
      await new Promise(resolve => setTimeout(resolve, 100));

      // Stop the operation
      manager.stopLoading('testOperation');

      // Check that debuggerInstance can analyze the operation
      const issues = debuggerInstance.detectAllIssues();
      const report = debuggerInstance.generateReport('comprehensive');

      expect(report.loadingStateHealth.totalOperationsStarted).toBe(1);
      expect(report.userActionCorrelation.totalCorrelations).toBe(1);
    });

    test('should detect issues in real loading scenarios', async () => {
      // Simulate automatic loading (should be detected as issue)
      manager.startLoading('automaticOperation'); // No user action provided
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const issues = debuggerInstance.detectAllIssues();
      const automaticIssues = issues.filter(i => i.type === 'automatic_loading' || i.type === 'weak_user_correlation');
      
      expect(automaticIssues.length).toBeGreaterThan(0);
    });
  });
});
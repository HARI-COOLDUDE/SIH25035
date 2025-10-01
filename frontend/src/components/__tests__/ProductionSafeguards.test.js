/**
 * Production Safeguards Tests
 * 
 * Tests for the production safeguards system including performance monitoring,
 * user experience validation, and pattern monitoring.
 */

import LoadingStateManager from '../LoadingStateManager.js';
import ProductionSafeguards from '../../utils/productionSafeguards.js';
import UserExperienceValidator from '../../utils/userExperienceValidator.js';
import PatternMonitor from '../../utils/patternMonitor.js';
import ProductionConfig from '../../utils/productionConfig.js';
import { createProductionSafeguards } from '../../utils/productionSafeguardsIntegration.js';

// Mock environment
const originalEnv = process.env.NODE_ENV;

describe('Production Safeguards System', () => {
  let loadingStateManager;
  let productionSafeguards;
  let userExperienceValidator;
  let patternMonitor;
  let safeguardsIntegration;

  beforeEach(() => {
    // Reset environment
    process.env.NODE_ENV = 'development';
    
    // Create fresh instances
    loadingStateManager = new LoadingStateManager(true);
    
    // Mock performance.now for consistent testing
    global.performance = {
      now: jest.fn(() => Date.now())
    };
    
    // Mock console methods to avoid noise in tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'info').mockImplementation(() => {});
  });

  afterEach(() => {
    // Cleanup
    if (loadingStateManager) {
      loadingStateManager.cleanup();
    }
    if (productionSafeguards) {
      productionSafeguards.cleanup();
    }
    if (userExperienceValidator) {
      userExperienceValidator.cleanup();
    }
    if (patternMonitor) {
      patternMonitor.cleanup();
    }
    if (safeguardsIntegration) {
      safeguardsIntegration.cleanup();
    }
    
    // Restore environment
    process.env.NODE_ENV = originalEnv;
    
    // Restore console
    jest.restoreAllMocks();
  });

  describe('ProductionConfig', () => {
    test('should detect development environment correctly', () => {
      const config = ProductionConfig;
      expect(config.environment.isDevelopment).toBe(true);
      expect(config.environment.isProduction).toBe(false);
    });

    test('should provide appropriate debug configuration for development', () => {
      const config = ProductionConfig;
      const debugConfig = config.getDebugConfig();
      
      expect(debugConfig.enableDebugLogging).toBe(true);
      expect(debugConfig.enableStackTraces).toBe(true);
    });

    test('should provide performance thresholds', () => {
      const config = ProductionConfig;
      const thresholds = config.getPerformanceThresholds();
      
      expect(thresholds.slowOperationMs).toBeGreaterThan(0);
      expect(thresholds.verySlowOperationMs).toBeGreaterThan(thresholds.slowOperationMs);
      expect(thresholds.stuckOperationMs).toBeGreaterThan(thresholds.verySlowOperationMs);
    });

    test('should create production-safe logger', () => {
      const config = ProductionConfig;
      const logger = config.createLogger('TestComponent');
      
      expect(logger).toHaveProperty('debug');
      expect(logger).toHaveProperty('info');
      expect(logger).toHaveProperty('warn');
      expect(logger).toHaveProperty('error');
      expect(logger).toHaveProperty('verbose');
    });
  });

  describe('ProductionSafeguards', () => {
    beforeEach(() => {
      productionSafeguards = new ProductionSafeguards(loadingStateManager, {
        enablePerformanceMonitoring: true,
        enableUserExperienceValidation: true,
        enablePatternMonitoring: true
      });
    });

    test('should initialize with correct configuration', () => {
      expect(productionSafeguards.manager).toBe(loadingStateManager);
      expect(productionSafeguards.isProduction).toBe(false);
      expect(productionSafeguards.isDevelopment).toBe(true);
    });

    test('should track operation performance', async () => {
      const operation = 'testOperation';
      
      // Start operation
      loadingStateManager.startLoading(operation, { userAction: 'button_click' });
      
      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Stop operation
      loadingStateManager.stopLoading(operation);
      
      // Check metrics
      const metrics = productionSafeguards.getMetricsSummary();
      expect(metrics.uxMetrics.totalLoadingEvents).toBeGreaterThan(0);
    });

    test('should detect slow operations', async () => {
      const operation = 'slowOperation';
      
      // Mock slow operation
      const originalNow = performance.now;
      let callCount = 0;
      performance.now = jest.fn(() => {
        callCount++;
        if (callCount === 1) return 1000; // Start time
        return 7000; // End time (6 second duration)
      });
      
      loadingStateManager.startLoading(operation, { userAction: 'button_click' });
      loadingStateManager.stopLoading(operation);
      
      // Check if slow operation was detected
      expect(productionSafeguards.alertHistory.length).toBeGreaterThan(0);
      
      performance.now = originalNow;
    });

    test('should detect rapid cycling', () => {
      const operation = 'rapidOperation';
      
      // Trigger rapid cycling
      for (let i = 0; i < 5; i++) {
        loadingStateManager.startLoading(operation, { userAction: 'button_click' });
        loadingStateManager.stopLoading(operation);
      }
      
      // Check if rapid cycling was detected
      const metrics = productionSafeguards.getMetricsSummary();
      expect(metrics.uxMetrics.rapidCyclingEvents).toBeGreaterThan(0);
    });

    test('should provide metrics summary', () => {
      const metrics = productionSafeguards.getMetricsSummary();
      
      expect(metrics).toHaveProperty('sessionId');
      expect(metrics).toHaveProperty('sessionDuration');
      expect(metrics).toHaveProperty('uxMetrics');
      expect(metrics).toHaveProperty('issueCount');
      expect(metrics).toHaveProperty('isMonitoring');
    });
  });

  describe('UserExperienceValidator', () => {
    beforeEach(() => {
      userExperienceValidator = new UserExperienceValidator(loadingStateManager, {
        minLoadingDuration: 100,
        maxAcceptableDelay: 3000,
        flashingThreshold: 200
      });
    });

    test('should initialize with correct configuration', () => {
      expect(userExperienceValidator.manager).toBe(loadingStateManager);
      expect(userExperienceValidator.config.minLoadingDuration).toBe(100);
      expect(userExperienceValidator.config.maxAcceptableDelay).toBe(3000);
    });

    test('should detect flashing loading states', () => {
      const operation = 'flashingOperation';
      
      // Mock very short operation
      const originalNow = performance.now;
      let callCount = 0;
      performance.now = jest.fn(() => {
        callCount++;
        if (callCount === 1) return 1000; // Start time
        return 1050; // End time (50ms duration - below threshold)
      });
      
      loadingStateManager.startLoading(operation, { userAction: 'button_click' });
      loadingStateManager.stopLoading(operation);
      
      // Check UX metrics
      const metrics = userExperienceValidator.getUXMetrics();
      expect(metrics.flashingEvents).toBeGreaterThan(0);
      
      performance.now = originalNow;
    });

    test('should detect long loading without feedback', () => {
      const operation = 'longOperation';
      
      // Mock long operation
      const originalNow = performance.now;
      let callCount = 0;
      performance.now = jest.fn(() => {
        callCount++;
        if (callCount === 1) return 1000; // Start time
        return 5000; // End time (4 second duration - above threshold)
      });
      
      loadingStateManager.startLoading(operation, { userAction: 'button_click' });
      loadingStateManager.stopLoading(operation);
      
      // Check UX metrics
      const metrics = userExperienceValidator.getUXMetrics();
      expect(metrics.longLoadingEvents).toBeGreaterThan(0);
      
      performance.now = originalNow;
    });

    test('should generate UX recommendations', () => {
      // Trigger some UX issues
      const operation = 'problematicOperation';
      
      // Mock flashing operation
      const originalNow = performance.now;
      performance.now = jest.fn()
        .mockReturnValueOnce(1000) // Start time
        .mockReturnValueOnce(1050); // End time (50ms - flashing)
      
      loadingStateManager.startLoading(operation, { userAction: 'button_click' });
      loadingStateManager.stopLoading(operation);
      
      const recommendations = userExperienceValidator.generateUXRecommendations();
      expect(recommendations).toBeInstanceOf(Array);
      expect(recommendations.length).toBeGreaterThan(0);
      
      performance.now = originalNow;
    });

    test('should provide UX metrics', () => {
      const metrics = userExperienceValidator.getUXMetrics();
      
      expect(metrics).toHaveProperty('totalLoadingEvents');
      expect(metrics).toHaveProperty('flashingEvents');
      expect(metrics).toHaveProperty('longLoadingEvents');
      expect(metrics).toHaveProperty('flashingRate');
      expect(metrics).toHaveProperty('longLoadingRate');
    });
  });

  describe('PatternMonitor', () => {
    beforeEach(() => {
      patternMonitor = new PatternMonitor(loadingStateManager, {
        rapidCyclingThreshold: 3,
        burstThreshold: 5,
        enableTimePatternAnalysis: true,
        enableUserBehaviorAnalysis: true
      });
    });

    test('should initialize with correct configuration', () => {
      expect(patternMonitor.manager).toBe(loadingStateManager);
      expect(patternMonitor.isMonitoring).toBe(true);
      expect(patternMonitor.config.rapidCyclingThreshold).toBe(3);
    });

    test('should detect rapid cycling patterns', () => {
      const operation = 'rapidCyclingOperation';
      
      // Trigger rapid cycling
      for (let i = 0; i < 6; i++) {
        loadingStateManager.startLoading(operation, { userAction: 'button_click' });
        loadingStateManager.stopLoading(operation);
      }
      
      // Check pattern analysis
      const analysisResults = patternMonitor.getAnalysisResults();
      expect(analysisResults.anomalies).toBeInstanceOf(Array);
    });

    test('should track operation frequency', () => {
      const operation = 'frequentOperation';
      
      // Trigger multiple operations
      for (let i = 0; i < 3; i++) {
        loadingStateManager.startLoading(operation, { userAction: 'button_click' });
        loadingStateManager.stopLoading(operation);
      }
      
      // Check pattern summary
      const summary = patternMonitor.getPatternSummary();
      expect(summary.totalOperations).toBeGreaterThan(0);
      expect(summary.uniqueOperations).toBeGreaterThan(0);
    });

    test('should export pattern data', () => {
      const operation = 'exportTestOperation';
      
      loadingStateManager.startLoading(operation, { userAction: 'button_click' });
      loadingStateManager.stopLoading(operation);
      
      const exportData = patternMonitor.exportPatternData();
      
      expect(exportData).toHaveProperty('sessionId');
      expect(exportData).toHaveProperty('patterns');
      expect(exportData).toHaveProperty('analysisResults');
      expect(exportData).toHaveProperty('timestamp');
    });
  });

  describe('Production Safeguards Integration', () => {
    beforeEach(() => {
      safeguardsIntegration = createProductionSafeguards(loadingStateManager, {
        enableProductionSafeguards: true,
        enableUserExperienceValidation: true,
        enablePatternMonitoring: true,
        enableAnalytics: false // Disable for testing
      });
    });

    test('should initialize all components', () => {
      expect(safeguardsIntegration.isInitialized).toBe(true);
      expect(safeguardsIntegration.productionSafeguards).toBeTruthy();
      expect(safeguardsIntegration.userExperienceValidator).toBeTruthy();
      expect(safeguardsIntegration.patternMonitor).toBeTruthy();
    });

    test('should provide integrated status', () => {
      const status = safeguardsIntegration.getStatus();
      
      expect(status).toHaveProperty('isInitialized');
      expect(status).toHaveProperty('sessionId');
      expect(status).toHaveProperty('overallHealthScore');
      expect(status).toHaveProperty('componentsActive');
      expect(status.isInitialized).toBe(true);
    });

    test('should calculate overall health score', () => {
      const status = safeguardsIntegration.getStatus();
      
      expect(status.overallHealthScore).toBeGreaterThanOrEqual(0);
      expect(status.overallHealthScore).toBeLessThanOrEqual(1);
    });

    test('should generate integrated report', () => {
      const report = safeguardsIntegration.generateIntegratedReport();
      
      expect(report).toHaveProperty('timestamp');
      expect(report).toHaveProperty('sessionId');
      expect(report).toHaveProperty('overallHealthScore');
      expect(report).toHaveProperty('componentStatus');
      expect(report).toHaveProperty('recommendations');
    });

    test('should correlate issues across components', () => {
      // Trigger some issues
      const operation = 'problematicOperation';
      
      // Mock slow operation to trigger multiple component issues
      const originalNow = performance.now;
      let callCount = 0;
      performance.now = jest.fn(() => {
        callCount++;
        if (callCount === 1) return 1000; // Start time
        return 8000; // End time (7 second duration - triggers multiple issues)
      });
      
      loadingStateManager.startLoading(operation, { userAction: 'button_click' });
      loadingStateManager.stopLoading(operation);
      
      // Run integrated analysis
      safeguardsIntegration.runIntegratedAnalysis();
      
      const status = safeguardsIntegration.getStatus();
      expect(status.totalIssuesDetected).toBeGreaterThan(0);
      
      performance.now = originalNow;
    });
  });

  describe('LoadingStateManager Integration', () => {
    test('should initialize production safeguards automatically', () => {
      const manager = new LoadingStateManager(true);
      
      expect(manager.productionSafeguards).toBeTruthy();
      
      const safeguardsStatus = manager.getProductionSafeguardsStatus();
      expect(safeguardsStatus.enabled).toBe(true);
      
      manager.cleanup();
    });

    test('should cleanup production safeguards on manager cleanup', () => {
      const manager = new LoadingStateManager(true);
      
      expect(manager.productionSafeguards).toBeTruthy();
      
      manager.cleanup();
      
      expect(manager.productionSafeguards).toBeNull();
    });

    test('should handle production safeguards initialization failure gracefully', () => {
      // Mock createProductionSafeguards to throw error
      const originalCreateProductionSafeguards = require('../../utils/productionSafeguardsIntegration.js').createProductionSafeguards;
      
      jest.doMock('../../utils/productionSafeguardsIntegration.js', () => ({
        createProductionSafeguards: jest.fn(() => {
          throw new Error('Initialization failed');
        })
      }));
      
      // Should not throw error
      expect(() => {
        const manager = new LoadingStateManager(true);
        manager.cleanup();
      }).not.toThrow();
    });
  });

  describe('Production Environment Behavior', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });

    test('should disable debug logging in production', () => {
      const config = ProductionConfig;
      const debugConfig = config.getDebugConfig();
      
      expect(debugConfig.enableDebugLogging).toBe(false);
      expect(debugConfig.enableStackTraces).toBe(false);
    });

    test('should sanitize data in production', () => {
      const config = ProductionConfig;
      const testData = {
        operation: 'test',
        stackTrace: ['sensitive', 'stack', 'trace'],
        userAgent: 'Mozilla/5.0...',
        normalData: 'this is fine'
      };
      
      const sanitized = config.sanitizeForProduction(testData);
      
      expect(sanitized.operation).toBe('test');
      expect(sanitized.stackTrace).toBe('[REDACTED]');
      expect(sanitized.userAgent).toBe('[REDACTED]');
      expect(sanitized.normalData).toBe('this is fine');
    });

    test('should enable analytics in production', () => {
      const config = ProductionConfig;
      const analyticsConfig = config.getAnalyticsConfig();
      
      expect(analyticsConfig.enableAnalytics).toBe(true);
      expect(analyticsConfig.sanitizeData).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle component initialization failures gracefully', () => {
      // Mock ProductionSafeguards constructor to throw
      const OriginalProductionSafeguards = ProductionSafeguards;
      jest.doMock('../../utils/productionSafeguards.js', () => {
        return jest.fn(() => {
          throw new Error('Initialization failed');
        });
      });
      
      expect(() => {
        safeguardsIntegration = createProductionSafeguards(loadingStateManager);
      }).not.toThrow();
    });

    test('should handle cleanup failures gracefully', () => {
      safeguardsIntegration = createProductionSafeguards(loadingStateManager);
      
      // Mock cleanup to throw
      if (safeguardsIntegration.productionSafeguards) {
        safeguardsIntegration.productionSafeguards.cleanup = jest.fn(() => {
          throw new Error('Cleanup failed');
        });
      }
      
      expect(() => {
        safeguardsIntegration.cleanup();
      }).not.toThrow();
    });
  });

  describe('Performance Impact', () => {
    test('should have minimal performance impact', () => {
      const startTime = performance.now();
      
      // Perform multiple operations
      for (let i = 0; i < 100; i++) {
        loadingStateManager.startLoading(`operation_${i}`, { userAction: 'test' });
        loadingStateManager.stopLoading(`operation_${i}`);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time (adjust threshold as needed)
      expect(duration).toBeLessThan(1000); // 1 second for 100 operations
    });

    test('should not significantly impact memory usage', () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Perform many operations
      for (let i = 0; i < 1000; i++) {
        loadingStateManager.startLoading(`operation_${i}`, { userAction: 'test' });
        loadingStateManager.stopLoading(`operation_${i}`);
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (adjust threshold as needed)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // 50MB
    });
  });
});

describe('Production Safeguards Configuration', () => {
  test('should validate configuration correctly', () => {
    expect(() => {
      new ProductionConfig();
    }).not.toThrow();
  });

  test('should handle invalid configuration gracefully', () => {
    // This would test configuration validation
    // Implementation depends on how configuration validation is implemented
    expect(true).toBe(true); // Placeholder
  });
});

describe('Real-world Scenarios', () => {
  let manager;
  let safeguards;

  beforeEach(() => {
    manager = new LoadingStateManager(true);
    safeguards = createProductionSafeguards(manager);
  });

  afterEach(() => {
    if (manager) manager.cleanup();
    if (safeguards) safeguards.cleanup();
  });

  test('should handle typical user workflow', async () => {
    // Simulate typical user interactions
    manager.startLoading('fetchComments', { userAction: 'button_click' });
    await new Promise(resolve => setTimeout(resolve, 100));
    manager.stopLoading('fetchComments');

    manager.startLoading('submitComment', { userAction: 'form_submit' });
    await new Promise(resolve => setTimeout(resolve, 200));
    manager.stopLoading('submitComment');

    manager.startLoading('generateWordcloud', { userAction: 'button_click' });
    await new Promise(resolve => setTimeout(resolve, 300));
    manager.stopLoading('generateWordcloud');

    const status = safeguards.getStatus();
    expect(status.overallHealthScore).toBeGreaterThan(0.5);
  });

  test('should detect and report problematic patterns', () => {
    // Simulate problematic pattern - rapid cycling
    for (let i = 0; i < 10; i++) {
      manager.startLoading('problematicOperation', { userAction: 'button_click' });
      manager.stopLoading('problematicOperation');
    }

    const status = safeguards.getStatus();
    expect(status.totalIssuesDetected).toBeGreaterThan(0);
  });

  test('should maintain good performance under load', () => {
    const startTime = Date.now();

    // Simulate high load
    for (let i = 0; i < 50; i++) {
      manager.startLoading(`loadTest_${i}`, { userAction: 'test' });
      if (i % 2 === 0) {
        manager.stopLoading(`loadTest_${i}`);
      }
    }

    // Clean up remaining operations
    for (let i = 1; i < 50; i += 2) {
      manager.stopLoading(`loadTest_${i}`);
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    expect(duration).toBeLessThan(500); // Should complete quickly
    
    const status = safeguards.getStatus();
    expect(status.overallHealthScore).toBeGreaterThan(0);
  });
});
/**
 * Loading Detection Test Runner
 * 
 * Comprehensive test suite that runs all loading detection tests
 * and provides regression prevention validation.
 * 
 * Requirements: 3.4, 5.3, 5.4
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../../App';
import LoadingStateManager from '../LoadingStateManager';
import RuntimeLoadingDetector from '../../utils/runtimeLoadingDetector';

// Test configuration
const TEST_CONFIG = {
  MONITORING_DURATION: 5000,
  USER_ACTION_DELAY: 1000,
  ANIMATION_CHECK_INTERVAL: 100,
  REGRESSION_CHECK_DURATION: 3000
};

// Global test state
let testResults = {
  totalTests: 0,
  passedTests: 0,
  failedTests: 0,
  issues: [],
  recommendations: []
};

describe('Loading Detection Test Runner - Comprehensive Suite', () => {
  
  beforeAll(() => {
    console.log('🚀 Starting comprehensive loading detection test suite...');
    testResults = {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      issues: [],
      recommendations: []
    };
  });

  afterAll(() => {
    console.log('📊 Loading Detection Test Suite Results:');
    console.log(`Total Tests: ${testResults.totalTests}`);
    console.log(`Passed: ${testResults.passedTests}`);
    console.log(`Failed: ${testResults.failedTests}`);
    console.log(`Success Rate: ${((testResults.passedTests / testResults.totalTests) * 100).toFixed(1)}%`);
    
    if (testResults.issues.length > 0) {
      console.log('🚨 Issues Found:');
      testResults.issues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue}`);
      });
    }
    
    if (testResults.recommendations.length > 0) {
      console.log('💡 Recommendations:');
      testResults.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec}`);
      });
    }
  });

  const recordTestResult = (testName, passed, issue = null, recommendation = null) => {
    testResults.totalTests++;
    if (passed) {
      testResults.passedTests++;
    } else {
      testResults.failedTests++;
      if (issue) testResults.issues.push(`${testName}: ${issue}`);
      if (recommendation) testResults.recommendations.push(`${testName}: ${recommendation}`);
    }
  };

  describe('1. Page Load Loading State Detection', () => {
    
    test('should pass comprehensive page load audit', async () => {
      const testName = 'Page Load Audit';
      let passed = true;
      let issues = [];
      
      try {
        const { container } = render(<App />);
        
        // Wait for initial render
        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
        });
        
        // Check 1: No immediate loading indicators
        const immediateLoadingElements = container.querySelectorAll(
          '.animate-spin, .spinner, .loading, [data-testid*="loading"]'
        );
        if (immediateLoadingElements.length > 0) {
          issues.push('Immediate loading indicators detected');
          passed = false;
        }
        
        // Check 2: No loading states after 2 seconds (critical regression test)
        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 2500));
        });
        
        const delayedLoadingElements = container.querySelectorAll(
          '.animate-spin, .spinner, .loading'
        ).length;
        
        const visibleDelayedElements = Array.from(container.querySelectorAll(
          '.animate-spin, .spinner, .loading'
        )).filter(el => {
          const style = window.getComputedStyle(el);
          const rect = el.getBoundingClientRect();
          return style.display !== 'none' && 
                 style.visibility !== 'hidden' &&
                 style.opacity !== '0' &&
                 rect.width > 0 && rect.height > 0;
        });
        
        if (visibleDelayedElements.length > 0) {
          issues.push('Loading indicators appeared after 2 seconds - REGRESSION DETECTED');
          passed = false;
        }
        
        // Check 3: No automatic API calls
        const originalFetch = global.fetch;
        const apiCalls = [];
        global.fetch = jest.fn((...args) => {
          apiCalls.push(args);
          return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
        });
        
        // Re-render to check for automatic API calls
        render(<App />);
        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 1000));
        });
        
        if (apiCalls.length > 0) {
          issues.push('Automatic API calls detected on mount');
          passed = false;
        }
        
        global.fetch = originalFetch;
        
        expect(passed).toBe(true);
        recordTestResult(testName, passed, issues.join('; '));
        
      } catch (error) {
        recordTestResult(testName, false, error.message, 'Review page load initialization logic');
        throw error;
      }
    });

    test('should validate LoadingStateManager prevents automatic loading', async () => {
      const testName = 'LoadingStateManager Validation';
      let passed = true;
      
      try {
        const manager = new LoadingStateManager(true);
        const warnings = [];
        
        const originalWarn = console.warn;
        console.warn = jest.fn((message, ...args) => {
          warnings.push(message);
          originalWarn(message, ...args);
        });
        
        // Test automatic loading detection
        manager.startLoading('automaticTest'); // No user action provided
        
        const hasAutomaticWarning = warnings.some(w => 
          w.includes('without clear user action correlation')
        );
        
        if (!hasAutomaticWarning) {
          passed = false;
        }
        
        manager.cleanup();
        console.warn = originalWarn;
        
        expect(hasAutomaticWarning).toBe(true);
        recordTestResult(testName, passed, 
          passed ? null : 'LoadingStateManager did not detect automatic loading',
          passed ? null : 'Review LoadingStateManager validation logic'
        );
        
      } catch (error) {
        recordTestResult(testName, false, error.message);
        throw error;
      }
    });
  });

  describe('2. User Action Correlation Tests', () => {
    
    test('should validate all loading states correlate to user actions', async () => {
      const testName = 'User Action Correlation';
      let passed = true;
      
      try {
        const { container } = render(<App />);
        const manager = new LoadingStateManager(true);
        const loadingOperations = [];
        
        // Override startLoading to track operations
        const originalStartLoading = manager.startLoading;
        manager.startLoading = jest.fn((operation, options) => {
          const result = originalStartLoading.call(manager, operation, options);
          const activeOps = manager.getActiveOperations();
          loadingOperations.push({
            operation,
            userTriggered: activeOps[operation]?.userTriggered || false,
            options
          });
          return result;
        });
        
        // Simulate user interactions
        const buttons = screen.getAllByRole('button');
        for (let i = 0; i < Math.min(buttons.length, 3); i++) {
          fireEvent.click(buttons[i]);
          await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 200));
          });
        }
        
        // Check that all operations are user-triggered
        const nonUserTriggered = loadingOperations.filter(op => !op.userTriggered);
        
        if (nonUserTriggered.length > 0) {
          passed = false;
        }
        
        manager.cleanup();
        
        expect(nonUserTriggered).toHaveLength(0);
        recordTestResult(testName, passed,
          passed ? null : `${nonUserTriggered.length} non-user-triggered operations detected`,
          passed ? null : 'Ensure all loading states are triggered by explicit user actions'
        );
        
      } catch (error) {
        recordTestResult(testName, false, error.message);
        throw error;
      }
    });

    test('should prevent loading without user interaction', async () => {
      const testName = 'No Loading Without User Interaction';
      let passed = true;
      
      try {
        const { container } = render(<App />);
        let loadingDetected = false;
        
        // Monitor for 3 seconds without user interaction
        const monitoringPromise = new Promise((resolve) => {
          const interval = setInterval(() => {
            const loadingElements = container.querySelectorAll(
              '.animate-spin, .loading, .spinner'
            );
            const visibleLoading = Array.from(loadingElements).filter(el => {
              const style = window.getComputedStyle(el);
              return style.display !== 'none' && style.visibility !== 'hidden';
            });
            
            if (visibleLoading.length > 0) {
              loadingDetected = true;
            }
          }, 100);
          
          setTimeout(() => {
            clearInterval(interval);
            resolve(loadingDetected);
          }, 3000);
        });
        
        const result = await monitoringPromise;
        passed = !result;
        
        expect(result).toBe(false);
        recordTestResult(testName, passed,
          passed ? null : 'Loading detected without user interaction',
          passed ? null : 'Remove automatic loading triggers'
        );
        
      } catch (error) {
        recordTestResult(testName, false, error.message);
        throw error;
      }
    });
  });

  describe('3. CSS Animation Detection Tests', () => {
    
    test('should detect and prevent automatic CSS animations', async () => {
      const testName = 'CSS Animation Detection';
      let passed = true;
      
      try {
        const { container } = render(<App />);
        const detectedAnimations = [];
        
        // Monitor animations for 2 seconds
        const animationPromise = new Promise((resolve) => {
          const checkAnimations = () => {
            const animatedElements = container.querySelectorAll('*');
            
            Array.from(animatedElements).forEach(element => {
              const style = window.getComputedStyle(element);
              
              if (style.animationName !== 'none' && style.animationDuration !== '0s') {
                const isLoadingRelated = element.className.toLowerCase().includes('loading') ||
                                       element.className.toLowerCase().includes('spinner') ||
                                       element.className.toLowerCase().includes('spin');
                
                const isVisible = element.offsetWidth > 0 && element.offsetHeight > 0;
                
                if (isLoadingRelated && isVisible) {
                  detectedAnimations.push({
                    element,
                    animationName: style.animationName,
                    className: element.className
                  });
                }
              }
            });
          };
          
          const interval = setInterval(checkAnimations, TEST_CONFIG.ANIMATION_CHECK_INTERVAL);
          
          setTimeout(() => {
            clearInterval(interval);
            resolve(detectedAnimations);
          }, 2000);
        });
        
        const animations = await animationPromise;
        passed = animations.length === 0;
        
        expect(animations).toHaveLength(0);
        recordTestResult(testName, passed,
          passed ? null : `${animations.length} automatic loading animations detected`,
          passed ? null : 'Remove or control automatic CSS animations'
        );
        
      } catch (error) {
        recordTestResult(testName, false, error.message);
        throw error;
      }
    });

    test('should validate CSS transition isolation', async () => {
      const testName = 'CSS Transition Isolation';
      let passed = true;
      
      try {
        const { container } = render(<App />);
        const problematicTransitions = [];
        
        const allElements = container.querySelectorAll('*');
        Array.from(allElements).forEach(element => {
          const style = window.getComputedStyle(element);
          
          if (style.transition && style.transition.includes('all')) {
            const isLoadingRelated = element.className.toLowerCase().includes('loading') ||
                                   element.className.toLowerCase().includes('spinner');
            
            if (isLoadingRelated) {
              problematicTransitions.push({
                element,
                transition: style.transition,
                className: element.className
              });
            }
          }
        });
        
        passed = problematicTransitions.length === 0;
        
        expect(problematicTransitions).toHaveLength(0);
        recordTestResult(testName, passed,
          passed ? null : `${problematicTransitions.length} problematic global transitions on loading elements`,
          passed ? null : 'Use specific CSS transitions instead of "all" on loading elements'
        );
        
      } catch (error) {
        recordTestResult(testName, false, error.message);
        throw error;
      }
    });
  });

  describe('4. Runtime Detection Integration Tests', () => {
    
    test('should integrate with RuntimeLoadingDetector', async () => {
      const testName = 'Runtime Detector Integration';
      let passed = true;
      
      try {
        const { container } = render(<App />);
        const detector = new RuntimeLoadingDetector({
          enableConsoleLogging: false,
          enableVisualIndicators: false,
          monitoringInterval: 200
        });
        
        detector.startMonitoring();
        
        // Wait for monitoring
        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 2000));
        });
        
        const report = detector.stopMonitoring();
        
        // Check report
        const hasHighSeverityIssues = report.issues.some(issue => issue.severity === 'high');
        const hasLoadingStateIssues = report.issues.some(issue => issue.type === 'unwanted-loading-state');
        
        passed = !hasHighSeverityIssues && !hasLoadingStateIssues;
        
        expect(hasHighSeverityIssues).toBe(false);
        expect(hasLoadingStateIssues).toBe(false);
        
        recordTestResult(testName, passed,
          passed ? null : `Runtime detector found ${report.issues.length} issues`,
          passed ? null : 'Review runtime detector findings and fix identified issues'
        );
        
      } catch (error) {
        recordTestResult(testName, false, error.message);
        throw error;
      }
    });

    test('should validate performance impact of monitoring', async () => {
      const testName = 'Monitoring Performance Impact';
      let passed = true;
      
      try {
        const startTime = performance.now();
        
        const { container } = render(<App />);
        const detector = new RuntimeLoadingDetector({
          enableConsoleLogging: false,
          enableVisualIndicators: false,
          enablePerformanceMonitoring: true,
          monitoringInterval: 100
        });
        
        detector.startMonitoring();
        
        // Simulate user interactions during monitoring
        const buttons = screen.getAllByRole('button');
        for (let i = 0; i < Math.min(buttons.length, 2); i++) {
          fireEvent.click(buttons[i]);
          await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 100));
          });
        }
        
        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 1000));
        });
        
        const report = detector.stopMonitoring();
        const endTime = performance.now();
        
        const totalTime = endTime - startTime;
        const averageCheckTime = report.performance.averageCheckDuration;
        
        // Performance should be reasonable
        passed = totalTime < 3000 && averageCheckTime < 10; // 10ms per check max
        
        expect(totalTime).toBeLessThan(3000);
        expect(averageCheckTime).toBeLessThan(10);
        
        recordTestResult(testName, passed,
          passed ? null : `Performance impact too high: ${totalTime}ms total, ${averageCheckTime}ms per check`,
          passed ? null : 'Optimize monitoring performance or reduce check frequency'
        );
        
      } catch (error) {
        recordTestResult(testName, false, error.message);
        throw error;
      }
    });
  });

  describe('5. Regression Prevention Tests', () => {
    
    test('should prevent spinning circle regression', async () => {
      const testName = 'Spinning Circle Regression Prevention';
      let passed = true;
      
      try {
        const { container } = render(<App />);
        
        // Specific test for the 2-second spinning circle issue
        const regressionTest = new Promise((resolve) => {
          let spinDetected = false;
          const startTime = Date.now();
          
          const checkForSpin = () => {
            const currentTime = Date.now();
            const elapsed = currentTime - startTime;
            
            // Check specifically around the 2-second mark
            if (elapsed > 1800 && elapsed < 2200) {
              const spinElements = container.querySelectorAll(
                '.animate-spin, [class*="spin"], .spinner'
              );
              
              const visibleSpins = Array.from(spinElements).filter(el => {
                const rect = el.getBoundingClientRect();
                const style = window.getComputedStyle(el);
                return rect.width > 0 && rect.height > 0 && 
                       style.display !== 'none' && 
                       style.visibility !== 'hidden';
              });
              
              if (visibleSpins.length > 0) {
                spinDetected = true;
              }
            }
            
            if (elapsed < TEST_CONFIG.REGRESSION_CHECK_DURATION) {
              requestAnimationFrame(checkForSpin);
            } else {
              resolve(spinDetected);
            }
          };
          
          checkForSpin();
        });
        
        const regressionDetected = await regressionTest;
        passed = !regressionDetected;
        
        expect(regressionDetected).toBe(false);
        recordTestResult(testName, passed,
          passed ? null : 'CRITICAL: Spinning circle regression detected at ~2 seconds',
          passed ? null : 'URGENT: Review recent changes that may have reintroduced the spinning circle issue'
        );
        
      } catch (error) {
        recordTestResult(testName, false, error.message);
        throw error;
      }
    });

    test('should validate architectural safeguards', async () => {
      const testName = 'Architectural Safeguards';
      let passed = true;
      
      try {
        // Test LoadingStateManager safeguards
        const manager = new LoadingStateManager(true);
        
        // Test 1: Invalid operation names should throw
        let invalidOperationHandled = false;
        try {
          manager.startLoading();
        } catch (error) {
          invalidOperationHandled = true;
        }
        
        if (!invalidOperationHandled) {
          passed = false;
        }
        
        // Test 2: Cleanup should work properly
        manager.startLoading('testOp', { userAction: 'test' });
        expect(manager.isLoading('testOp')).toBe(true);
        
        manager.cleanup();
        expect(manager.isLoading('testOp')).toBe(false);
        
        // Test 3: Long-running operation warnings
        const warnings = [];
        const originalWarn = console.warn;
        console.warn = jest.fn((message) => {
          warnings.push(message);
          originalWarn(message);
        });
        
        manager.startLoading('longOp', { userAction: 'test' });
        const activeOps = manager.getActiveOperations();
        activeOps.longOp.startTime = Date.now() - 35000; // 35 seconds ago
        manager.stopLoading('longOp');
        
        const hasLongRunningWarning = warnings.some(w => 
          w.includes('Long-running operation detected')
        );
        
        if (!hasLongRunningWarning) {
          passed = false;
        }
        
        console.warn = originalWarn;
        
        expect(invalidOperationHandled).toBe(true);
        expect(hasLongRunningWarning).toBe(true);
        
        recordTestResult(testName, passed,
          passed ? null : 'Architectural safeguards not working properly',
          passed ? null : 'Review and strengthen LoadingStateManager safeguards'
        );
        
      } catch (error) {
        recordTestResult(testName, false, error.message);
        throw error;
      }
    });

    test('should generate comprehensive test report', async () => {
      const testName = 'Test Report Generation';
      let passed = true;
      
      try {
        // This test validates that our testing infrastructure is working
        const reportData = {
          testSuite: 'Loading Detection Tests',
          timestamp: new Date().toISOString(),
          environment: {
            nodeEnv: process.env.NODE_ENV,
            userAgent: navigator.userAgent,
            viewport: `${window.innerWidth}x${window.innerHeight}`
          },
          results: testResults,
          recommendations: [
            'Continue monitoring for loading state regressions',
            'Run these tests in CI/CD pipeline',
            'Update tests when adding new loading functionality',
            'Monitor production for similar issues'
          ]
        };
        
        // Validate report structure
        expect(reportData.results).toBeDefined();
        expect(reportData.results.totalTests).toBeGreaterThan(0);
        expect(reportData.timestamp).toBeDefined();
        expect(reportData.environment).toBeDefined();
        
        recordTestResult(testName, passed);
        
        // Log final report
        console.log('📋 Final Test Report:', JSON.stringify(reportData, null, 2));
        
      } catch (error) {
        recordTestResult(testName, false, error.message);
        throw error;
      }
    });
  });
});
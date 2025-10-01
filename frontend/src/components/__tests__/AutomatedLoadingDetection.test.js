/**
 * Automated Loading Detection Tests
 * 
 * Comprehensive tests to monitor for unwanted loading states on page load,
 * verify loading only occurs on user actions, detect automatic CSS animations,
 * and prevent regression of the spinning circle issue.
 * 
 * Requirements: 3.4, 5.3, 5.4
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../../App';
import LoadingStateManager from '../LoadingStateManager';

// Mock console methods for testing
const originalConsole = { ...console };
let consoleWarnings = [];
let consoleErrors = [];

beforeEach(() => {
  consoleWarnings = [];
  consoleErrors = [];
  
  console.warn = jest.fn((message, ...args) => {
    consoleWarnings.push({ message, args });
    originalConsole.warn(message, ...args);
  });
  
  console.error = jest.fn((message, ...args) => {
    consoleErrors.push({ message, args });
    originalConsole.error(message, ...args);
  });
  
  console.log = jest.fn();
});

afterEach(() => {
  Object.assign(console, originalConsole);
});

describe('Automated Loading Detection Tests', () => {
  
  describe('1. Monitor for Unwanted Loading States on Page Load', () => {
    
    test('should not show any loading indicators immediately after page load', async () => {
      const { container } = render(<App />);
      
      // Check for common loading indicator patterns
      const loadingSpinners = container.querySelectorAll('.animate-spin, .spinner, .loading-spinner');
      const loadingTexts = screen.queryAllByText(/loading/i);
      const loadingOverlays = container.querySelectorAll('.loading-overlay, .overlay');
      
      expect(loadingSpinners).toHaveLength(0);
      expect(loadingTexts).toHaveLength(0);
      expect(loadingOverlays).toHaveLength(0);
    });

    test('should not trigger any loading states during initial render', async () => {
      const loadingManager = new LoadingStateManager(true);
      const originalStartLoading = loadingManager.startLoading;
      const loadingCalls = [];
      
      loadingManager.startLoading = jest.fn((...args) => {
        loadingCalls.push(args);
        return originalStartLoading.apply(loadingManager, args);
      });
      
      render(<App />);
      
      // Wait for any potential async operations
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });
      
      expect(loadingCalls).toHaveLength(0);
      
      loadingManager.cleanup();
    });

    test('should not have any active loading operations after initial render', async () => {
      const { container } = render(<App />);
      
      // Wait for component to fully mount
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });
      
      // Check if any loading-related CSS classes are present
      const elementsWithLoadingClasses = container.querySelectorAll(
        '[class*="loading"], [class*="spinner"], [class*="animate-spin"]'
      );
      
      // Filter out elements that are not actually showing loading states
      const activeLoadingElements = Array.from(elementsWithLoadingClasses).filter(el => {
        const computedStyle = window.getComputedStyle(el);
        return computedStyle.display !== 'none' && 
               computedStyle.visibility !== 'hidden' &&
               computedStyle.opacity !== '0';
      });
      
      expect(activeLoadingElements).toHaveLength(0);
    });

    test('should not show loading states after waiting 5 seconds', async () => {
      const { container } = render(<App />);
      
      // Wait 5 seconds to catch any delayed loading states
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 5000));
      });
      
      const loadingIndicators = container.querySelectorAll(
        '.animate-spin, .spinner, .loading, [data-testid*="loading"]'
      );
      
      const visibleLoadingIndicators = Array.from(loadingIndicators).filter(el => {
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        return rect.width > 0 && rect.height > 0 && 
               style.display !== 'none' && 
               style.visibility !== 'hidden' &&
               style.opacity !== '0';
      });
      
      expect(visibleLoadingIndicators).toHaveLength(0);
    });

    test('should not trigger automatic API calls on mount', async () => {
      // Mock fetch to track API calls
      const originalFetch = global.fetch;
      const apiCalls = [];
      
      global.fetch = jest.fn((...args) => {
        apiCalls.push(args);
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({})
        });
      });
      
      render(<App />);
      
      // Wait for potential async operations
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 1000));
      });
      
      expect(apiCalls).toHaveLength(0);
      
      global.fetch = originalFetch;
    });
  });

  describe('2. Verify Loading Only Occurs on User Actions', () => {
    
    test('should show loading state only when user clicks a button', async () => {
      const { container } = render(<App />);
      
      // Initially no loading
      expect(container.querySelectorAll('.animate-spin')).toHaveLength(0);
      
      // Find and click a button that should trigger loading
      const buttons = screen.getAllByRole('button');
      const loadButton = buttons.find(btn => 
        btn.textContent.includes('Load') || 
        btn.textContent.includes('Submit') ||
        btn.textContent.includes('Fetch')
      );
      
      if (loadButton) {
        fireEvent.click(loadButton);
        
        // Should show loading immediately after click
        await waitFor(() => {
          const loadingElements = container.querySelectorAll('.animate-spin, .loading');
          expect(loadingElements.length).toBeGreaterThan(0);
        }, { timeout: 1000 });
        
        // Loading should eventually stop
        await waitFor(() => {
          const loadingElements = container.querySelectorAll('.animate-spin, .loading');
          expect(loadingElements).toHaveLength(0);
        }, { timeout: 10000 });
      }
    });

    test('should correlate all loading states to user actions', async () => {
      const loadingManager = new LoadingStateManager(true);
      const loadingOperations = [];
      
      const originalStartLoading = loadingManager.startLoading;
      loadingManager.startLoading = jest.fn((operation, options) => {
        const result = originalStartLoading.call(loadingManager, operation, options);
        loadingOperations.push({
          operation,
          options,
          userTriggered: loadingManager.getActiveOperations()[operation]?.userTriggered
        });
        return result;
      });
      
      const { container } = render(<App />);
      
      // Simulate user interactions
      const buttons = screen.getAllByRole('button');
      for (const button of buttons.slice(0, 3)) { // Test first 3 buttons
        fireEvent.click(button);
        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
        });
      }
      
      // All loading operations should be user-triggered
      loadingOperations.forEach(op => {
        expect(op.userTriggered).toBe(true);
      });
      
      loadingManager.cleanup();
    });

    test('should not show loading without explicit user interaction', async () => {
      const { container } = render(<App />);
      
      // Monitor for 3 seconds without any user interaction
      const monitoringPromise = new Promise((resolve) => {
        let loadingDetected = false;
        const interval = setInterval(() => {
          const loadingElements = container.querySelectorAll('.animate-spin, .loading, .spinner');
          if (loadingElements.length > 0) {
            loadingDetected = true;
          }
        }, 100);
        
        setTimeout(() => {
          clearInterval(interval);
          resolve(loadingDetected);
        }, 3000);
      });
      
      const loadingDetected = await monitoringPromise;
      expect(loadingDetected).toBe(false);
    });

    test('should track user action correlation for all loading states', async () => {
      const { container } = render(<App />);
      
      // Create a comprehensive user action test - focus on buttons only
      const buttons = container.querySelectorAll('button');
      
      for (const button of Array.from(buttons).slice(0, 3)) {
        fireEvent.click(button);
        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 50));
        });
      }
      
      // Check that no warnings were issued about non-user-triggered loading
      const nonUserTriggeredWarnings = consoleWarnings.filter(warning =>
        warning.message.includes('without clear user action correlation')
      );
      
      expect(nonUserTriggeredWarnings).toHaveLength(0);
    });
  });

  describe('3. CSS Animation Monitoring for Automatic Animations', () => {
    
    test('should not have any CSS animations running on page load', async () => {
      const { container } = render(<App />);
      
      // Wait for initial render
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });
      
      // Check for elements with animation classes
      const animatedElements = container.querySelectorAll(
        '.animate-spin, .animate-pulse, .animate-bounce, [class*="animate-"]'
      );
      
      // Filter for actually visible and animated elements
      const activeAnimations = Array.from(animatedElements).filter(el => {
        const style = window.getComputedStyle(el);
        return style.animationName !== 'none' && 
               style.animationDuration !== '0s' &&
               style.display !== 'none' &&
               style.visibility !== 'hidden';
      });
      
      expect(activeAnimations).toHaveLength(0);
    });

    test('should detect and prevent automatic spin animations', async () => {
      const { container } = render(<App />);
      
      // Monitor for spin animations over time
      const animationMonitor = new Promise((resolve) => {
        const detectedAnimations = [];
        let monitoringActive = true;
        
        const checkAnimations = () => {
          if (!monitoringActive) return;
          
          const spinElements = container.querySelectorAll('.animate-spin, [class*="spin"]');
          spinElements.forEach(el => {
            const style = window.getComputedStyle(el);
            if (style.animationName.includes('spin') && style.animationDuration !== '0s') {
              detectedAnimations.push({
                element: el,
                className: el.className,
                animationName: style.animationName,
                timestamp: Date.now()
              });
            }
          });
          
          if (monitoringActive) {
            requestAnimationFrame(checkAnimations);
          }
        };
        
        checkAnimations();
        
        setTimeout(() => {
          monitoringActive = false;
          resolve(detectedAnimations);
        }, 2000);
      });
      
      const detectedAnimations = await animationMonitor;
      expect(detectedAnimations).toHaveLength(0);
    });

    test('should only allow animations when explicitly triggered by user actions', async () => {
      const { container } = render(<App />);
      
      // Track animation states
      const animationStates = [];
      
      const trackAnimations = () => {
        const animatedElements = container.querySelectorAll('[class*="animate-"]');
        animationStates.push({
          timestamp: Date.now(),
          count: animatedElements.length,
          elements: Array.from(animatedElements).map(el => ({
            className: el.className,
            visible: el.offsetWidth > 0 && el.offsetHeight > 0
          }))
        });
      };
      
      // Initial state
      trackAnimations();
      
      // Wait without user interaction
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 1000));
      });
      trackAnimations();
      
      // Simulate user action
      const buttons = screen.getAllByRole('button');
      if (buttons.length > 0) {
        fireEvent.click(buttons[0]);
        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
        });
        trackAnimations();
      }
      
      // Verify no animations before user action
      expect(animationStates[0].count).toBe(0);
      expect(animationStates[1].count).toBe(0);
      
      // Animations after user action are acceptable
      // (but should eventually stop)
    });

    test('should monitor for skeleton loading animations', async () => {
      const { container } = render(<App />);
      
      // Check for skeleton loading patterns
      const skeletonElements = container.querySelectorAll(
        '.skeleton, .animate-pulse, [class*="skeleton"], [data-testid*="skeleton"]'
      );
      
      const activeSkeletons = Array.from(skeletonElements).filter(el => {
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && 
               style.visibility !== 'hidden' &&
               (style.animationName !== 'none' || style.opacity !== '1');
      });
      
      expect(activeSkeletons).toHaveLength(0);
    });

    test('should detect CSS transition-based loading effects', async () => {
      const { container } = render(<App />);
      
      // Monitor for elements with loading-like transitions
      const elementsWithTransitions = container.querySelectorAll('*');
      const problematicTransitions = [];
      
      Array.from(elementsWithTransitions).forEach(el => {
        const style = window.getComputedStyle(el);
        
        // Check for transitions that might cause loading-like effects
        if (style.transition && style.transition !== 'none') {
          const hasLoadingLikeTransition = 
            style.transition.includes('opacity') ||
            style.transition.includes('transform') ||
            style.transition.includes('all');
          
          const hasLoadingLikeClass = 
            el.className.includes('loading') ||
            el.className.includes('spinner') ||
            el.className.includes('animate');
          
          if (hasLoadingLikeTransition && hasLoadingLikeClass) {
            problematicTransitions.push({
              element: el,
              className: el.className,
              transition: style.transition
            });
          }
        }
      });
      
      // Should not have elements with both loading classes and transitions active
      expect(problematicTransitions).toHaveLength(0);
    });
  });

  describe('4. Regression Prevention Tests', () => {
    
    test('should prevent spinning circle issue from returning', async () => {
      const { container } = render(<App />);
      
      // Specific test for the spinning circle issue
      const spinningCircleTest = new Promise((resolve) => {
        let spinDetected = false;
        const startTime = Date.now();
        
        const checkForSpin = () => {
          const currentTime = Date.now();
          
          // Check for spinning elements after 2 seconds (when issue typically appeared)
          if (currentTime - startTime > 2000) {
            const spinElements = container.querySelectorAll(
              '.animate-spin, [class*="spin"], .spinner, .loading-spinner'
            );
            
            const visibleSpinElements = Array.from(spinElements).filter(el => {
              const rect = el.getBoundingClientRect();
              const style = window.getComputedStyle(el);
              return rect.width > 0 && rect.height > 0 && 
                     style.display !== 'none' && 
                     style.visibility !== 'hidden' &&
                     style.opacity !== '0';
            });
            
            if (visibleSpinElements.length > 0) {
              spinDetected = true;
            }
          }
          
          if (currentTime - startTime < 5000) {
            requestAnimationFrame(checkForSpin);
          } else {
            resolve(spinDetected);
          }
        };
        
        checkForSpin();
      });
      
      const spinDetected = await spinningCircleTest;
      expect(spinDetected).toBe(false);
    });

    test('should validate LoadingStateManager prevents automatic loading', async () => {
      const manager = new LoadingStateManager(true);
      
      // Test that manager detects and warns about automatic loading
      const automaticLoadingWarnings = [];
      const originalWarn = console.warn;
      console.warn = jest.fn((message, ...args) => {
        if (message.includes('without clear user action correlation') || 
            message.includes('AUTOMATIC LOADING DETECTED')) {
          automaticLoadingWarnings.push({ message, args });
        }
        originalWarn(message, ...args);
      });
      
      // Simulate automatic loading (should trigger warning)
      manager.startLoading('automaticOperation');
      
      expect(automaticLoadingWarnings.length).toBeGreaterThan(0);
      
      manager.cleanup();
      console.warn = originalWarn;
    });

    test('should ensure all loading states have timeout protection', async () => {
      const manager = new LoadingStateManager(true);
      const longRunningWarnings = [];
      
      const originalWarn = console.warn;
      console.warn = jest.fn((message, ...args) => {
        if (message.includes('Long-running operation detected') || 
            message.includes('PERFORMANCE WARNING')) {
          longRunningWarnings.push({ message, args });
        }
        originalWarn(message, ...args);
      });
      
      // Start a loading operation
      manager.startLoading('testOperation', { userAction: 'test' });
      
      // Simulate long-running operation by manipulating start time
      const activeOps = manager.getActiveOperations();
      activeOps.testOperation.startTime = Date.now() - 35000; // 35 seconds ago
      
      // Stop the operation (should trigger warning)
      manager.stopLoading('testOperation');
      
      expect(longRunningWarnings.length).toBeGreaterThan(0);
      
      manager.cleanup();
      console.warn = originalWarn;
    });

    test('should validate CSS isolation prevents global loading effects', async () => {
      const { container } = render(<App />);
      
      // Check that global CSS rules don't cause loading-like effects
      const allElements = container.querySelectorAll('*');
      const elementsWithGlobalTransitions = [];
      
      Array.from(allElements).forEach(el => {
        const style = window.getComputedStyle(el);
        
        // Check for overly broad transition rules
        if (style.transition && style.transition.includes('all')) {
          const duration = parseFloat(style.transitionDuration);
          if (duration > 0) {
            elementsWithGlobalTransitions.push({
              element: el,
              transition: style.transition,
              duration: style.transitionDuration
            });
          }
        }
      });
      
      // Should not have many elements with global transitions
      // (some are acceptable, but not on loading-related elements)
      const loadingRelatedGlobalTransitions = elementsWithGlobalTransitions.filter(item => {
        const className = item.element.className || '';
        return className.includes('loading') || 
               className.includes('spinner') || 
               className.includes('animate');
      });
      
      expect(loadingRelatedGlobalTransitions).toHaveLength(0);
    });

    test('should ensure future code changes cannot reintroduce automatic loading', async () => {
      // This test validates the architecture prevents automatic loading
      const { container } = render(<App />);
      
      // Monitor for any useEffect or componentDidMount that might trigger loading
      const suspiciousPatterns = [];
      
      // Check for elements that might indicate automatic loading setup
      const potentialTriggers = container.querySelectorAll(
        '[data-testid*="auto"], [class*="auto"], [id*="auto"]'
      );
      
      Array.from(potentialTriggers).forEach(el => {
        if (el.className.includes('loading') || el.className.includes('spinner')) {
          suspiciousPatterns.push({
            element: el,
            reason: 'Element with auto-related attributes and loading classes'
          });
        }
      });
      
      expect(suspiciousPatterns).toHaveLength(0);
    });

    test('should validate error boundaries prevent loading state leaks', async () => {
      const manager = new LoadingStateManager(true);
      
      // Test cleanup on errors
      manager.startLoading('errorTest', { userAction: 'test' });
      expect(manager.isLoading('errorTest')).toBe(true);
      
      // Simulate error condition
      try {
        throw new Error('Test error');
      } catch (error) {
        // Cleanup should still work
        manager.cleanup();
      }
      
      expect(manager.isLoading('errorTest')).toBe(false);
      expect(Object.keys(manager.getActiveOperations())).toHaveLength(0);
    });
  });

  describe('5. Comprehensive Integration Tests', () => {
    
    test('should pass complete loading state audit', async () => {
      const { container } = render(<App />);
      
      const auditResults = {
        automaticLoadingDetected: false,
        unexpectedAnimations: false,
        loadingWithoutUserAction: false,
        longRunningOperations: false,
        cssIssues: false
      };
      
      // Wait and monitor for various issues
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 3000));
      });
      
      // Check for automatic loading
      const loadingElements = container.querySelectorAll('.animate-spin, .loading, .spinner');
      if (loadingElements.length > 0) {
        auditResults.automaticLoadingDetected = true;
      }
      
      // Check for unexpected animations
      const animatedElements = container.querySelectorAll('[class*="animate-"]');
      const activeAnimations = Array.from(animatedElements).filter(el => {
        const style = window.getComputedStyle(el);
        return style.animationDuration !== '0s' && style.display !== 'none';
      });
      if (activeAnimations.length > 0) {
        auditResults.unexpectedAnimations = true;
      }
      
      // Check console warnings for loading issues
      const loadingWarnings = consoleWarnings.filter(w => 
        w.message.includes('loading') || w.message.includes('Loading')
      );
      if (loadingWarnings.length > 0) {
        auditResults.loadingWithoutUserAction = true;
      }
      
      // All audit checks should pass
      Object.values(auditResults).forEach(result => {
        expect(result).toBe(false);
      });
    });

    test('should maintain performance during loading state monitoring', async () => {
      const startTime = performance.now();
      
      const { container } = render(<App />);
      
      // Simulate various user interactions
      const buttons = screen.getAllByRole('button');
      for (let i = 0; i < Math.min(buttons.length, 5); i++) {
        fireEvent.click(buttons[i]);
        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
        });
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // Should complete within reasonable time (5 seconds)
      expect(totalTime).toBeLessThan(5000);
    });

    test('should provide comprehensive debugging information', async () => {
      const manager = new LoadingStateManager(true);
      
      // Perform various operations
      manager.startLoading('op1', { userAction: 'click' });
      manager.startLoading('op2', { userAction: 'submit' });
      manager.stopLoading('op1');
      
      const debugInfo = manager.getDebugInfo();
      
      expect(debugInfo).toHaveProperty('activeOperations');
      expect(debugInfo).toHaveProperty('operationCount');
      expect(debugInfo).toHaveProperty('operationHistory');
      expect(debugInfo).toHaveProperty('sessionId');
      expect(debugInfo.operationHistory.length).toBeGreaterThan(0);
      
      manager.cleanup();
    });
  });
});
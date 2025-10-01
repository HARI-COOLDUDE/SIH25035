/**
 * CSS Animation Monitoring Tests
 * 
 * Specialized tests to detect and prevent automatic CSS animations
 * that could cause unwanted loading visual effects.
 * 
 * Requirements: 3.4, 5.3, 5.4
 */

import React from 'react';
import { render, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../../App';

// Animation monitoring utilities
class CSSAnimationMonitor {
  constructor(container) {
    this.container = container;
    this.detectedAnimations = [];
    this.isMonitoring = false;
    this.animationObserver = null;
  }

  startMonitoring(duration = 5000) {
    return new Promise((resolve) => {
      this.isMonitoring = true;
      this.detectedAnimations = [];
      
      const checkAnimations = () => {
        if (!this.isMonitoring) return;
        
        this.scanForAnimations();
        requestAnimationFrame(checkAnimations);
      };
      
      checkAnimations();
      
      setTimeout(() => {
        this.stopMonitoring();
        resolve(this.detectedAnimations);
      }, duration);
    });
  }

  stopMonitoring() {
    this.isMonitoring = false;
    if (this.animationObserver) {
      this.animationObserver.disconnect();
    }
  }

  scanForAnimations() {
    const timestamp = Date.now();
    const allElements = this.container.querySelectorAll('*');
    
    Array.from(allElements).forEach(element => {
      const computedStyle = window.getComputedStyle(element);
      
      // Check for CSS animations
      if (computedStyle.animationName !== 'none' && computedStyle.animationDuration !== '0s') {
        this.recordAnimation(element, 'css-animation', computedStyle, timestamp);
      }
      
      // Check for CSS transitions that might cause loading-like effects
      if (computedStyle.transition !== 'none' && computedStyle.transitionDuration !== '0s') {
        this.recordAnimation(element, 'css-transition', computedStyle, timestamp);
      }
      
      // Check for transform animations (common in spinners)
      if (computedStyle.transform !== 'none' && computedStyle.transform !== 'matrix(1, 0, 0, 1, 0, 0)') {
        this.recordAnimation(element, 'css-transform', computedStyle, timestamp);
      }
    });
  }

  recordAnimation(element, type, computedStyle, timestamp) {
    const animationInfo = {
      element,
      type,
      timestamp,
      className: element.className,
      id: element.id,
      tagName: element.tagName,
      animationName: computedStyle.animationName,
      animationDuration: computedStyle.animationDuration,
      animationIterationCount: computedStyle.animationIterationCount,
      transition: computedStyle.transition,
      transform: computedStyle.transform,
      isVisible: this.isElementVisible(element),
      isLoadingRelated: this.isLoadingRelated(element),
      boundingRect: element.getBoundingClientRect()
    };
    
    // Only record if not already recorded for this element
    const existingRecord = this.detectedAnimations.find(anim => 
      anim.element === element && anim.type === type
    );
    
    if (!existingRecord) {
      this.detectedAnimations.push(animationInfo);
    }
  }

  isElementVisible(element) {
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    
    return rect.width > 0 && 
           rect.height > 0 && 
           style.display !== 'none' && 
           style.visibility !== 'hidden' &&
           style.opacity !== '0';
  }

  isLoadingRelated(element) {
    const className = element.className.toLowerCase();
    const id = element.id.toLowerCase();
    
    const loadingKeywords = [
      'loading', 'spinner', 'spin', 'rotate', 'pulse', 
      'skeleton', 'shimmer', 'animate', 'loader'
    ];
    
    return loadingKeywords.some(keyword => 
      className.includes(keyword) || id.includes(keyword)
    );
  }

  getLoadingRelatedAnimations() {
    return this.detectedAnimations.filter(anim => anim.isLoadingRelated);
  }

  getVisibleAnimations() {
    return this.detectedAnimations.filter(anim => anim.isVisible);
  }

  getSpinAnimations() {
    return this.detectedAnimations.filter(anim => 
      anim.animationName.includes('spin') || 
      anim.className.includes('spin') ||
      anim.className.includes('rotate')
    );
  }
}

describe('CSS Animation Monitoring Tests', () => {
  let animationMonitor;

  afterEach(() => {
    if (animationMonitor) {
      animationMonitor.stopMonitoring();
    }
  });

  describe('Automatic Animation Detection', () => {
    
    test('should not detect any automatic spin animations on page load', async () => {
      const { container } = render(<App />);
      animationMonitor = new CSSAnimationMonitor(container);
      
      const detectedAnimations = await animationMonitor.startMonitoring(3000);
      const spinAnimations = animationMonitor.getSpinAnimations();
      
      expect(spinAnimations).toHaveLength(0);
    });

    test('should not detect loading-related animations without user interaction', async () => {
      const { container } = render(<App />);
      animationMonitor = new CSSAnimationMonitor(container);
      
      const detectedAnimations = await animationMonitor.startMonitoring(2000);
      const loadingAnimations = animationMonitor.getLoadingRelatedAnimations();
      
      expect(loadingAnimations).toHaveLength(0);
    });

    test('should detect when animations are properly controlled by user actions', async () => {
      const { container } = render(<App />);
      animationMonitor = new CSSAnimationMonitor(container);
      
      // Start monitoring
      const monitoringPromise = animationMonitor.startMonitoring(5000);
      
      // Wait a bit, then trigger user action
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 1000));
      });
      
      // Simulate user clicking a button
      const buttons = container.querySelectorAll('button');
      if (buttons.length > 0) {
        fireEvent.click(buttons[0]);
      }
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 1000));
      });
      
      const detectedAnimations = await monitoringPromise;
      
      // If animations are detected after user action, they should be properly controlled
      const loadingAnimations = animationMonitor.getLoadingRelatedAnimations();
      
      // Animations after user actions are acceptable, but should not be infinite
      loadingAnimations.forEach(anim => {
        if (anim.isVisible) {
          expect(anim.animationIterationCount).not.toBe('infinite');
        }
      });
    });

    test('should monitor for skeleton loading animations', async () => {
      const { container } = render(<App />);
      animationMonitor = new CSSAnimationMonitor(container);
      
      const detectedAnimations = await animationMonitor.startMonitoring(2000);
      
      const skeletonAnimations = detectedAnimations.filter(anim => 
        anim.className.includes('skeleton') || 
        anim.className.includes('shimmer') ||
        anim.animationName.includes('pulse')
      );
      
      expect(skeletonAnimations).toHaveLength(0);
    });

    test('should detect problematic CSS transitions', async () => {
      const { container } = render(<App />);
      animationMonitor = new CSSAnimationMonitor(container);
      
      const detectedAnimations = await animationMonitor.startMonitoring(1000);
      
      const problematicTransitions = detectedAnimations.filter(anim => 
        anim.type === 'css-transition' && 
        anim.isLoadingRelated && 
        anim.isVisible &&
        (anim.transition.includes('all') || anim.transition.includes('opacity'))
      );
      
      expect(problematicTransitions).toHaveLength(0);
    });
  });

  describe('Animation Pattern Analysis', () => {
    
    test('should analyze animation timing for loading patterns', async () => {
      const { container } = render(<App />);
      animationMonitor = new CSSAnimationMonitor(container);
      
      const detectedAnimations = await animationMonitor.startMonitoring(3000);
      
      // Check for animations that start around 2 seconds (when the issue typically occurred)
      const suspiciousTimingAnimations = detectedAnimations.filter(anim => {
        const timeSinceStart = anim.timestamp - Date.now() + 3000; // Approximate
        return timeSinceStart > 1500 && timeSinceStart < 2500; // Between 1.5-2.5 seconds
      });
      
      expect(suspiciousTimingAnimations).toHaveLength(0);
    });

    test('should detect infinite animation loops', async () => {
      const { container } = render(<App />);
      animationMonitor = new CSSAnimationMonitor(container);
      
      const detectedAnimations = await animationMonitor.startMonitoring(2000);
      
      const infiniteAnimations = detectedAnimations.filter(anim => 
        anim.animationIterationCount === 'infinite' && 
        anim.isVisible &&
        anim.isLoadingRelated
      );
      
      expect(infiniteAnimations).toHaveLength(0);
    });

    test('should validate animation performance impact', async () => {
      const { container } = render(<App />);
      animationMonitor = new CSSAnimationMonitor(container);
      
      const startTime = performance.now();
      const detectedAnimations = await animationMonitor.startMonitoring(1000);
      const endTime = performance.now();
      
      const monitoringDuration = endTime - startTime;
      
      // Monitoring should not significantly impact performance
      expect(monitoringDuration).toBeLessThan(1500); // Allow some overhead
      
      // Should not detect performance-heavy animations
      const heavyAnimations = detectedAnimations.filter(anim => {
        const duration = parseFloat(anim.animationDuration);
        return duration > 0 && duration < 0.1; // Very fast animations can be performance-heavy
      });
      
      expect(heavyAnimations.length).toBeLessThan(5); // Allow some, but not many
    });
  });

  describe('CSS Class Monitoring', () => {
    
    test('should monitor for dynamic addition of loading classes', async () => {
      const { container } = render(<App />);
      
      const classChanges = [];
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
            const element = mutation.target;
            const newClassName = element.className;
            
            if (newClassName.includes('loading') || 
                newClassName.includes('spinner') || 
                newClassName.includes('animate-spin')) {
              classChanges.push({
                element,
                oldValue: mutation.oldValue,
                newValue: newClassName,
                timestamp: Date.now()
              });
            }
          }
        });
      });
      
      observer.observe(container, {
        attributes: true,
        attributeOldValue: true,
        subtree: true,
        attributeFilter: ['class']
      });
      
      // Wait for potential automatic class changes
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 3000));
      });
      
      observer.disconnect();
      
      // Should not have automatic loading class additions
      expect(classChanges).toHaveLength(0);
    });

    test('should validate loading classes are only applied during user actions', async () => {
      const { container } = render(<App />);
      
      const userTriggeredClassChanges = [];
      const automaticClassChanges = [];
      let userActionInProgress = false;
      
      // Track user actions
      const trackUserAction = () => {
        userActionInProgress = true;
        setTimeout(() => { userActionInProgress = false; }, 1000);
      };
      
      container.addEventListener('click', trackUserAction);
      container.addEventListener('submit', trackUserAction);
      
      // Monitor class changes
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
            const element = mutation.target;
            const newClassName = element.className;
            
            if (newClassName.includes('loading') || newClassName.includes('spinner')) {
              const change = {
                element,
                className: newClassName,
                timestamp: Date.now(),
                userActionInProgress
              };
              
              if (userActionInProgress) {
                userTriggeredClassChanges.push(change);
              } else {
                automaticClassChanges.push(change);
              }
            }
          }
        });
      });
      
      observer.observe(container, {
        attributes: true,
        subtree: true,
        attributeFilter: ['class']
      });
      
      // Wait and then trigger user action
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 1000));
      });
      
      const buttons = container.querySelectorAll('button');
      if (buttons.length > 0) {
        fireEvent.click(buttons[0]);
        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 500));
        });
      }
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 1000));
      });
      
      observer.disconnect();
      container.removeEventListener('click', trackUserAction);
      container.removeEventListener('submit', trackUserAction);
      
      // Should not have automatic loading class changes
      expect(automaticClassChanges).toHaveLength(0);
    });
  });

  describe('Animation Regression Prevention', () => {
    
    test('should create animation baseline for future comparison', async () => {
      const { container } = render(<App />);
      animationMonitor = new CSSAnimationMonitor(container);
      
      const baseline = await animationMonitor.startMonitoring(2000);
      
      const animationBaseline = {
        totalAnimations: baseline.length,
        loadingAnimations: animationMonitor.getLoadingRelatedAnimations().length,
        visibleAnimations: animationMonitor.getVisibleAnimations().length,
        spinAnimations: animationMonitor.getSpinAnimations().length,
        timestamp: Date.now()
      };
      
      // Store baseline for future tests
      expect(animationBaseline.loadingAnimations).toBe(0);
      expect(animationBaseline.spinAnimations).toBe(0);
      
      // This baseline can be used in CI/CD to detect regressions
      console.log('Animation Baseline:', JSON.stringify(animationBaseline, null, 2));
    });

    test('should validate animation cleanup on component unmount', async () => {
      const { container, unmount } = render(<App />);
      animationMonitor = new CSSAnimationMonitor(container);
      
      // Start monitoring
      const monitoringPromise = animationMonitor.startMonitoring(3000);
      
      // Trigger some user actions
      const buttons = container.querySelectorAll('button');
      if (buttons.length > 0) {
        fireEvent.click(buttons[0]);
      }
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 500));
      });
      
      // Unmount component
      unmount();
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 500));
      });
      
      const detectedAnimations = await monitoringPromise;
      
      // After unmount, no animations should be running
      const activeAnimationsAfterUnmount = detectedAnimations.filter(anim => {
        const element = anim.element;
        return element.isConnected && anim.isVisible;
      });
      
      expect(activeAnimationsAfterUnmount).toHaveLength(0);
    });

    test('should ensure animation monitoring does not interfere with app functionality', async () => {
      const { container } = render(<App />);
      animationMonitor = new CSSAnimationMonitor(container);
      
      // Start monitoring
      const monitoringPromise = animationMonitor.startMonitoring(2000);
      
      // Test that app still functions normally
      const buttons = container.querySelectorAll('button');
      const initialButtonCount = buttons.length;
      
      // Interact with the app
      if (buttons.length > 0) {
        fireEvent.click(buttons[0]);
        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
        });
      }
      
      // App should still be functional
      const buttonsAfterInteraction = container.querySelectorAll('button');
      expect(buttonsAfterInteraction.length).toBeGreaterThanOrEqual(initialButtonCount);
      
      await monitoringPromise;
      
      // Monitoring should complete without errors
      expect(animationMonitor.detectedAnimations).toBeDefined();
    });
  });
});
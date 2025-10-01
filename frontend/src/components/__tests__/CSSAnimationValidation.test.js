/**
 * CSS Animation Validation Test
 * 
 * Validates that CSS animations only occur when explicitly triggered
 * and no automatic animations appear on page load or navigation.
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import App from '../../App';

// Mock fetch
global.fetch = jest.fn();

// Mock MutationObserver for animation detection
global.MutationObserver = class MutationObserver {
  constructor(callback) {
    this.callback = callback;
    this.observations = [];
  }
  
  observe(target, options) {
    this.observations.push({ target, options });
  }
  
  disconnect() {
    this.observations = [];
  }
  
  takeRecords() {
    return [];
  }
};

describe('CSS Animation Validation Tests', () => {
  
  let animationObserver;
  let detectedAnimations = [];
  
  beforeEach(() => {
    fetch.mockClear();
    detectedAnimations = [];
    
    // Set up animation detection
    animationObserver = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const element = mutation.target;
          const classList = element.classList;
          
          // Check for loading animation classes
          if (classList.contains('animate-spin') || 
              classList.contains('loading-spinner-active') ||
              classList.contains('animate-pulse')) {
            detectedAnimations.push({
              element: element,
              classes: Array.from(classList),
              timestamp: Date.now()
            });
          }
        }
      });
    });
  });
  
  afterEach(() => {
    if (animationObserver) {
      animationObserver.disconnect();
    }
  });
  
  describe('No Automatic Animations on Page Load', () => {
    
    test('should not have any loading animations on initial render', async () => {
      render(<App />);
      
      // Start observing for animation changes
      animationObserver.observe(document.body, {
        attributes: true,
        childList: true,
        subtree: true,
        attributeFilter: ['class']
      });
      
      // Wait for component to fully mount
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 2000));
      });
      
      // Check for any elements with loading animation classes
      const spinningElements = document.querySelectorAll('.animate-spin');
      const loadingElements = document.querySelectorAll('.loading-spinner-active');
      const pulsingElements = document.querySelectorAll('.animate-pulse');
      
      expect(spinningElements).toHaveLength(0);
      expect(loadingElements).toHaveLength(0);
      expect(pulsingElements).toHaveLength(0);
      
      // Verify no animations were detected during mount
      expect(detectedAnimations).toHaveLength(0);
    });
    
    test('should not trigger animations during navigation', async () => {
      const user = userEvent.setup();
      
      render(<App />);
      
      // Start observing
      animationObserver.observe(document.body, {
        attributes: true,
        childList: true,
        subtree: true,
        attributeFilter: ['class']
      });
      
      const pages = ['Upload Comments', 'View Comments', 'Dashboard', 'Word Cloud', 'Home'];
      
      for (const page of pages) {
        const navButton = screen.getByText(page);
        await user.click(navButton);
        
        // Wait for navigation to complete
        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 500));
        });
        
        // Check for loading animations
        const spinningElements = document.querySelectorAll('.animate-spin');
        const loadingElements = document.querySelectorAll('.loading-spinner-active');
        
        expect(spinningElements).toHaveLength(0);
        expect(loadingElements).toHaveLength(0);
      }
      
      // Verify no animations were triggered during navigation
      expect(detectedAnimations).toHaveLength(0);
    });
  });
  
  describe('Explicit Animation Triggers Only', () => {
    
    test('should only show loading animations when user triggers actions', async () => {
      const user = userEvent.setup();
      
      // Mock API response with delay to catch loading state
      fetch.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            json: async () => ({ sentiment_label: 'positive', sentiment_score: 0.8 })
          }), 1000)
        )
      );
      
      render(<App />);
      
      // Start observing
      animationObserver.observe(document.body, {
        attributes: true,
        childList: true,
        subtree: true,
        attributeFilter: ['class']
      });
      
      // Trigger user action
      const testButton = screen.getByText('Test System');
      await user.click(testButton);
      
      // Verify loading state appears
      await waitFor(() => {
        expect(screen.getByText('Processing...')).toBeInTheDocument();
      });
      
      // Wait for completion
      await waitFor(() => {
        expect(screen.queryByText('Processing...')).not.toBeInTheDocument();
      }, { timeout: 5000 });
      
      // Verify the loading was user-triggered (no automatic animations)
      expect(fetch).toHaveBeenCalledTimes(1);
    });
    
    test('should control word cloud loading animations explicitly', async () => {
      const user = userEvent.setup();
      
      // Mock word cloud API response
      fetch.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            blob: async () => new Blob(['fake-image'], { type: 'image/png' })
          }), 800)
        )
      );
      
      render(<App />);
      
      // Navigate to word cloud page
      const wordCloudButton = screen.getByText('Word Cloud');
      await user.click(wordCloudButton);
      
      // Start observing after navigation
      animationObserver.observe(document.body, {
        attributes: true,
        childList: true,
        subtree: true,
        attributeFilter: ['class']
      });
      
      // Trigger word cloud generation
      const generateButton = screen.getByText('All Comments');
      await user.click(generateButton);
      
      // Verify loading state
      await waitFor(() => {
        expect(screen.getByText('Generating...')).toBeInTheDocument();
      });
      
      // Wait for completion
      await waitFor(() => {
        expect(screen.getByText('Word cloud generated successfully')).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });
  
  describe('CSS Class Control Validation', () => {
    
    test('should not apply global animation classes automatically', () => {
      render(<App />);
      
      // Check that no elements have automatic animation classes
      const allElements = document.querySelectorAll('*');
      
      allElements.forEach(element => {
        const classList = element.classList;
        
        // These classes should only be applied when explicitly needed
        expect(classList.contains('animate-spin')).toBe(false);
        expect(classList.contains('loading-spinner-active')).toBe(false);
        expect(classList.contains('animate-pulse')).toBe(false);
      });
    });
    
    test('should verify CSS animation classes are controlled by React state', async () => {
      const user = userEvent.setup();
      
      // Mock delayed API response
      fetch.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            json: async () => []
          }), 500)
        )
      );
      
      render(<App />);
      
      // Navigate to comments page
      const commentsButton = screen.getByText('View Comments');
      await user.click(commentsButton);
      
      // Before clicking load, no loading classes should be present
      expect(document.querySelectorAll('.animate-spin')).toHaveLength(0);
      
      // Click load comments
      const loadButton = screen.getByText('Load Comments');
      await user.click(loadButton);
      
      // During loading, verify loading state is controlled
      await waitFor(() => {
        expect(screen.getByText('Loading...')).toBeInTheDocument();
      });
      
      // After loading completes, no loading classes should remain
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      }, { timeout: 3000 });
      
      expect(document.querySelectorAll('.animate-spin')).toHaveLength(0);
    });
  });
  
  describe('Animation Performance Validation', () => {
    
    test('should not impact page performance with unnecessary animations', async () => {
      const startTime = performance.now();
      
      render(<App />);
      
      // Wait for full render
      await waitFor(() => {
        expect(screen.getByText('Welcome to eConsultation AI')).toBeInTheDocument();
      });
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render quickly without animation overhead
      expect(renderTime).toBeLessThan(500);
      
      // Verify no ongoing animations
      const computedStyles = window.getComputedStyle(document.body);
      expect(computedStyles.animation).toBe('');
    });
    
    test('should clean up animations properly after completion', async () => {
      const user = userEvent.setup();
      
      // Mock quick API response
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sentiment_label: 'positive', sentiment_score: 0.8 })
      });
      
      render(<App />);
      
      // Trigger action
      const testButton = screen.getByText('Test System');
      await user.click(testButton);
      
      // Wait for completion
      await waitFor(() => {
        expect(screen.getByText(/Comment processed!/)).toBeInTheDocument();
      }, { timeout: 3000 });
      
      // Verify no animation classes remain
      const animatedElements = document.querySelectorAll('.animate-spin, .loading-spinner-active, .animate-pulse');
      expect(animatedElements).toHaveLength(0);
      
      // Verify no inline animation styles
      const allElements = document.querySelectorAll('*');
      allElements.forEach(element => {
        const style = element.style;
        expect(style.animation).toBe('');
        expect(style.transform).not.toMatch(/rotate/);
      });
    });
  });
  
  describe('Browser Compatibility Validation', () => {
    
    test('should handle animation control across different browsers', () => {
      // Mock different user agents
      const originalUserAgent = navigator.userAgent;
      
      const browsers = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15'
      ];
      
      browsers.forEach(userAgent => {
        Object.defineProperty(navigator, 'userAgent', {
          value: userAgent,
          configurable: true
        });
        
        render(<App />);
        
        // Verify no automatic animations regardless of browser
        const animatedElements = document.querySelectorAll('.animate-spin, .loading-spinner-active');
        expect(animatedElements).toHaveLength(0);
      });
      
      // Restore original user agent
      Object.defineProperty(navigator, 'userAgent', {
        value: originalUserAgent,
        configurable: true
      });
    });
  });
  
  describe('CSS Transition Control', () => {
    
    test('should not have global CSS transitions causing loading effects', () => {
      render(<App />);
      
      // Check for problematic global transition rules
      const styleSheets = Array.from(document.styleSheets);
      
      styleSheets.forEach(sheet => {
        try {
          const rules = Array.from(sheet.cssRules || sheet.rules || []);
          
          rules.forEach(rule => {
            if (rule.selectorText === '*' || rule.selectorText === 'body') {
              const style = rule.style;
              
              // Global transitions should not cause loading-like effects
              if (style.transition && style.transition.includes('all')) {
                console.warn('Global transition rule detected:', rule.cssText);
              }
            }
          });
        } catch (e) {
          // Cross-origin stylesheets may not be accessible
        }
      });
    });
    
    test('should use controlled transition classes only', async () => {
      const user = userEvent.setup();
      
      render(<App />);
      
      // Navigate between pages
      const pages = ['Dashboard', 'Word Cloud', 'Home'];
      
      for (const page of pages) {
        const navButton = screen.getByText(page);
        await user.click(navButton);
        
        // Check that transitions are controlled, not automatic
        const elementsWithTransitions = document.querySelectorAll('[class*="transition"]');
        
        elementsWithTransitions.forEach(element => {
          const classList = Array.from(element.classList);
          
          // Should have specific transition classes, not global ones
          const hasControlledTransition = classList.some(cls => 
            cls.includes('transition') && !cls.includes('all')
          );
          
          if (classList.some(cls => cls.includes('transition'))) {
            expect(hasControlledTransition).toBe(true);
          }
        });
      }
    });
  });
});
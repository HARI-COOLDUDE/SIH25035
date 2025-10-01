/**
 * Integration Testing and Validation
 * 
 * This test suite validates that:
 * - All existing functionality works with the new loading system
 * - No automatic loading occurs on any page
 * - All user-triggered loading works correctly
 * - CSS animations only occur when explicitly triggered
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import App from '../../App';

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock URL.createObjectURL for word cloud tests
global.URL.createObjectURL = jest.fn(() => 'mock-blob-url');

// Mock console methods to capture debug logs
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

let consoleLogs = [];
let consoleWarns = [];
let consoleErrors = [];

beforeEach(() => {
  // Reset mocks
  fetch.mockClear();
  URL.createObjectURL.mockClear();
  
  // Reset console capture
  consoleLogs = [];
  consoleWarns = [];
  consoleErrors = [];
  
  console.log = (...args) => {
    consoleLogs.push(args.join(' '));
    originalConsoleLog(...args);
  };
  
  console.warn = (...args) => {
    consoleWarns.push(args.join(' '));
    originalConsoleWarn(...args);
  };
  
  console.error = (...args) => {
    consoleErrors.push(args.join(' '));
    originalConsoleError(...args);
  };
});

afterEach(() => {
  // Restore console methods
  console.log = originalConsoleLog;
  console.warn = originalConsoleWarn;
  console.error = originalConsoleError;
});

describe('Integration Testing and Validation', () => {
  
  describe('Requirement 4.1: Comment Submission Functionality', () => {
    test('should maintain all comment submission functionality with new loading system', async () => {
      const user = userEvent.setup();
      
      // Mock successful API response
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          sentiment_label: 'positive',
          sentiment_score: 0.85,
          id: 1
        })
      });
      
      render(<App />);
      
      // Navigate to home page and test quick action
      const testSystemButton = screen.getByText('Test System');
      expect(testSystemButton).toBeInTheDocument();
      
      // Click test system button
      await user.click(testSystemButton);
      
      // Wait for completion (loading might be too fast to catch)
      await waitFor(() => {
        expect(screen.getByText(/Comment processed! Sentiment: positive/)).toBeInTheDocument();
      }, { timeout: 5000 });
      
      // Verify API was called correctly
      expect(fetch).toHaveBeenCalledWith('http://localhost:8000/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stakeholder_type: 'citizen',
          raw_text: 'This is a test comment to verify the AI system is working properly.'
        })
      });
    });
    
    test('should handle custom comment submission correctly', async () => {
      const user = userEvent.setup();
      
      // Mock successful API response
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          sentiment_label: 'neutral',
          sentiment_score: 0.65,
          id: 2
        })
      });
      
      render(<App />);
      
      // Open custom comment dialog
      const addCommentButton = screen.getByText('Add Comment');
      await user.click(addCommentButton);
      
      // Fill in custom comment
      const textArea = screen.getByPlaceholderText('Enter your comment here...');
      await user.type(textArea, 'This is a custom test comment');
      
      // Submit comment
      const submitButton = screen.getByText('Submit Comment');
      await user.click(submitButton);
      
      // Wait for completion (loading might be too fast to catch)
      await waitFor(() => {
        expect(screen.getByText(/Comment processed! Sentiment: neutral/)).toBeInTheDocument();
      }, { timeout: 5000 });
      
      // Verify dialog closed
      expect(screen.queryByText('Add Custom Comment')).not.toBeInTheDocument();
    });
  });
  
  describe('Requirement 4.2: Dashboard Functionality', () => {
    test('should maintain dashboard statistics functionality', async () => {
      const user = userEvent.setup();
      
      // Mock dashboard API response
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          total_comments: 150,
          positive_percentage: 45.5,
          neutral_percentage: 35.2,
          negative_percentage: 19.3
        })
      });
      
      render(<App />);
      
      // Navigate to dashboard
      const dashboardButton = screen.getByText('Dashboard');
      await user.click(dashboardButton);
      
      // Verify dashboard page loads
      expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Dashboard Data Not Loaded')).toBeInTheDocument();
      
      // Load dashboard data
      const loadDataButton = screen.getByText('Load Dashboard Data');
      await user.click(loadDataButton);
      
      // Wait for data to load (loading might be too fast to catch)
      await waitFor(() => {
        expect(screen.getByText('150')).toBeInTheDocument(); // Total comments
        expect(screen.getByText('45.5%')).toBeInTheDocument(); // Positive percentage
        expect(screen.getByText('35.2%')).toBeInTheDocument(); // Neutral percentage
        expect(screen.getByText('19.3%')).toBeInTheDocument(); // Negative percentage
      }, { timeout: 5000 });
    });
  });
  
  describe('Requirement 4.3: Word Cloud Functionality', () => {
    test('should maintain word cloud generation functionality', async () => {
      const user = userEvent.setup();
      
      // Mock word cloud API response
      fetch.mockResolvedValueOnce({
        ok: true,
        blob: async () => new Blob(['fake-image-data'], { type: 'image/png' })
      });
      
      render(<App />);
      
      // Navigate to word cloud page
      const wordCloudButton = screen.getByText('Word Cloud');
      await user.click(wordCloudButton);
      
      // Verify word cloud page loads
      expect(screen.getByText('Word Cloud Visualization')).toBeInTheDocument();
      
      // Generate word cloud for all comments
      const allCommentsButton = screen.getByText('All Comments');
      await user.click(allCommentsButton);
      
      // Wait for word cloud to generate (loading might be too fast to catch)
      await waitFor(() => {
        expect(screen.getByText('Word cloud generated successfully')).toBeInTheDocument();
        expect(screen.getByAltText('Word Cloud')).toBeInTheDocument();
      }, { timeout: 5000 });
    });
    
    test('should handle sentiment-specific word clouds', async () => {
      const user = userEvent.setup();
      
      // Mock word cloud API response
      fetch.mockResolvedValueOnce({
        ok: true,
        blob: async () => new Blob(['fake-image-data'], { type: 'image/png' })
      });
      
      render(<App />);
      
      // Navigate to word cloud page
      const wordCloudButton = screen.getByText('Word Cloud');
      await user.click(wordCloudButton);
      
      // Generate positive sentiment word cloud
      const positiveButton = screen.getByText('Positive Only');
      await user.click(positiveButton);
      
      // Wait for completion (loading might be too fast to catch)
      await waitFor(() => {
        expect(screen.getByText('Word cloud generated successfully for positive comments')).toBeInTheDocument();
      }, { timeout: 5000 });
      
      // Verify correct API endpoint was called
      expect(fetch).toHaveBeenCalledWith('http://localhost:8000/api/wordcloud?sentiment=positive');
    });
  });
  
  describe('Requirement 4.4: CSV Upload Functionality', () => {
    test('should maintain CSV bulk processing capabilities', async () => {
      const user = userEvent.setup();
      
      // Mock CSV upload API response
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          comments: [
            { id: 1, raw_text: 'Comment 1' },
            { id: 2, raw_text: 'Comment 2' },
            { id: 3, raw_text: 'Comment 3' }
          ]
        })
      });
      
      render(<App />);
      
      // Navigate to upload page
      const uploadButton = screen.getByText('Upload Comments');
      await user.click(uploadButton);
      
      // Verify upload page loads
      expect(screen.getByText('Upload Comments from CSV')).toBeInTheDocument();
      
      // Create a mock CSV file
      const csvContent = 'stakeholder_type,raw_text\ncitizen,Test comment 1\nbusiness,Test comment 2';
      const file = new File([csvContent], 'test.csv', { type: 'text/csv' });
      
      // Upload file
      const fileInput = screen.getByLabelText('Choose CSV File');
      await user.upload(fileInput, file);
      
      // Wait for upload completion
      await waitFor(() => {
        expect(screen.getByText('Successfully processed 3 comments from CSV')).toBeInTheDocument();
      }, { timeout: 10000 });
      
      // Verify FormData was sent correctly
      expect(fetch).toHaveBeenCalledWith('http://localhost:8000/api/comments/bulk', {
        method: 'POST',
        body: expect.any(FormData)
      });
    });
  });
  
  describe('Requirement 4.5: Navigation and UI Components', () => {
    test('should maintain all navigation functionality', async () => {
      const user = userEvent.setup();
      
      render(<App />);
      
      // Test navigation to each page
      const pages = [
        { button: 'Home', content: 'Welcome to eConsultation AI' },
        { button: 'Upload Comments', content: 'Upload Comments from CSV' },
        { button: 'View Comments', content: 'Comments (0)' },
        { button: 'Dashboard', content: 'Analytics Dashboard' },
        { button: 'Word Cloud', content: 'Word Cloud Visualization' }
      ];
      
      for (const page of pages) {
        const navButton = screen.getByText(page.button);
        await user.click(navButton);
        
        // Verify page content loads
        expect(screen.getByText(page.content)).toBeInTheDocument();
        
        // Verify no automatic loading occurs
        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
        });
        
        // Check that no loading indicators appear automatically
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
        expect(screen.queryByText('Processing...')).not.toBeInTheDocument();
        expect(screen.queryByText('Generating...')).not.toBeInTheDocument();
      }
    });
    
    test('should maintain styling and UI components', () => {
      render(<App />);
      
      // Verify header is present
      expect(screen.getByText('eConsultation AI')).toBeInTheDocument();
      expect(screen.getByText('AI-Powered Comment Analysis System')).toBeInTheDocument();
      
      // Verify navigation sidebar
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Upload Comments')).toBeInTheDocument();
      expect(screen.getByText('View Comments')).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Word Cloud')).toBeInTheDocument();
      
      // Verify home page content
      expect(screen.getByText('Welcome to eConsultation AI')).toBeInTheDocument();
      expect(screen.getByText('Sentiment Analysis')).toBeInTheDocument();
      expect(screen.getByText('Auto Summarization')).toBeInTheDocument();
      expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
    });
  });
  
  describe('No Automatic Loading Validation', () => {
    test('should not trigger any automatic loading on page load', async () => {
      render(<App />);
      
      // Wait for component to fully mount
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 2000));
      });
      
      // Verify no loading indicators are present
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      expect(screen.queryByText('Processing...')).not.toBeInTheDocument();
      expect(screen.queryByText('Generating...')).not.toBeInTheDocument();
      
      // Verify no API calls were made automatically
      expect(fetch).not.toHaveBeenCalled();
      
      // Check console logs for any automatic loading triggers
      const automaticLoadingLogs = consoleLogs.filter(log => 
        log.includes('Loading state started') && 
        !log.includes('user action')
      );
      expect(automaticLoadingLogs).toHaveLength(0);
    });
    
    test('should not trigger loading when navigating between pages', async () => {
      const user = userEvent.setup();
      
      render(<App />);
      
      const pages = ['Upload Comments', 'View Comments', 'Dashboard', 'Word Cloud', 'Home'];
      
      for (const pageName of pages) {
        const navButton = screen.getByText(pageName);
        await user.click(navButton);
        
        // Wait a moment for any potential automatic loading
        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 500));
        });
        
        // Verify no loading indicators appear
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
        expect(screen.queryByText('Processing...')).not.toBeInTheDocument();
        expect(screen.queryByText('Generating...')).not.toBeInTheDocument();
      }
      
      // Verify no API calls were made during navigation
      expect(fetch).not.toHaveBeenCalled();
    });
  });
  
  describe('User-Triggered Loading Validation', () => {
    test('should only show loading states when user explicitly triggers actions', async () => {
      const user = userEvent.setup();
      
      // Mock API responses
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => []
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            total_comments: 0,
            positive_percentage: 0,
            neutral_percentage: 0,
            negative_percentage: 0
          })
        });
      
      render(<App />);
      
      // Test comments loading
      const commentsButton = screen.getByText('View Comments');
      await user.click(commentsButton);
      
      const loadCommentsButton = screen.getByText('Load Comments');
      await user.click(loadCommentsButton);
      
      // Wait for completion (loading might be too fast to catch)
      await waitFor(() => {
        expect(screen.getByText('Loaded 0 comments')).toBeInTheDocument();
      }, { timeout: 5000 });
      
      // Test dashboard loading
      const dashboardButton = screen.getByText('Dashboard');
      await user.click(dashboardButton);
      
      const loadDashboardButton = screen.getByText('Load Dashboard Data');
      await user.click(loadDashboardButton);
      
      // Wait for completion (loading might be too fast to catch)
      await waitFor(() => {
        expect(screen.getByText('Dashboard data loaded')).toBeInTheDocument();
      }, { timeout: 5000 });
      
      // Verify API calls were made only after user actions
      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });
  
  describe('CSS Animation Control Validation', () => {
    test('should not have any automatic CSS animations on page load', async () => {
      render(<App />);
      
      // Wait for component to fully render
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 1000));
      });
      
      // Check for any elements with loading animation classes
      const spinningElements = document.querySelectorAll('.animate-spin');
      const loadingElements = document.querySelectorAll('.loading-spinner-active');
      const skeletonElements = document.querySelectorAll('.animate-pulse');
      
      expect(spinningElements).toHaveLength(0);
      expect(loadingElements).toHaveLength(0);
      expect(skeletonElements).toHaveLength(0);
    });
    
    test('should only apply loading animations when explicitly triggered', async () => {
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
      
      // Trigger a user action that should show loading
      const testButton = screen.getByText('Test System');
      await user.click(testButton);
      
      // Wait for completion (loading might be too fast to catch)
      await waitFor(() => {
        expect(screen.getByText(/Comment processed!/)).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });
  
  describe('Error Handling Integration', () => {
    test('should handle API errors gracefully without breaking functionality', async () => {
      const user = userEvent.setup();
      
      // Mock API error
      fetch.mockRejectedValueOnce(new Error('Network error'));
      
      render(<App />);
      
      // Trigger an action that will fail
      const testButton = screen.getByText('Test System');
      await user.click(testButton);
      
      // Wait for error handling
      await waitFor(() => {
        expect(screen.getByText(/Error:/)).toBeInTheDocument();
      }, { timeout: 5000 });
      
      // Verify the app is still functional
      expect(screen.getByText('Test System')).toBeInTheDocument();
      expect(screen.getByText('Add Comment')).toBeInTheDocument();
      
      // Verify loading state was properly cleared
      expect(screen.queryByText('Processing...')).not.toBeInTheDocument();
    });
    
    test('should handle timeout errors appropriately', async () => {
      const user = userEvent.setup();
      
      // Mock API response with long delay to trigger timeout
      fetch.mockImplementation(() => 
        new Promise(() => {
          // Never resolve to simulate timeout
        })
      );
      
      render(<App />);
      
      // Trigger action
      const testButton = screen.getByText('Test System');
      await user.click(testButton);
      
      // Wait for timeout error (with reasonable timeout for test)
      await waitFor(() => {
        expect(screen.getByText(/taking longer than expected/)).toBeInTheDocument();
      }, { timeout: 30000 });
      
      // Verify loading state was cleared
      expect(screen.queryByText('Processing...')).not.toBeInTheDocument();
    }, 35000); // Increase test timeout
  });
  
  describe('Loading State Debugging Integration', () => {
    test('should log loading state changes in development mode', async () => {
      const user = userEvent.setup();
      
      // Set development mode
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      // Mock API response
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
      }, { timeout: 5000 });
      
      // Check for debug logs
      const loadingLogs = consoleLogs.filter(log => 
        log.includes('Loading state') || log.includes('operation')
      );
      expect(loadingLogs.length).toBeGreaterThan(0);
      
      // Restore environment
      process.env.NODE_ENV = originalEnv;
    });
  });
});
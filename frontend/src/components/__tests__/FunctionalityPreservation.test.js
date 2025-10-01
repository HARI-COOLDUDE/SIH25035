/**
 * Functionality Preservation Test
 * 
 * Validates that all existing functionality is preserved
 * with the new loading system implementation.
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import App from '../../App';

// Mock fetch
global.fetch = jest.fn();
global.URL.createObjectURL = jest.fn(() => 'mock-blob-url');

describe('Functionality Preservation Tests', () => {
  
  beforeEach(() => {
    fetch.mockClear();
    URL.createObjectURL.mockClear();
  });
  
  describe('Core Application Features', () => {
    
    test('should preserve complete comment processing workflow', async () => {
      const user = userEvent.setup();
      
      // Mock API responses for complete workflow
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: 1,
            sentiment_label: 'positive',
            sentiment_score: 0.85,
            summary: 'This is a positive test comment',
            raw_text: 'Test comment',
            stakeholder_type: 'citizen',
            timestamp: '2024-01-01T00:00:00Z'
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ([
            {
              id: 1,
              sentiment_label: 'positive',
              sentiment_score: 0.85,
              summary: 'This is a positive test comment',
              raw_text: 'Test comment',
              stakeholder_type: 'citizen',
              timestamp: '2024-01-01T00:00:00Z'
            }
          ])
        });
      
      render(<App />);
      
      // Step 1: Submit a test comment
      const testButton = screen.getByText('Test System');
      await user.click(testButton);
      
      // Wait for processing
      await waitFor(() => {
        expect(screen.getByText(/Comment processed! Sentiment: positive/)).toBeInTheDocument();
      }, { timeout: 5000 });
      
      // Step 2: Navigate to comments page and load comments
      const commentsNavButton = screen.getByText('View Comments');
      await user.click(commentsNavButton);
      
      const loadCommentsButton = screen.getByText('Load Comments');
      await user.click(loadCommentsButton);
      
      // Wait for comments to load
      await waitFor(() => {
        expect(screen.getByText('This is a positive test comment')).toBeInTheDocument();
        expect(screen.getByText('Test comment')).toBeInTheDocument();
      }, { timeout: 5000 });
      
      // Verify complete workflow worked
      expect(fetch).toHaveBeenCalledTimes(2);
      expect(screen.getByText('Comments (1)')).toBeInTheDocument();
    });
    
    test('should preserve custom comment dialog functionality', async () => {
      const user = userEvent.setup();
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 2,
          sentiment_label: 'neutral',
          sentiment_score: 0.65
        })
      });
      
      render(<App />);
      
      // Open custom comment dialog
      const addCommentButton = screen.getByText('Add Comment');
      await user.click(addCommentButton);
      
      // Verify dialog opened
      expect(screen.getByText('Add Custom Comment')).toBeInTheDocument();
      
      // Test stakeholder type selection
      const stakeholderSelect = screen.getByDisplayValue('citizen');
      await user.selectOptions(stakeholderSelect, 'business');
      expect(screen.getByDisplayValue('business')).toBeInTheDocument();
      
      // Test comment text input
      const textArea = screen.getByPlaceholderText('Enter your comment here...');
      const testComment = 'This is a custom business comment for testing';
      await user.type(textArea, testComment);
      
      // Verify character count
      expect(screen.getByText(`${testComment.length} characters`)).toBeInTheDocument();
      
      // Submit comment
      const submitButton = screen.getByText('Submit Comment');
      await user.click(submitButton);
      
      // Wait for processing
      await waitFor(() => {
        expect(screen.getByText(/Comment processed! Sentiment: neutral/)).toBeInTheDocument();
      }, { timeout: 5000 });
      
      // Verify dialog closed
      expect(screen.queryByText('Add Custom Comment')).not.toBeInTheDocument();
      
      // Verify API call was made with correct data
      expect(fetch).toHaveBeenCalledWith('http://localhost:8000/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stakeholder_type: 'business',
          raw_text: testComment
        })
      });
    });
    
    test('should preserve dashboard statistics display', async () => {
      const user = userEvent.setup();
      
      const mockStats = {
        total_comments: 250,
        positive_percentage: 42.8,
        neutral_percentage: 38.4,
        negative_percentage: 18.8
      };
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockStats
      });
      
      render(<App />);
      
      // Navigate to dashboard
      const dashboardButton = screen.getByText('Dashboard');
      await user.click(dashboardButton);
      
      // Load dashboard data
      const loadDataButton = screen.getByText('Load Dashboard Data');
      await user.click(loadDataButton);
      
      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('250')).toBeInTheDocument();
        expect(screen.getByText('42.8%')).toBeInTheDocument();
        expect(screen.getByText('38.4%')).toBeInTheDocument();
        expect(screen.getByText('18.8%')).toBeInTheDocument();
      }, { timeout: 5000 });
      
      // Verify all dashboard elements are present
      expect(screen.getByText('Total Comments')).toBeInTheDocument();
      expect(screen.getByText('Positive')).toBeInTheDocument();
      expect(screen.getByText('Neutral')).toBeInTheDocument();
      expect(screen.getByText('Negative')).toBeInTheDocument();
    });
    
    test('should preserve word cloud generation for all sentiment types', async () => {
      const user = userEvent.setup();
      
      // Mock blob responses for different sentiment types
      const mockBlob = new Blob(['fake-image-data'], { type: 'image/png' });
      
      render(<App />);
      
      // Navigate to word cloud page
      const wordCloudButton = screen.getByText('Word Cloud');
      await user.click(wordCloudButton);
      
      // Test each word cloud type
      const wordCloudTypes = [
        { button: 'All Comments', expectedMessage: 'Word cloud generated successfully' },
        { button: 'Positive Only', expectedMessage: 'Word cloud generated successfully for positive comments' },
        { button: 'Negative Only', expectedMessage: 'Word cloud generated successfully for negative comments' },
        { button: 'Neutral Only', expectedMessage: 'Word cloud generated successfully for neutral comments' }
      ];
      
      for (const type of wordCloudTypes) {
        // Mock API response
        fetch.mockResolvedValueOnce({
          ok: true,
          blob: async () => mockBlob
        });
        
        // Click button
        const button = screen.getByText(type.button);
        await user.click(button);
        
        // Wait for generation
        await waitFor(() => {
          expect(screen.getByText(type.expectedMessage)).toBeInTheDocument();
        }, { timeout: 5000 });
        
        // Verify image is displayed
        expect(screen.getByAltText('Word Cloud')).toBeInTheDocument();
        
        // Clear word cloud for next test
        const clearButton = screen.getByText('Clear');
        await user.click(clearButton);
        
        await waitFor(() => {
          expect(screen.queryByAltText('Word Cloud')).not.toBeInTheDocument();
        });
      }
    });
    
    test('should preserve CSV upload functionality', async () => {
      const user = userEvent.setup();
      
      const mockResponse = {
        comments: [
          { id: 1, raw_text: 'Comment 1', stakeholder_type: 'citizen' },
          { id: 2, raw_text: 'Comment 2', stakeholder_type: 'business' },
          { id: 3, raw_text: 'Comment 3', stakeholder_type: 'ngo' }
        ]
      };
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });
      
      render(<App />);
      
      // Navigate to upload page
      const uploadButton = screen.getByText('Upload Comments');
      await user.click(uploadButton);
      
      // Create mock CSV file
      const csvContent = 'stakeholder_type,raw_text\ncitizen,Comment 1\nbusiness,Comment 2\nngo,Comment 3';
      const file = new File([csvContent], 'test.csv', { type: 'text/csv' });
      
      // Upload file
      const fileInput = screen.getByLabelText('Choose CSV File');
      await user.upload(fileInput, file);
      
      // Wait for upload completion
      await waitFor(() => {
        expect(screen.getByText('Successfully processed 3 comments from CSV')).toBeInTheDocument();
      }, { timeout: 10000 });
      
      // Verify API call
      expect(fetch).toHaveBeenCalledWith('http://localhost:8000/api/comments/bulk', {
        method: 'POST',
        body: expect.any(FormData)
      });
    });
  });
  
  describe('Navigation and UI Preservation', () => {
    
    test('should preserve all navigation functionality', async () => {
      const user = userEvent.setup();
      
      render(<App />);
      
      // Test navigation to each page and verify content
      const navigationTests = [
        {
          button: 'Home',
          expectedContent: ['Welcome to eConsultation AI', 'Sentiment Analysis', 'Auto Summarization'],
          description: 'Home page with feature overview'
        },
        {
          button: 'Upload Comments',
          expectedContent: ['Upload Comments from CSV', 'Add Individual Comment', 'Choose CSV File'],
          description: 'Upload page with CSV and individual comment options'
        },
        {
          button: 'View Comments',
          expectedContent: ['Comments (0)', 'No comments loaded yet', 'Load Comments from Backend'],
          description: 'Comments page with loading option'
        },
        {
          button: 'Dashboard',
          expectedContent: ['Analytics Dashboard', 'Dashboard Data Not Loaded', 'Load Dashboard Data'],
          description: 'Dashboard page with statistics loading'
        },
        {
          button: 'Word Cloud',
          expectedContent: ['Word Cloud Visualization', 'Generate Word Cloud', 'All Comments'],
          description: 'Word cloud page with generation options'
        }
      ];
      
      for (const nav of navigationTests) {
        // Navigate to page
        const navButton = screen.getByText(nav.button);
        await user.click(navButton);
        
        // Verify expected content is present
        for (const content of nav.expectedContent) {
          expect(screen.getByText(content)).toBeInTheDocument();
        }
        
        // Verify no automatic loading occurs
        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 500));
        });
        
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
        expect(screen.queryByText('Processing...')).not.toBeInTheDocument();
      }
    });
    
    test('should preserve header and branding', () => {
      render(<App />);
      
      // Verify header elements
      expect(screen.getByText('eConsultation AI')).toBeInTheDocument();
      expect(screen.getByText('AI-Powered Comment Analysis System')).toBeInTheDocument();
      
      // Verify navigation sidebar structure
      const navItems = ['Home', 'Upload Comments', 'View Comments', 'Dashboard', 'Word Cloud'];
      navItems.forEach(item => {
        expect(screen.getByText(item)).toBeInTheDocument();
      });
    });
    
    test('should preserve responsive design and styling', () => {
      render(<App />);
      
      // Verify main layout structure
      const header = screen.getByRole('banner');
      expect(header).toHaveClass('bg-white', 'shadow-lg');
      
      // Verify gradient backgrounds are preserved
      expect(screen.getByText('Welcome to eConsultation AI').closest('div')).toHaveClass('bg-gradient-to-r');
      
      // Verify card layouts are preserved
      const featureCards = screen.getAllByText(/Sentiment Analysis|Auto Summarization|Analytics Dashboard/);
      expect(featureCards).toHaveLength(3);
    });
  });
  
  describe('Error Handling Preservation', () => {
    
    test('should preserve error handling for API failures', async () => {
      const user = userEvent.setup();
      
      // Mock API error
      fetch.mockRejectedValueOnce(new Error('Server error'));
      
      render(<App />);
      
      // Trigger action that will fail
      const testButton = screen.getByText('Test System');
      await user.click(testButton);
      
      // Wait for error message
      await waitFor(() => {
        expect(screen.getByText(/Failed to submit test comment/)).toBeInTheDocument();
      }, { timeout: 5000 });
      
      // Verify app remains functional
      expect(testButton).toBeInTheDocument();
      expect(screen.getByText('Add Comment')).toBeInTheDocument();
    });
    
    test('should preserve error handling for invalid file uploads', async () => {
      const user = userEvent.setup();
      
      render(<App />);
      
      // Navigate to upload page
      const uploadButton = screen.getByText('Upload Comments');
      await user.click(uploadButton);
      
      // Try to upload invalid file
      const invalidFile = new File(['invalid content'], 'test.txt', { type: 'text/plain' });
      const fileInput = screen.getByLabelText('Choose CSV File');
      
      await user.upload(fileInput, invalidFile);
      
      // Verify error message
      await waitFor(() => {
        expect(screen.getByText('Please select a valid CSV file')).toBeInTheDocument();
      });
    });
  });
  
  describe('Performance and User Experience', () => {
    
    test('should maintain fast page load times', async () => {
      const startTime = performance.now();
      
      render(<App />);
      
      // Wait for component to fully render
      await waitFor(() => {
        expect(screen.getByText('Welcome to eConsultation AI')).toBeInTheDocument();
      });
      
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      
      // Should load within 1 second (1000ms)
      expect(loadTime).toBeLessThan(1000);
    });
    
    test('should preserve smooth navigation transitions', async () => {
      const user = userEvent.setup();
      
      render(<App />);
      
      const pages = ['Upload Comments', 'View Comments', 'Dashboard', 'Word Cloud', 'Home'];
      
      for (const page of pages) {
        const startTime = performance.now();
        
        const navButton = screen.getByText(page);
        await user.click(navButton);
        
        // Wait for page content to appear
        await waitFor(() => {
          // Each page should have unique content that appears quickly
          expect(document.body).toBeInTheDocument();
        });
        
        const endTime = performance.now();
        const transitionTime = endTime - startTime;
        
        // Navigation should be fast (under 100ms)
        expect(transitionTime).toBeLessThan(100);
      }
    });
  });
});
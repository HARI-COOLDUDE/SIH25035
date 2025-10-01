/**
 * Core Integration Validation Test
 * 
 * Simplified integration test that validates the core requirements
 * for task 9 without relying on timing-sensitive loading states.
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

describe('Core Integration Validation', () => {
  
  beforeEach(() => {
    fetch.mockClear();
    URL.createObjectURL.mockClear();
  });
  
  describe('Requirement 4.1: Comment Submission Functionality Preserved', () => {
    
    test('should successfully submit test comments', async () => {
      const user = userEvent.setup();
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          sentiment_label: 'positive',
          sentiment_score: 0.85,
          id: 1
        })
      });
      
      render(<App />);
      
      const testButton = screen.getByText('Test System');
      await user.click(testButton);
      
      // Verify successful completion
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
    
    test('should successfully submit custom comments', async () => {
      const user = userEvent.setup();
      
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
      
      // Fill in comment
      const textArea = screen.getByPlaceholderText('Enter your comment here...');
      await user.type(textArea, 'Custom test comment');
      
      // Submit
      const submitButton = screen.getByText('Submit Comment');
      await user.click(submitButton);
      
      // Verify success
      await waitFor(() => {
        expect(screen.getByText(/Comment processed! Sentiment: neutral/)).toBeInTheDocument();
      }, { timeout: 5000 });
      
      // Verify dialog closed
      expect(screen.queryByText('Add Custom Comment')).not.toBeInTheDocument();
    });
  });
  
  describe('Requirement 4.2: Dashboard Functionality Preserved', () => {
    
    test('should load and display dashboard statistics', async () => {
      const user = userEvent.setup();
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          total_comments: 100,
          positive_percentage: 40.0,
          neutral_percentage: 35.0,
          negative_percentage: 25.0
        })
      });
      
      render(<App />);
      
      // Navigate to dashboard
      const dashboardButton = screen.getByText('Dashboard');
      await user.click(dashboardButton);
      
      // Load data
      const loadDataButton = screen.getByText('Load Dashboard Data');
      await user.click(loadDataButton);
      
      // Verify data appears
      await waitFor(() => {
        expect(screen.getByText('100')).toBeInTheDocument();
        expect(screen.getByText('40.0%')).toBeInTheDocument();
        expect(screen.getByText('35.0%')).toBeInTheDocument();
        expect(screen.getByText('25.0%')).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });
  
  describe('Requirement 4.3: Word Cloud Functionality Preserved', () => {
    
    test('should generate word clouds successfully', async () => {
      const user = userEvent.setup();
      
      fetch.mockResolvedValueOnce({
        ok: true,
        blob: async () => new Blob(['fake-image'], { type: 'image/png' })
      });
      
      render(<App />);
      
      // Navigate to word cloud
      const wordCloudButton = screen.getByText('Word Cloud');
      await user.click(wordCloudButton);
      
      // Generate word cloud
      const generateButton = screen.getByText('All Comments');
      await user.click(generateButton);
      
      // Verify success
      await waitFor(() => {
        expect(screen.getByText('Word cloud generated successfully')).toBeInTheDocument();
        expect(screen.getByAltText('Word Cloud')).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });
  
  describe('Requirement 4.4: CSV Upload Functionality Preserved', () => {
    
    test('should handle CSV uploads successfully', async () => {
      const user = userEvent.setup();
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          comments: [
            { id: 1, raw_text: 'Comment 1' },
            { id: 2, raw_text: 'Comment 2' }
          ]
        })
      });
      
      render(<App />);
      
      // Navigate to upload
      const uploadButton = screen.getByText('Upload Comments');
      await user.click(uploadButton);
      
      // Upload file
      const csvContent = 'stakeholder_type,raw_text\ncitizen,Comment 1\nbusiness,Comment 2';
      const file = new File([csvContent], 'test.csv', { type: 'text/csv' });
      const fileInput = screen.getByLabelText('Choose CSV File');
      await user.upload(fileInput, file);
      
      // Verify success
      await waitFor(() => {
        expect(screen.getByText('Successfully processed 2 comments from CSV')).toBeInTheDocument();
      }, { timeout: 10000 });
    });
  });
  
  describe('Requirement 4.5: Navigation and UI Components Preserved', () => {
    
    test('should maintain all navigation functionality', async () => {
      const user = userEvent.setup();
      
      render(<App />);
      
      // Test each navigation item
      const navItems = [
        { button: 'Home', expectedText: 'Welcome to eConsultation AI' },
        { button: 'Upload Comments', expectedText: 'Upload Comments from CSV' },
        { button: 'View Comments', expectedText: 'Comments (0)' },
        { button: 'Dashboard', expectedText: 'Analytics Dashboard' },
        { button: 'Word Cloud', expectedText: 'Word Cloud Visualization' }
      ];
      
      for (const item of navItems) {
        const navButton = screen.getByText(item.button);
        await user.click(navButton);
        
        expect(screen.getByText(item.expectedText)).toBeInTheDocument();
      }
    });
    
    test('should preserve header and branding', () => {
      render(<App />);
      
      expect(screen.getByText('eConsultation AI')).toBeInTheDocument();
      expect(screen.getByText('AI-Powered Comment Analysis System')).toBeInTheDocument();
    });
  });
  
  describe('No Automatic Loading Validation', () => {
    
    test('should not make any API calls on initial load', async () => {
      render(<App />);
      
      // Wait for component to mount
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 1000));
      });
      
      // Verify no API calls were made
      expect(fetch).not.toHaveBeenCalled();
    });
    
    test('should not make API calls during navigation', async () => {
      const user = userEvent.setup();
      
      render(<App />);
      
      // Navigate through all pages
      const pages = ['Upload Comments', 'View Comments', 'Dashboard', 'Word Cloud', 'Home'];
      
      for (const page of pages) {
        const navButton = screen.getByText(page);
        await user.click(navButton);
        
        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
        });
      }
      
      // Verify no API calls were made during navigation
      expect(fetch).not.toHaveBeenCalled();
    });
    
    test('should not show loading indicators on page load', async () => {
      render(<App />);
      
      // Wait for full render
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 2000));
      });
      
      // Check for loading indicators
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      expect(screen.queryByText('Processing...')).not.toBeInTheDocument();
      expect(screen.queryByText('Generating...')).not.toBeInTheDocument();
    });
  });
  
  describe('User-Triggered Actions Only', () => {
    
    test('should only make API calls when user explicitly triggers actions', async () => {
      const user = userEvent.setup();
      
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ sentiment_label: 'positive', sentiment_score: 0.8 })
      });
      
      render(<App />);
      
      // Verify no initial API calls
      expect(fetch).not.toHaveBeenCalled();
      
      // User triggers action
      const testButton = screen.getByText('Test System');
      await user.click(testButton);
      
      // Now API should be called
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(1);
      });
    });
  });
  
  describe('CSS Animation Control', () => {
    
    test('should not have automatic CSS animations on load', () => {
      render(<App />);
      
      // Check for loading animation classes
      const spinningElements = document.querySelectorAll('.animate-spin');
      const loadingElements = document.querySelectorAll('.loading-spinner-active');
      const pulsingElements = document.querySelectorAll('.animate-pulse');
      
      expect(spinningElements).toHaveLength(0);
      expect(loadingElements).toHaveLength(0);
      expect(pulsingElements).toHaveLength(0);
    });
  });
  
  describe('Error Handling Preservation', () => {
    
    test('should handle API errors gracefully', async () => {
      const user = userEvent.setup();
      
      fetch.mockRejectedValueOnce(new Error('Network error'));
      
      render(<App />);
      
      const testButton = screen.getByText('Test System');
      await user.click(testButton);
      
      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/Error:/)).toBeInTheDocument();
      }, { timeout: 5000 });
      
      // App should remain functional
      expect(testButton).toBeInTheDocument();
    });
    
    test('should handle invalid file uploads', async () => {
      const user = userEvent.setup();
      
      render(<App />);
      
      // Navigate to upload
      const uploadButton = screen.getByText('Upload Comments');
      await user.click(uploadButton);
      
      // Try invalid file
      const invalidFile = new File(['invalid'], 'test.txt', { type: 'text/plain' });
      const fileInput = screen.getByLabelText('Choose CSV File');
      await user.upload(fileInput, invalidFile);
      
      // Should show error
      await waitFor(() => {
        expect(screen.getByText('Please select a valid CSV file')).toBeInTheDocument();
      });
    });
  });
  
  describe('Performance Validation', () => {
    
    test('should load quickly without automatic operations', async () => {
      const startTime = performance.now();
      
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByText('Welcome to eConsultation AI')).toBeInTheDocument();
      });
      
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      
      // Should load within reasonable time
      expect(loadTime).toBeLessThan(2000);
    });
  });
});
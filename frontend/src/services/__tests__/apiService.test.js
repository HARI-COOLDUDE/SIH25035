/**
 * Tests for API Service Layer
 * 
 * Basic tests to verify the API service functionality including
 * timeout management, retry logic, and error handling.
 */

import ApiService, { transformError, DEFAULT_CONFIG } from '../apiService';

// Mock fetch for testing
global.fetch = jest.fn();

describe('ApiService', () => {
  beforeEach(() => {
    fetch.mockClear();
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('transformError', () => {
    it('should transform timeout errors', () => {
      const error = new Error('Request timed out');
      error.name = 'AbortError';
      
      const result = transformError(error, 'test operation');
      expect(result).toBe('test operation timed out. Please try again.');
    });

    it('should transform network errors', () => {
      const error = new Error('Failed to fetch');
      
      const result = transformError(error);
      expect(result).toBe('Cannot connect to server. Please check if the backend is running on http://localhost:8000.');
    });

    it('should transform HTTP status errors', () => {
      const error = new Error('HTTP 500');
      error.status = 500;
      
      const result = transformError(error);
      expect(result).toBe('Server error. Please try again later.');
    });

    it('should handle unknown errors gracefully', () => {
      const error = new Error('Some unknown error');
      
      const result = transformError(error);
      expect(result).toBe('Some unknown error');
    });
  });

  describe('submitComment', () => {
    it('should submit comment successfully', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          id: 1,
          sentiment_label: 'positive',
          sentiment_score: 0.8
        })
      };
      
      fetch.mockResolvedValue(mockResponse);

      const comment = {
        stakeholder_type: 'citizen',
        raw_text: 'Test comment'
      };

      const result = await ApiService.submitComment(comment);
      
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/comments',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(comment)
        })
      );
      
      expect(result).toEqual({
        id: 1,
        sentiment_label: 'positive',
        sentiment_score: 0.8
      });
    });

    it('should handle HTTP errors', async () => {
      const mockResponse = {
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: jest.fn().mockResolvedValue('Invalid input')
      };
      
      fetch.mockResolvedValue(mockResponse);

      const comment = {
        stakeholder_type: 'citizen',
        raw_text: 'Test comment'
      };

      await expect(ApiService.submitComment(comment)).rejects.toThrow(
        'Invalid request. Please check your input and try again.'
      );
    });
  });

  describe('fetchComments', () => {
    it('should fetch comments successfully', async () => {
      const mockComments = [
        { id: 1, raw_text: 'Comment 1' },
        { id: 2, raw_text: 'Comment 2' }
      ];
      
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockComments)
      };
      
      fetch.mockResolvedValue(mockResponse);

      const result = await ApiService.fetchComments();
      
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/comments',
        expect.objectContaining({
          method: 'GET'
        })
      );
      
      expect(result).toEqual(mockComments);
    });
  });

  describe('timeout handling', () => {
    it('should timeout requests after specified time', async () => {
      // Mock a slow response
      fetch.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 10000))
      );

      const promise = ApiService.submitComment(
        { stakeholder_type: 'citizen', raw_text: 'Test' },
        { timeout: 1000 }
      );

      // Fast-forward time to trigger timeout
      jest.advanceTimersByTime(1000);

      await expect(promise).rejects.toThrow('Comment submission timed out');
    });
  });

  describe('retry logic', () => {
    it('should retry failed requests', async () => {
      // First call fails, second succeeds
      fetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({ id: 1 })
        });

      const result = await ApiService.submitComment({
        stakeholder_type: 'citizen',
        raw_text: 'Test'
      });

      expect(fetch).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ id: 1 });
    });

    it('should not retry 400 errors', async () => {
      const mockResponse = {
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: jest.fn().mockResolvedValue('Invalid input')
      };
      
      fetch.mockResolvedValue(mockResponse);

      await expect(ApiService.submitComment({
        stakeholder_type: 'citizen',
        raw_text: 'Test'
      })).rejects.toThrow();

      // Should only be called once (no retry for 400 errors)
      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });
});
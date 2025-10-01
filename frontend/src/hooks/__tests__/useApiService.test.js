/**
 * Tests for useApiService hook
 * 
 * Integration tests to verify the API service hook works correctly
 * with the loading state management system.
 */

import { renderHook, act } from '@testing-library/react';
import useApiService from '../useApiService';
import ApiService from '../../services/apiService';

// Mock the API service
jest.mock('../../services/apiService');
jest.mock('../useSimpleLoading');

// Mock useSimpleLoading
const mockWithLoading = jest.fn();
jest.doMock('../useSimpleLoading', () => ({
  __esModule: true,
  default: () => ({
    withLoading: mockWithLoading
  })
}));

describe('useApiService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWithLoading.mockImplementation((operationName, asyncFn) => asyncFn());
  });

  it('should submit comment with loading state', async () => {
    const mockResult = { id: 1, sentiment_label: 'positive' };
    ApiService.submitComment.mockResolvedValue(mockResult);

    const { result } = renderHook(() => useApiService());
    
    const onSuccess = jest.fn();
    const onError = jest.fn();
    
    await act(async () => {
      await result.current.submitComment(
        { stakeholder_type: 'citizen', raw_text: 'Test' },
        { onSuccess, onError }
      );
    });

    expect(ApiService.submitComment).toHaveBeenCalledWith({
      stakeholder_type: 'citizen',
      raw_text: 'Test'
    });
    
    expect(mockWithLoading).toHaveBeenCalledWith(
      'submitComment',
      expect.any(Function),
      expect.objectContaining({
        timeout: 25000
      })
    );
    
    expect(onSuccess).toHaveBeenCalledWith(mockResult);
    expect(onError).not.toHaveBeenCalled();
  });

  it('should handle API errors', async () => {
    const mockError = new Error('API Error');
    ApiService.submitComment.mockRejectedValue(mockError);

    const { result } = renderHook(() => useApiService());
    
    const onSuccess = jest.fn();
    const onError = jest.fn();
    
    await act(async () => {
      try {
        await result.current.submitComment(
          { stakeholder_type: 'citizen', raw_text: 'Test' },
          { onSuccess, onError }
        );
      } catch (error) {
        // Expected to throw
      }
    });

    expect(onSuccess).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(mockError);
  });

  it('should fetch comments with loading state', async () => {
    const mockComments = [{ id: 1, raw_text: 'Comment 1' }];
    ApiService.fetchComments.mockResolvedValue(mockComments);

    const { result } = renderHook(() => useApiService());
    
    const onSuccess = jest.fn();
    
    await act(async () => {
      await result.current.fetchComments({ onSuccess });
    });

    expect(ApiService.fetchComments).toHaveBeenCalled();
    expect(mockWithLoading).toHaveBeenCalledWith(
      'fetchComments',
      expect.any(Function)
    );
    expect(onSuccess).toHaveBeenCalledWith(mockComments);
  });

  it('should generate wordcloud with sentiment filter', async () => {
    const mockBlob = new Blob(['fake image data']);
    ApiService.generateWordcloud.mockResolvedValue(mockBlob);
    
    // Mock URL.createObjectURL
    global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');

    const { result } = renderHook(() => useApiService());
    
    const onSuccess = jest.fn();
    
    await act(async () => {
      await result.current.generateWordcloud('positive', { onSuccess });
    });

    expect(ApiService.generateWordcloud).toHaveBeenCalledWith('positive');
    expect(mockWithLoading).toHaveBeenCalledWith(
      'generateWordcloud_positive',
      expect.any(Function),
      expect.objectContaining({
        timeout: 30000
      })
    );
    expect(onSuccess).toHaveBeenCalledWith('blob:mock-url', 'positive');
  });

  it('should upload CSV with loading state', async () => {
    const mockResult = { comments: [{ id: 1 }] };
    ApiService.uploadCSV.mockResolvedValue(mockResult);

    const { result } = renderHook(() => useApiService());
    
    const mockFile = new File(['csv content'], 'test.csv', { type: 'text/csv' });
    const onSuccess = jest.fn();
    
    await act(async () => {
      await result.current.uploadCSV(mockFile, { onSuccess });
    });

    expect(ApiService.uploadCSV).toHaveBeenCalledWith(mockFile);
    expect(mockWithLoading).toHaveBeenCalledWith(
      'uploadCSV',
      expect.any(Function),
      expect.objectContaining({
        timeout: 60000
      })
    );
    expect(onSuccess).toHaveBeenCalledWith(mockResult, mockFile);
  });
});
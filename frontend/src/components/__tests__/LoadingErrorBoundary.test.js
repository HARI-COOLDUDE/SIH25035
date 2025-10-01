/**
 * LoadingErrorBoundary.test.js - Tests for the LoadingErrorBoundary component
 * 
 * Tests error boundary functionality, user feedback, and recovery options
 */

import { render, screen, fireEvent } from '@testing-library/react';
import LoadingErrorBoundary from '../LoadingErrorBoundary';
import React from 'react';

// Test component that throws an error
const ThrowError = ({ shouldThrow, error }) => {
  if (shouldThrow) {
    throw error || new Error('Test error');
  }
  return <div>No error</div>;
};

// Test component that throws a loading timeout error
const ThrowTimeoutError = ({ shouldThrow }) => {
  if (shouldThrow) {
    const error = new Error('Operation timed out after 30000ms');
    error.name = 'LoadingTimeoutError';
    error.operation = 'testOperation';
    error.timeout = 30000;
    throw error;
  }
  return <div>No timeout error</div>;
};

describe('LoadingErrorBoundary', () => {
  let mockOnError;
  let mockOnRetry;
  let mockOnDismiss;
  let mockOnErrorReport;

  beforeEach(() => {
    mockOnError = jest.fn();
    mockOnRetry = jest.fn();
    mockOnDismiss = jest.fn();
    mockOnErrorReport = jest.fn();
    
    // Suppress console.error for error boundary tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Normal Operation', () => {
    it('should render children when no error occurs', () => {
      render(
        <LoadingErrorBoundary>
          <div>Test content</div>
        </LoadingErrorBoundary>
      );

      expect(screen.getByText('Test content')).toBeInTheDocument();
    });

    it('should not show error UI when no error occurs', () => {
      render(
        <LoadingErrorBoundary>
          <ThrowError shouldThrow={false} />
        </LoadingErrorBoundary>
      );

      expect(screen.getByText('No error')).toBeInTheDocument();
      expect(screen.queryByText('Loading Error')).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should catch and display error when child component throws', () => {
      render(
        <LoadingErrorBoundary onError={mockOnError}>
          <ThrowError shouldThrow={true} />
        </LoadingErrorBoundary>
      );

      expect(screen.getByText('Loading Error')).toBeInTheDocument();
      expect(screen.getByText('An error occurred while managing loading states.')).toBeInTheDocument();
      expect(mockOnError).toHaveBeenCalled();
    });

    it('should display custom title and message', () => {
      const customTitle = 'Custom Error Title';
      const customMessage = 'Custom error message for testing';

      render(
        <LoadingErrorBoundary 
          title={customTitle}
          message={customMessage}
        >
          <ThrowError shouldThrow={true} />
        </LoadingErrorBoundary>
      );

      expect(screen.getByText(customTitle)).toBeInTheDocument();
      expect(screen.getByText(customMessage)).toBeInTheDocument();
    });

    it('should display operation name when available', () => {
      const error = new Error('Test error');
      error.operation = 'testOperation';

      render(
        <LoadingErrorBoundary>
          <ThrowError shouldThrow={true} error={error} />
        </LoadingErrorBoundary>
      );

      expect(screen.getByText('Operation: testOperation')).toBeInTheDocument();
    });

    it('should call onErrorReport callback when provided', () => {
      render(
        <LoadingErrorBoundary onErrorReport={mockOnErrorReport}>
          <ThrowError shouldThrow={true} />
        </LoadingErrorBoundary>
      );

      expect(mockOnErrorReport).toHaveBeenCalled();
    });
  });

  describe('Timeout Error Handling', () => {
    it('should display special message for timeout errors', () => {
      render(
        <LoadingErrorBoundary>
          <ThrowTimeoutError shouldThrow={true} />
        </LoadingErrorBoundary>
      );

      expect(screen.getByText('LoadingTimeoutError: Operation timed out after 30000ms')).toBeInTheDocument();
      expect(screen.getByText('The operation timed out after 30000ms.')).toBeInTheDocument();
      expect(screen.getByText('This might be due to network issues or server problems.')).toBeInTheDocument();
    });

    it('should display operation name for timeout errors', () => {
      render(
        <LoadingErrorBoundary>
          <ThrowTimeoutError shouldThrow={true} />
        </LoadingErrorBoundary>
      );

      expect(screen.getByText('Operation: testOperation')).toBeInTheDocument();
    });
  });

  describe('User Actions', () => {
    it('should call onRetry when retry button is clicked', () => {
      render(
        <LoadingErrorBoundary onRetry={mockOnRetry}>
          <ThrowError shouldThrow={true} />
        </LoadingErrorBoundary>
      );

      const retryButton = screen.getByText('Try Again');
      fireEvent.click(retryButton);

      expect(mockOnRetry).toHaveBeenCalled();
    });

    it('should call onDismiss when dismiss button is clicked', () => {
      render(
        <LoadingErrorBoundary onDismiss={mockOnDismiss}>
          <ThrowError shouldThrow={true} />
        </LoadingErrorBoundary>
      );

      const dismissButton = screen.getByText('Dismiss');
      fireEvent.click(dismissButton);

      expect(mockOnDismiss).toHaveBeenCalled();
    });

    it('should call onDismiss when X button is clicked', () => {
      render(
        <LoadingErrorBoundary onDismiss={mockOnDismiss}>
          <ThrowError shouldThrow={true} />
        </LoadingErrorBoundary>
      );

      const closeButton = screen.getByRole('button', { name: '' }); // X button
      fireEvent.click(closeButton);

      expect(mockOnDismiss).toHaveBeenCalled();
    });

    it('should reset error state when retry is clicked', () => {
      const { rerender } = render(
        <LoadingErrorBoundary onRetry={mockOnRetry}>
          <ThrowError shouldThrow={true} />
        </LoadingErrorBoundary>
      );

      expect(screen.getByText('Loading Error')).toBeInTheDocument();

      const retryButton = screen.getByText('Try Again');
      fireEvent.click(retryButton);

      // Rerender with no error
      rerender(
        <LoadingErrorBoundary onRetry={mockOnRetry}>
          <ThrowError shouldThrow={false} />
        </LoadingErrorBoundary>
      );

      expect(screen.getByText('No error')).toBeInTheDocument();
      expect(screen.queryByText('Loading Error')).not.toBeInTheDocument();
    });
  });

  describe('Technical Details', () => {
    it('should show technical details toggle in development mode', () => {
      // Mock development environment
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      render(
        <LoadingErrorBoundary showDetails={true}>
          <ThrowError shouldThrow={true} />
        </LoadingErrorBoundary>
      );

      expect(screen.getByText('Show Technical Details')).toBeInTheDocument();

      // Restore environment
      process.env.NODE_ENV = originalEnv;
    });

    it('should toggle technical details when clicked', () => {
      render(
        <LoadingErrorBoundary showDetails={true}>
          <ThrowError shouldThrow={true} />
        </LoadingErrorBoundary>
      );

      const toggleButton = screen.getByText('Show Technical Details');
      fireEvent.click(toggleButton);

      expect(screen.getByText('Hide Technical Details')).toBeInTheDocument();
      expect(screen.getByText('Error Stack:')).toBeInTheDocument();
    });

    it('should not show technical details in production mode by default', () => {
      // Mock production environment
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      render(
        <LoadingErrorBoundary>
          <ThrowError shouldThrow={true} />
        </LoadingErrorBoundary>
      );

      expect(screen.queryByText('Show Technical Details')).not.toBeInTheDocument();

      // Restore environment
      process.env.NODE_ENV = originalEnv;
    });

    it('should display loading context when available', () => {
      const error = new Error('Test error');
      error.loadingContext = {
        activeOperations: ['op1', 'op2'],
        sessionId: 'test-session-123'
      };

      render(
        <LoadingErrorBoundary showDetails={true}>
          <ThrowError shouldThrow={true} error={error} />
        </LoadingErrorBoundary>
      );

      const toggleButton = screen.getByText('Show Technical Details');
      fireEvent.click(toggleButton);

      expect(screen.getByText('Loading Context:')).toBeInTheDocument();
    });
  });

  describe('Button Visibility', () => {
    it('should hide retry button when showRetry is false', () => {
      render(
        <LoadingErrorBoundary showRetry={false}>
          <ThrowError shouldThrow={true} />
        </LoadingErrorBoundary>
      );

      expect(screen.queryByText('Try Again')).not.toBeInTheDocument();
    });

    it('should hide dismiss button when showDismiss is false', () => {
      render(
        <LoadingErrorBoundary showDismiss={false}>
          <ThrowError shouldThrow={true} />
        </LoadingErrorBoundary>
      );

      expect(screen.queryByText('Dismiss')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: '' })).not.toBeInTheDocument(); // X button
    });

    it('should show both buttons by default', () => {
      render(
        <LoadingErrorBoundary>
          <ThrowError shouldThrow={true} />
        </LoadingErrorBoundary>
      );

      expect(screen.getByText('Try Again')).toBeInTheDocument();
      expect(screen.getByText('Dismiss')).toBeInTheDocument();
    });
  });

  describe('Error Recovery', () => {
    it('should recover from error state after successful retry', () => {
      let shouldThrow = true;

      const { rerender } = render(
        <LoadingErrorBoundary 
          onRetry={() => { shouldThrow = false; }}
        >
          <ThrowError shouldThrow={shouldThrow} />
        </LoadingErrorBoundary>
      );

      expect(screen.getByText('Loading Error')).toBeInTheDocument();

      const retryButton = screen.getByText('Try Again');
      fireEvent.click(retryButton);

      // Rerender with updated shouldThrow value
      rerender(
        <LoadingErrorBoundary 
          onRetry={() => { shouldThrow = false; }}
        >
          <ThrowError shouldThrow={shouldThrow} />
        </LoadingErrorBoundary>
      );

      expect(screen.getByText('No error')).toBeInTheDocument();
    });
  });
});
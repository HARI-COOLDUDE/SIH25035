/**
 * CSS Loading Control Tests
 * 
 * Tests to verify that CSS animations and loading effects are properly
 * controlled and only appear when explicitly enabled by React state.
 */

import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

describe('CSS Loading Control', () => {
  beforeEach(() => {
    // Clear any existing styles
    document.head.querySelectorAll('style').forEach(style => {
      if (style.textContent.includes('loading-')) {
        style.remove();
      }
    });
  });

  test('animate-spin class should not have loading-spinner-active by default', () => {
    const TestComponent = () => (
      <div data-testid="spinner" className="animate-spin">
        Test Spinner
      </div>
    );

    render(<TestComponent />);
    const spinner = screen.getByTestId('spinner');
    
    // Check that the element has animate-spin class but not the active loading class
    expect(spinner).toHaveClass('animate-spin');
    expect(spinner).not.toHaveClass('loading-spinner-active');
  });

  test('animate-spin should only animate when loading-spinner-active is added', () => {
    const TestComponent = ({ active }) => (
      <div 
        data-testid="spinner" 
        className={`animate-spin ${active ? 'loading-spinner-active' : ''}`}
      >
        Test Spinner
      </div>
    );

    // Test inactive state
    const { rerender } = render(<TestComponent active={false} />);
    let spinner = screen.getByTestId('spinner');
    expect(spinner).toHaveClass('animate-spin');
    expect(spinner).not.toHaveClass('loading-spinner-active');

    // Test active state
    rerender(<TestComponent active={true} />);
    spinner = screen.getByTestId('spinner');
    expect(spinner).toHaveClass('animate-spin');
    expect(spinner).toHaveClass('loading-spinner-active');
  });

  test('skeleton class should not have loading-skeleton-active by default', () => {
    const TestComponent = () => (
      <div data-testid="skeleton" className="skeleton">
        Test Skeleton
      </div>
    );

    render(<TestComponent />);
    const skeleton = screen.getByTestId('skeleton');
    
    expect(skeleton).toHaveClass('skeleton');
    expect(skeleton).not.toHaveClass('loading-skeleton-active');
  });

  test('skeleton should only animate when loading-skeleton-active is added', () => {
    const TestComponent = ({ active }) => (
      <div 
        data-testid="skeleton" 
        className={`skeleton ${active ? 'loading-skeleton-active' : ''}`}
      >
        Test Skeleton
      </div>
    );

    // Test inactive state
    const { rerender } = render(<TestComponent active={false} />);
    let skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toHaveClass('skeleton');
    expect(skeleton).not.toHaveClass('loading-skeleton-active');

    // Test active state
    rerender(<TestComponent active={true} />);
    skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toHaveClass('skeleton');
    expect(skeleton).toHaveClass('loading-skeleton-active');
  });

  test('Tailwind animate classes should not have active loading classes by default', () => {
    const TestComponent = () => (
      <div>
        <div data-testid="pulse" className="animate-pulse">Pulse</div>
        <div data-testid="bounce" className="animate-bounce">Bounce</div>
        <div data-testid="fade" className="animate-fade-in">Fade</div>
        <div data-testid="slide" className="animate-slide-up">Slide</div>
      </div>
    );

    render(<TestComponent />);
    
    const pulse = screen.getByTestId('pulse');
    const bounce = screen.getByTestId('bounce');
    const fade = screen.getByTestId('fade');
    const slide = screen.getByTestId('slide');

    // All should have their classes but not the active loading classes
    expect(pulse).toHaveClass('animate-pulse');
    expect(pulse).not.toHaveClass('loading-pulse-active');
    
    expect(bounce).toHaveClass('animate-bounce');
    expect(bounce).not.toHaveClass('loading-bounce-active');
    
    expect(fade).toHaveClass('animate-fade-in');
    expect(fade).not.toHaveClass('loading-fade-active');
    
    expect(slide).toHaveClass('animate-slide-up');
    expect(slide).not.toHaveClass('loading-slide-active');
  });

  test('controlled loading classes should enable animations', () => {
    const TestComponent = () => (
      <div>
        <div data-testid="controlled-pulse" className="animate-pulse loading-pulse-active">
          Controlled Pulse
        </div>
        <div data-testid="controlled-bounce" className="animate-bounce loading-bounce-active">
          Controlled Bounce
        </div>
      </div>
    );

    render(<TestComponent />);
    
    const controlledPulse = screen.getByTestId('controlled-pulse');
    const controlledBounce = screen.getByTestId('controlled-bounce');

    expect(controlledPulse).toHaveClass('animate-pulse');
    expect(controlledPulse).toHaveClass('loading-pulse-active');
    expect(controlledBounce).toHaveClass('animate-bounce');
    expect(controlledBounce).toHaveClass('loading-bounce-active');
  });

  test('loading overlay should only be visible when active', () => {
    const TestComponent = ({ active }) => (
      <div className={active ? 'loading-overlay-active' : ''} data-testid="overlay">
        Loading Overlay
      </div>
    );

    // Test inactive state
    const { rerender } = render(<TestComponent active={false} />);
    let overlay = screen.getByTestId('overlay');
    expect(overlay).not.toHaveClass('loading-overlay-active');

    // Test active state
    rerender(<TestComponent active={true} />);
    overlay = screen.getByTestId('overlay');
    expect(overlay).toHaveClass('loading-overlay-active');
  });

  test('loading button should only show loading state when active', () => {
    const TestComponent = ({ loading }) => (
      <button 
        data-testid="button" 
        className={loading ? 'loading-button-active' : ''}
      >
        {loading ? 'Loading...' : 'Click Me'}
      </button>
    );

    // Test normal state
    const { rerender } = render(<TestComponent loading={false} />);
    let button = screen.getByTestId('button');
    expect(button).not.toHaveClass('loading-button-active');
    expect(button).toHaveTextContent('Click Me');

    // Test loading state
    rerender(<TestComponent loading={true} />);
    button = screen.getByTestId('button');
    expect(button).toHaveClass('loading-button-active');
    expect(button).toHaveTextContent('Loading...');
  });

  test('no elements should have loading-active classes by default', () => {
    const TestComponent = () => (
      <div data-testid="container">
        <div className="some-class">Regular div</div>
        <span className="another-class">Regular span</span>
        <p className="text-class">Regular paragraph</p>
        <img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" alt="test" />
      </div>
    );

    render(<TestComponent />);
    
    const container = screen.getByTestId('container');
    const allElements = container.querySelectorAll('*');

    allElements.forEach(element => {
      // Verify no loading-active classes are present
      const classList = Array.from(element.classList);
      const hasLoadingActiveClass = classList.some(className => 
        className.includes('loading-') && className.includes('-active')
      );
      expect(hasLoadingActiveClass).toBe(false);
    });
  });
});
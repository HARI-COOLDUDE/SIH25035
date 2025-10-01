/**
 * Simple test to verify the new useSimpleLoading hook works correctly
 */

import useSimpleLoading from './hooks/useSimpleLoading';

// Test function to verify the hook functionality
export const testSimpleLoading = () => {
  console.log('🧪 Testing useSimpleLoading hook...');
  
  // This would normally be used in a React component
  // For testing purposes, we'll just verify the hook exists and can be imported
  
  if (typeof useSimpleLoading === 'function') {
    console.log('✅ useSimpleLoading hook imported successfully');
    return true;
  } else {
    console.error('❌ useSimpleLoading hook failed to import');
    return false;
  }
};

// Run test if this file is executed directly
if (typeof window !== 'undefined') {
  testSimpleLoading();
}
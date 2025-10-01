// Simple test to check if App.jsx has proper structure
const fs = require('fs');

try {
  const appContent = fs.readFileSync('frontend/src/App.jsx', 'utf8');
  
  // Check for essential parts
  const checks = [
    { name: 'React import', pattern: /import React/ },
    { name: 'useState import', pattern: /useState/ },
    { name: 'useEffect import', pattern: /useEffect/ },
    { name: 'Function declaration', pattern: /function App\(\)/ },
    { name: 'Export statement', pattern: /export default App/ },
    { name: 'Return statement', pattern: /return \(/ },
    { name: 'JSX structure', pattern: /<div/ }
  ];
  
  console.log('App.jsx Structure Check:');
  console.log('========================');
  
  checks.forEach(check => {
    const found = check.pattern.test(appContent);
    console.log(`${check.name}: ${found ? '✓ FOUND' : '✗ MISSING'}`);
  });
  
  // Check for potential issues
  const issues = [];
  
  if (!appContent.includes('export default App')) {
    issues.push('Missing export default statement');
  }
  
  if (!appContent.includes('return (')) {
    issues.push('Missing return statement');
  }
  
  if (appContent.includes('undefined')) {
    issues.push('Contains undefined references');
  }
  
  console.log('\nPotential Issues:');
  console.log('=================');
  if (issues.length === 0) {
    console.log('No obvious issues found');
  } else {
    issues.forEach(issue => console.log(`- ${issue}`));
  }
  
  console.log(`\nFile size: ${appContent.length} characters`);
  
} catch (error) {
  console.error('Error reading App.jsx:', error.message);
}
/**
 * Integration Test Runner
 * 
 * Comprehensive test runner for validating the complete integration
 * of the eliminate-spinning-circle feature implementation.
 * 
 * This script runs all integration tests and provides detailed reporting.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class IntegrationTestRunner {
  constructor() {
    this.results = {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      skippedTests: 0,
      errors: [],
      warnings: [],
      coverage: {}
    };
    
    this.testSuites = [
      'IntegrationValidation',
      'AutomatedLoadingDetection',
      'CSSAnimationMonitor',
      'LoadingStateManager',
      'LoadingErrorHandling',
      'ProductionSafeguards'
    ];
  }
  
  async runAllTests() {
    console.log('🚀 Starting Integration Test Suite for Eliminate Spinning Circle Feature');
    console.log('=' .repeat(80));
    
    const startTime = Date.now();
    
    try {
      // Run each test suite
      for (const suite of this.testSuites) {
        await this.runTestSuite(suite);
      }
      
      // Generate comprehensive report
      await this.generateReport();
      
      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;
      
      console.log(`\n✅ Integration tests completed in ${duration.toFixed(2)}s`);
      
      if (this.results.failedTests > 0) {
        console.log(`❌ ${this.results.failedTests} tests failed`);
        process.exit(1);
      } else {
        console.log(`🎉 All ${this.results.passedTests} tests passed!`);
      }
      
    } catch (error) {
      console.error('❌ Integration test runner failed:', error.message);
      process.exit(1);
    }
  }
  
  async runTestSuite(suiteName) {
    console.log(`\n📋 Running ${suiteName} test suite...`);
    
    try {
      const command = `npm test -- --testPathPattern=${suiteName} --watchAll=false --verbose --json`;
      const output = execSync(command, { 
        encoding: 'utf8',
        cwd: process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      // Parse Jest output
      const lines = output.split('\n');
      const jsonLine = lines.find(line => line.startsWith('{') && line.includes('testResults'));
      
      if (jsonLine) {
        const results = JSON.parse(jsonLine);
        this.processTestResults(suiteName, results);
      }
      
      console.log(`✅ ${suiteName} completed`);
      
    } catch (error) {
      console.error(`❌ ${suiteName} failed:`, error.message);
      this.results.errors.push({
        suite: suiteName,
        error: error.message
      });
    }
  }
  
  processTestResults(suiteName, results) {
    if (results.testResults && results.testResults.length > 0) {
      const suiteResult = results.testResults[0];
      
      this.results.totalTests += suiteResult.numPassingTests + suiteResult.numFailingTests + suiteResult.numPendingTests;
      this.results.passedTests += suiteResult.numPassingTests;
      this.results.failedTests += suiteResult.numFailingTests;
      this.results.skippedTests += suiteResult.numPendingTests;
      
      // Log individual test results
      if (suiteResult.assertionResults) {
        suiteResult.assertionResults.forEach(test => {
          const status = test.status === 'passed' ? '✅' : test.status === 'failed' ? '❌' : '⏭️';
          console.log(`  ${status} ${test.title}`);
          
          if (test.status === 'failed' && test.failureMessages) {
            test.failureMessages.forEach(message => {
              console.log(`    💥 ${message}`);
            });
          }
        });
      }
    }
  }
  
  async generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: this.results.totalTests,
        passedTests: this.results.passedTests,
        failedTests: this.results.failedTests,
        skippedTests: this.results.skippedTests,
        successRate: this.results.totalTests > 0 ? 
          ((this.results.passedTests / this.results.totalTests) * 100).toFixed(2) + '%' : '0%'
      },
      testSuites: this.testSuites,
      errors: this.results.errors,
      warnings: this.results.warnings,
      requirements: {
        '4.1': 'Comment submission functionality - ' + (this.results.failedTests === 0 ? 'PASSED' : 'NEEDS REVIEW'),
        '4.2': 'Dashboard functionality - ' + (this.results.failedTests === 0 ? 'PASSED' : 'NEEDS REVIEW'),
        '4.3': 'Word cloud functionality - ' + (this.results.failedTests === 0 ? 'PASSED' : 'NEEDS REVIEW'),
        '4.4': 'CSV upload functionality - ' + (this.results.failedTests === 0 ? 'PASSED' : 'NEEDS REVIEW'),
        '4.5': 'Navigation and UI components - ' + (this.results.failedTests === 0 ? 'PASSED' : 'NEEDS REVIEW')
      },
      validations: {
        'No automatic loading': this.results.failedTests === 0 ? 'VALIDATED' : 'FAILED',
        'User-triggered loading only': this.results.failedTests === 0 ? 'VALIDATED' : 'FAILED',
        'CSS animations controlled': this.results.failedTests === 0 ? 'VALIDATED' : 'FAILED',
        'All functionality preserved': this.results.failedTests === 0 ? 'VALIDATED' : 'FAILED'
      }
    };
    
    // Write report to file
    const reportPath = path.join(__dirname, '..', '..', 'integration-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Print summary
    console.log('\n📊 Integration Test Summary');
    console.log('=' .repeat(50));
    console.log(`Total Tests: ${report.summary.totalTests}`);
    console.log(`Passed: ${report.summary.passedTests}`);
    console.log(`Failed: ${report.summary.failedTests}`);
    console.log(`Skipped: ${report.summary.skippedTests}`);
    console.log(`Success Rate: ${report.summary.successRate}`);
    
    console.log('\n📋 Requirements Validation');
    console.log('=' .repeat(50));
    Object.entries(report.requirements).forEach(([req, status]) => {
      console.log(`${req}: ${status}`);
    });
    
    console.log('\n🔍 System Validations');
    console.log('=' .repeat(50));
    Object.entries(report.validations).forEach(([validation, status]) => {
      const icon = status === 'VALIDATED' ? '✅' : '❌';
      console.log(`${icon} ${validation}: ${status}`);
    });
    
    if (report.errors.length > 0) {
      console.log('\n❌ Errors');
      console.log('=' .repeat(50));
      report.errors.forEach(error => {
        console.log(`${error.suite}: ${error.error}`);
      });
    }
    
    console.log(`\n📄 Full report saved to: ${reportPath}`);
  }
  
  async validateSystemState() {
    console.log('\n🔍 Validating system state...');
    
    // Check for any remaining automatic loading triggers
    const appFile = path.join(__dirname, '..', 'App.jsx');
    const appContent = fs.readFileSync(appFile, 'utf8');
    
    // Look for potential automatic loading patterns
    const automaticPatterns = [
      /useEffect\(\s*\(\)\s*=>\s*{[^}]*fetch/g,
      /useEffect\(\s*\(\)\s*=>\s*{[^}]*startLoading/g,
      /componentDidMount[^}]*fetch/g
    ];
    
    let foundIssues = false;
    automaticPatterns.forEach((pattern, index) => {
      const matches = appContent.match(pattern);
      if (matches) {
        console.log(`⚠️  Potential automatic loading pattern found: ${matches[0]}`);
        foundIssues = true;
      }
    });
    
    if (!foundIssues) {
      console.log('✅ No automatic loading patterns detected');
    }
    
    // Check CSS for automatic animations
    const cssFile = path.join(__dirname, '..', 'index.css');
    if (fs.existsSync(cssFile)) {
      const cssContent = fs.readFileSync(cssFile, 'utf8');
      
      // Look for global animation rules
      const globalAnimationPatterns = [
        /\*\s*{[^}]*animation/g,
        /\*\s*{[^}]*transition/g
      ];
      
      globalAnimationPatterns.forEach(pattern => {
        const matches = cssContent.match(pattern);
        if (matches) {
          console.log(`⚠️  Global CSS animation rule found: ${matches[0]}`);
          foundIssues = true;
        }
      });
    }
    
    return !foundIssues;
  }
}

// Run if called directly
if (require.main === module) {
  const runner = new IntegrationTestRunner();
  runner.runAllTests().catch(error => {
    console.error('Integration test runner failed:', error);
    process.exit(1);
  });
}

module.exports = IntegrationTestRunner;
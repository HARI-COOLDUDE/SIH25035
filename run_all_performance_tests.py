#!/usr/bin/env python3
"""
Complete Performance Test Suite Runner
Executes all performance tests and generates final validation report
"""

import subprocess
import sys
import os
import json
import time
from pathlib import Path
from datetime import datetime

class CompletePerformanceTestRunner:
    def __init__(self):
        self.results = {
            'backend_tests': None,
            'frontend_tests': None,
            'integration_tests': None,
            'validation_tests': None
        }
        self.start_time = datetime.now()
    
    def run_backend_performance_tests(self):
        """Run comprehensive backend performance tests"""
        print("="*80)
        print("RUNNING BACKEND PERFORMANCE TESTS")
        print("="*80)
        
        try:
            result = subprocess.run([
                sys.executable, "comprehensive_performance_test.py"
            ], capture_output=True, text=True, timeout=600)
            
            print(result.stdout)
            if result.stderr:
                print("STDERR:", result.stderr)
            
            # Try to load the generated report
            report_files = list(Path(".").glob("performance_test_report_*.json"))
            if report_files:
                latest_report = max(report_files, key=os.path.getctime)
                with open(latest_report, 'r') as f:
                    report_data = json.load(f)
                    self.results['backend_tests'] = {
                        'success': result.returncode == 0,
                        'report_file': str(latest_report),
                        'summary': report_data.get('summary', {}),
                        'requirements_status': report_data.get('summary', {}).get('requirements_status', {})
                    }
            else:
                self.results['backend_tests'] = {
                    'success': result.returncode == 0,
                    'report_file': None,
                    'summary': {},
                    'requirements_status': {}
                }
            
            return result.returncode == 0
            
        except subprocess.TimeoutExpired:
            print("❌ Backend performance tests timed out!")
            self.results['backend_tests'] = {'success': False, 'error': 'timeout'}
            return False
        except Exception as e:
            print(f"❌ Error running backend tests: {e}")
            self.results['backend_tests'] = {'success': False, 'error': str(e)}
            return False
    
    def run_frontend_performance_tests(self):
        """Run frontend performance tests"""
        print("\n" + "="*80)
        print("RUNNING FRONTEND PERFORMANCE TESTS")
        print("="*80)
        
        frontend_dir = Path("frontend")
        if not frontend_dir.exists():
            print("❌ Frontend directory not found!")
            self.results['frontend_tests'] = {'success': False, 'error': 'frontend directory not found'}
            return False
        
        try:
            os.chdir(frontend_dir)
            
            # Check if test file exists
            test_file = Path("src/tests/PerformanceTest.js")
            if not test_file.exists():
                print("❌ Frontend performance test file not found!")
                self.results['frontend_tests'] = {'success': False, 'error': 'test file not found'}
                return False
            
            # Run Jest tests for performance
            result = subprocess.run([
                "npm", "test", "--", "--testPathPattern=PerformanceTest", "--watchAll=false", "--verbose"
            ], capture_output=True, text=True, timeout=300)
            
            os.chdir("..")
            
            print(result.stdout)
            if result.stderr:
                print("STDERR:", result.stderr)
            
            # Parse test results
            success = result.returncode == 0
            test_output = result.stdout
            
            # Count passed/failed tests
            passed_count = test_output.count('✓') if '✓' in test_output else 0
            failed_count = test_output.count('✕') if '✕' in test_output else 0
            
            self.results['frontend_tests'] = {
                'success': success,
                'passed_tests': passed_count,
                'failed_tests': failed_count,
                'output': test_output
            }
            
            return success
            
        except subprocess.TimeoutExpired:
            print("❌ Frontend performance tests timed out!")
            self.results['frontend_tests'] = {'success': False, 'error': 'timeout'}
            return False
        except Exception as e:
            print(f"❌ Error running frontend tests: {e}")
            self.results['frontend_tests'] = {'success': False, 'error': str(e)}
            return False
        finally:
            # Make sure we're back in the root directory
            if os.getcwd().endswith("frontend"):
                os.chdir("..")
    
    def run_integration_performance_tests(self):
        """Run integration performance tests"""
        print("\n" + "="*80)
        print("RUNNING INTEGRATION PERFORMANCE TESTS")
        print("="*80)
        
        try:
            result = subprocess.run([
                sys.executable, "test_integration_performance.py"
            ], capture_output=True, text=True, timeout=600)
            
            print(result.stdout)
            if result.stderr:
                print("STDERR:", result.stderr)
            
            self.results['integration_tests'] = {
                'success': result.returncode == 0,
                'output': result.stdout
            }
            
            return result.returncode == 0
            
        except subprocess.TimeoutExpired:
            print("❌ Integration performance tests timed out!")
            self.results['integration_tests'] = {'success': False, 'error': 'timeout'}
            return False
        except Exception as e:
            print(f"❌ Error running integration tests: {e}")
            self.results['integration_tests'] = {'success': False, 'error': str(e)}
            return False
    
    def run_validation_tests(self):
        """Run quick validation tests"""
        print("\n" + "="*80)
        print("RUNNING VALIDATION TESTS")
        print("="*80)
        
        try:
            result = subprocess.run([
                sys.executable, "validate_performance_requirements.py"
            ], capture_output=True, text=True, timeout=300)
            
            print(result.stdout)
            if result.stderr:
                print("STDERR:", result.stderr)
            
            self.results['validation_tests'] = {
                'success': result.returncode == 0,
                'output': result.stdout
            }
            
            return result.returncode == 0
            
        except subprocess.TimeoutExpired:
            print("❌ Validation tests timed out!")
            self.results['validation_tests'] = {'success': False, 'error': 'timeout'}
            return False
        except Exception as e:
            print(f"❌ Error running validation tests: {e}")
            self.results['validation_tests'] = {'success': False, 'error': str(e)}
            return False
    
    def generate_final_report(self):
        """Generate final comprehensive performance report"""
        print("\n" + "="*100)
        print("FINAL PERFORMANCE TEST REPORT")
        print("="*100)
        
        end_time = datetime.now()
        total_duration = (end_time - self.start_time).total_seconds()
        
        print(f"Test Suite Execution Time: {total_duration:.1f} seconds")
        print(f"Started: {self.start_time.strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"Completed: {end_time.strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Test suite results
        print(f"\nTest Suite Results:")
        test_suites = [
            ('Backend Performance Tests', self.results['backend_tests']),
            ('Frontend Performance Tests', self.results['frontend_tests']),
            ('Integration Performance Tests', self.results['integration_tests']),
            ('Validation Tests', self.results['validation_tests'])
        ]
        
        successful_suites = 0
        for suite_name, suite_result in test_suites:
            if suite_result and suite_result.get('success', False):
                print(f"  ✅ {suite_name}")
                successful_suites += 1
            else:
                error_info = ""
                if suite_result and 'error' in suite_result:
                    error_info = f" ({suite_result['error']})"
                print(f"  ❌ {suite_name}{error_info}")
        
        print(f"\nOverall Success Rate: {successful_suites}/{len(test_suites)} ({successful_suites/len(test_suites)*100:.1f}%)")
        
        # Performance requirements status
        print(f"\nPerformance Requirements Status:")
        
        # Extract requirements status from backend tests
        backend_reqs = {}
        if self.results['backend_tests'] and 'requirements_status' in self.results['backend_tests']:
            backend_reqs = self.results['backend_tests']['requirements_status']
        
        requirements = [
            ("Comment processing < 2 seconds (Req 1.2)", backend_reqs.get("Comment processing < 2 seconds (Req 1.2)", False)),
            ("Dashboard loading < 3 seconds (Req 3.2)", backend_reqs.get("Dashboard loading < 3 seconds (Req 3.2)", False)),
            ("Word cloud generation < 10 seconds (Req 3.3)", backend_reqs.get("Word cloud generation < 10 seconds (Req 3.3)", False)),
            ("CSV upload with progress (Req 3.4)", backend_reqs.get("CSV upload with progress (Req 3.4)", False))
        ]
        
        met_requirements = 0
        for req_name, req_status in requirements:
            status_icon = "✅" if req_status else "❌"
            print(f"  {status_icon} {req_name}")
            if req_status:
                met_requirements += 1
        
        print(f"\nRequirements Met: {met_requirements}/{len(requirements)} ({met_requirements/len(requirements)*100:.1f}%)")
        
        # Performance insights and recommendations
        print(f"\nPerformance Insights:")
        if self.results['backend_tests'] and 'summary' in self.results['backend_tests']:
            summary = self.results['backend_tests']['summary']
            if 'passed_tests' in summary and 'total_tests' in summary:
                print(f"  Backend test success rate: {summary['passed_tests']}/{summary['total_tests']} ({summary.get('success_rate', 0)*100:.1f}%)")
        
        if self.results['frontend_tests']:
            ft = self.results['frontend_tests']
            if 'passed_tests' in ft and 'failed_tests' in ft:
                total_ft = ft['passed_tests'] + ft['failed_tests']
                if total_ft > 0:
                    print(f"  Frontend test success rate: {ft['passed_tests']}/{total_ft} ({ft['passed_tests']/total_ft*100:.1f}%)")
        
        print(f"\nRecommendations:")
        if met_requirements < len(requirements):
            print("  🔧 Performance optimization needed:")
            if not backend_reqs.get("Comment processing < 2 seconds (Req 1.2)", False):
                print("     - Optimize AI model processing or add more aggressive caching")
            if not backend_reqs.get("Dashboard loading < 3 seconds (Req 3.2)", False):
                print("     - Optimize database queries and API response times")
            if not backend_reqs.get("Word cloud generation < 10 seconds (Req 3.3)", False):
                print("     - Optimize word cloud generation algorithm")
            if not backend_reqs.get("CSV upload with progress (Req 3.4)", False):
                print("     - Implement proper progress indicators for CSV uploads")
        else:
            print("  🎉 All performance requirements are met!")
        
        # Save comprehensive report
        final_report = {
            'execution_info': {
                'start_time': self.start_time.isoformat(),
                'end_time': end_time.isoformat(),
                'duration_seconds': total_duration
            },
            'test_suites': {
                'backend_tests': self.results['backend_tests'],
                'frontend_tests': self.results['frontend_tests'],
                'integration_tests': self.results['integration_tests'],
                'validation_tests': self.results['validation_tests']
            },
            'summary': {
                'successful_suites': successful_suites,
                'total_suites': len(test_suites),
                'suite_success_rate': successful_suites / len(test_suites),
                'requirements_met': met_requirements,
                'total_requirements': len(requirements),
                'requirements_success_rate': met_requirements / len(requirements)
            },
            'requirements_status': dict(requirements)
        }
        
        report_filename = f"final_performance_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(report_filename, 'w') as f:
            json.dump(final_report, f, indent=2)
        
        print(f"\nFinal comprehensive report saved to: {report_filename}")
        
        # Return overall success
        return met_requirements == len(requirements) and successful_suites >= 3
    
    def run_all_tests(self):
        """Run complete performance test suite"""
        print("Starting Complete Performance Test Suite")
        print("="*100)
        
        # Run all test suites
        backend_success = self.run_backend_performance_tests()
        frontend_success = self.run_frontend_performance_tests()
        integration_success = self.run_integration_performance_tests()
        validation_success = self.run_validation_tests()
        
        # Generate final report
        overall_success = self.generate_final_report()
        
        return overall_success

def main():
    """Main entry point"""
    runner = CompletePerformanceTestRunner()
    success = runner.run_all_tests()
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
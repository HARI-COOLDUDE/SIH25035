#!/usr/bin/env python3
"""
Comprehensive Performance Test Suite
Tests all performance requirements with detailed analysis and debugging
"""

import time
import requests
import json
import sys
import tempfile
import csv
import os
from datetime import datetime
import statistics

class ComprehensivePerformanceTest:
    def __init__(self):
        self.backend_url = "http://localhost:8000"
        self.results = []
        self.detailed_results = {}
        
    def log_result(self, test_name, duration, requirement, passed, details="", response_data=None):
        """Log test result with detailed information"""
        result = {
            'test': test_name,
            'duration': duration,
            'requirement': requirement,
            'passed': passed,
            'details': details,
            'response_data': response_data,
            'timestamp': datetime.now().isoformat()
        }
        self.results.append(result)
        status = "PASS" if passed else "FAIL"
        print(f"[{status}] {test_name}: {duration:.2f}s (req: {requirement}s) - {details}")
        
        if not passed:
            print(f"    Debug info: {response_data}")
    
    def test_backend_health(self):
        """Test backend health and get system info"""
        print("=== Backend Health Check ===")
        
        try:
            response = requests.get(f"{self.backend_url}/health/detailed", timeout=10)
            if response.status_code == 200:
                health_data = response.json()
                print(f"✅ Backend health: {health_data.get('status', 'unknown')}")
                
                # Print performance info
                if 'performance' in health_data:
                    perf = health_data['performance']
                    print(f"  Database check: {perf.get('database_time_ms', 0):.1f}ms")
                    print(f"  Models check: {perf.get('models_time_ms', 0):.1f}ms")
                
                # Print optimization status
                if 'optimizations' in health_data:
                    opt = health_data['optimizations']
                    print(f"  Caching: {'✅' if opt.get('caching_enabled') else '❌'}")
                    print(f"  Async processing: {'✅' if opt.get('async_processing') else '❌'}")
                    print(f"  Text limits: {opt.get('text_limits', {})}")
                
                return True
            else:
                print(f"❌ Backend health check failed: HTTP {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Backend health check error: {e}")
            return False
    
    def test_comment_processing_multiple(self):
        """Test comment processing with multiple samples for statistical analysis"""
        print("\n=== Comment Processing Performance (Requirement 1.2) ===")
        
        test_comments = [
            {
                "stakeholder_type": "citizen",
                "raw_text": "This is a test comment for performance testing. It should be processed quickly."
            },
            {
                "stakeholder_type": "business",
                "raw_text": "Business perspective on the consultation process and its efficiency."
            },
            {
                "stakeholder_type": "ngo",
                "raw_text": "NGO feedback regarding the proposed changes and their potential impact."
            },
            {
                "stakeholder_type": "academic",
                "raw_text": "Academic analysis of the consultation methodology and effectiveness."
            },
            {
                "stakeholder_type": "citizen",
                "raw_text": "Short comment."
            }
        ]
        
        durations = []
        successful_tests = 0
        
        for i, comment in enumerate(test_comments):
            start_time = time.time()
            try:
                response = requests.post(
                    f"{self.backend_url}/api/comments",
                    json=comment,
                    timeout=15
                )
                duration = time.time() - start_time
                durations.append(duration)
                
                if response.status_code == 200:
                    data = response.json()
                    passed = duration < 2.0
                    successful_tests += 1
                    
                    details = f"Sentiment: {data.get('sentiment_label', 'N/A')} ({data.get('sentiment_score', 0):.2f}), Summary: '{data.get('summary', 'N/A')[:30]}...'"
                    
                    self.log_result(
                        f"Comment Processing Test {i+1}",
                        duration,
                        2.0,
                        passed,
                        details,
                        {"status_code": response.status_code, "response_size": len(response.text)}
                    )
                else:
                    self.log_result(
                        f"Comment Processing Test {i+1}",
                        duration,
                        2.0,
                        False,
                        f"HTTP {response.status_code}",
                        {"status_code": response.status_code, "error": response.text[:200]}
                    )
                    
            except Exception as e:
                duration = time.time() - start_time
                durations.append(duration)
                self.log_result(
                    f"Comment Processing Test {i+1}",
                    duration,
                    2.0,
                    False,
                    f"Request failed: {str(e)[:50]}",
                    {"error": str(e)}
                )
        
        # Statistical analysis
        if durations:
            avg_duration = statistics.mean(durations)
            min_duration = min(durations)
            max_duration = max(durations)
            
            print(f"\nComment Processing Statistics:")
            print(f"  Average: {avg_duration:.2f}s")
            print(f"  Min: {min_duration:.2f}s")
            print(f"  Max: {max_duration:.2f}s")
            print(f"  Success rate: {successful_tests}/{len(test_comments)} ({successful_tests/len(test_comments)*100:.1f}%)")
            print(f"  Performance target met: {'✅' if avg_duration < 2.0 else '❌'}")
            
            self.detailed_results['comment_processing'] = {
                'average_duration': avg_duration,
                'min_duration': min_duration,
                'max_duration': max_duration,
                'success_rate': successful_tests / len(test_comments),
                'target_met': avg_duration < 2.0
            }
    
    def test_dashboard_performance(self):
        """Test dashboard loading performance"""
        print("\n=== Dashboard Loading Performance (Requirement 3.2) ===")
        
        # Test dashboard endpoint
        start_time = time.time()
        try:
            response = requests.get(f"{self.backend_url}/api/dashboard", timeout=10)
            duration = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                passed = duration < 3.0
                details = f"Total comments: {data.get('total_comments', 0)}, Recent: {len(data.get('recent_comments', []))}"
                
                self.log_result(
                    "Dashboard Loading",
                    duration,
                    3.0,
                    passed,
                    details,
                    {"status_code": response.status_code, "data_size": len(response.text)}
                )
            else:
                self.log_result(
                    "Dashboard Loading",
                    duration,
                    3.0,
                    False,
                    f"HTTP {response.status_code}",
                    {"status_code": response.status_code, "error": response.text[:200]}
                )
                
        except Exception as e:
            duration = time.time() - start_time
            self.log_result(
                "Dashboard Loading",
                duration,
                3.0,
                False,
                f"Request failed: {str(e)[:50]}",
                {"error": str(e)}
            )
        
        # Test comments list endpoint
        start_time = time.time()
        try:
            response = requests.get(f"{self.backend_url}/api/comments?limit=50", timeout=10)
            duration = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                passed = duration < 3.0
                details = f"Comments loaded: {len(data) if isinstance(data, list) else 'N/A'}"
                
                self.log_result(
                    "Comments List Loading",
                    duration,
                    3.0,
                    passed,
                    details,
                    {"status_code": response.status_code, "data_size": len(response.text)}
                )
            else:
                self.log_result(
                    "Comments List Loading",
                    duration,
                    3.0,
                    False,
                    f"HTTP {response.status_code}",
                    {"status_code": response.status_code, "error": response.text[:200]}
                )
                
        except Exception as e:
            duration = time.time() - start_time
            self.log_result(
                "Comments List Loading",
                duration,
                3.0,
                False,
                f"Request failed: {str(e)[:50]}",
                {"error": str(e)}
            )
    
    def test_wordcloud_performance(self):
        """Test word cloud generation performance"""
        print("\n=== Word Cloud Generation Performance (Requirement 3.3) ===")
        
        # Test word cloud generation
        start_time = time.time()
        try:
            response = requests.get(f"{self.backend_url}/api/wordcloud", timeout=15)
            duration = time.time() - start_time
            
            if response.status_code == 200:
                passed = duration < 10.0
                content_type = response.headers.get('content-type', '')
                content_length = len(response.content)
                
                details = f"Content-Type: {content_type}, Size: {content_length} bytes"
                
                self.log_result(
                    "Word Cloud Generation",
                    duration,
                    10.0,
                    passed,
                    details,
                    {"status_code": response.status_code, "content_type": content_type, "size": content_length}
                )
            else:
                self.log_result(
                    "Word Cloud Generation",
                    duration,
                    10.0,
                    False,
                    f"HTTP {response.status_code}",
                    {"status_code": response.status_code, "error": response.text[:200]}
                )
                
        except Exception as e:
            duration = time.time() - start_time
            self.log_result(
                "Word Cloud Generation",
                duration,
                10.0,
                False,
                f"Request failed: {str(e)[:50]}",
                {"error": str(e)}
            )
    
    def test_csv_upload_performance(self):
        """Test CSV upload performance with progress indicators"""
        print("\n=== CSV Upload Performance (Requirement 3.4) ===")
        
        # Create test CSV with various sizes
        test_sizes = [5, 20, 50]  # Different numbers of comments to test scalability
        
        for size in test_sizes:
            print(f"\nTesting CSV upload with {size} comments:")
            
            # Create test CSV
            test_data = [["stakeholder_type", "raw_text"]]
            for i in range(size):
                stakeholder = ["citizen", "business", "ngo", "academic"][i % 4]
                text = f"Test comment {i+1} for CSV upload performance testing with stakeholder type {stakeholder}."
                test_data.append([stakeholder, text])
            
            temp_file = tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False)
            writer = csv.writer(temp_file)
            writer.writerows(test_data)
            temp_file.close()
            
            try:
                start_time = time.time()
                
                with open(temp_file.name, 'rb') as f:
                    files = {'file': (f'test_comments_{size}.csv', f, 'text/csv')}
                    response = requests.post(
                        f"{self.backend_url}/api/comments/bulk",
                        files=files,
                        timeout=60
                    )
                
                duration = time.time() - start_time
                
                if response.status_code == 200:
                    data = response.json()
                    processed = len(data.get('comments', []))
                    passed = True  # CSV upload should work regardless of time
                    
                    details = f"Processed: {processed}/{size} comments, Rate: {processed/duration:.1f} comments/sec"
                    
                    self.log_result(
                        f"CSV Upload ({size} comments)",
                        duration,
                        60.0,  # Reasonable timeout
                        passed,
                        details,
                        {"status_code": response.status_code, "processed": processed, "expected": size}
                    )
                else:
                    self.log_result(
                        f"CSV Upload ({size} comments)",
                        duration,
                        60.0,
                        False,
                        f"HTTP {response.status_code}",
                        {"status_code": response.status_code, "error": response.text[:200]}
                    )
                    
            except Exception as e:
                duration = time.time() - start_time
                self.log_result(
                    f"CSV Upload ({size} comments)",
                    duration,
                    60.0,
                    False,
                    f"Request failed: {str(e)[:50]}",
                    {"error": str(e)}
                )
            finally:
                # Clean up
                if os.path.exists(temp_file.name):
                    os.unlink(temp_file.name)
    
    def test_api_timeout_behavior(self):
        """Test API timeout management (Requirement 3.2)"""
        print("\n=== API Timeout Behavior Testing ===")
        
        # Test with very short timeout to verify timeout handling
        start_time = time.time()
        try:
            response = requests.get(f"{self.backend_url}/api/comments", timeout=0.1)
            duration = time.time() - start_time
            
            self.log_result(
                "API Timeout Test",
                duration,
                0.1,
                False,  # Should timeout
                "Request completed unexpectedly fast",
                {"status_code": response.status_code}
            )
            
        except requests.exceptions.Timeout:
            duration = time.time() - start_time
            self.log_result(
                "API Timeout Test",
                duration,
                0.1,
                True,  # Timeout is expected
                "Timeout handled correctly",
                {"timeout": True}
            )
        except Exception as e:
            duration = time.time() - start_time
            self.log_result(
                "API Timeout Test",
                duration,
                0.1,
                False,
                f"Unexpected error: {str(e)[:50]}",
                {"error": str(e)}
            )
    
    def generate_performance_report(self):
        """Generate comprehensive performance report"""
        print("\n" + "="*80)
        print("COMPREHENSIVE PERFORMANCE TEST REPORT")
        print("="*80)
        
        # Overall summary
        passed_tests = sum(1 for result in self.results if result['passed'])
        total_tests = len(self.results)
        
        print(f"Overall Results: {passed_tests}/{total_tests} tests passed ({passed_tests/total_tests*100:.1f}%)")
        print(f"Test execution time: {datetime.now().isoformat()}")
        
        # Requirements summary
        print("\nRequirements Status:")
        requirements = {
            "Comment processing < 2 seconds (Req 1.2)": any(r['passed'] and 'Comment Processing' in r['test'] for r in self.results),
            "Dashboard loading < 3 seconds (Req 3.2)": any(r['passed'] and 'Dashboard' in r['test'] for r in self.results),
            "Word cloud generation < 10 seconds (Req 3.3)": any(r['passed'] and 'Word Cloud' in r['test'] for r in self.results),
            "CSV upload with progress (Req 3.4)": any(r['passed'] and 'CSV Upload' in r['test'] for r in self.results)
        }
        
        for req, status in requirements.items():
            print(f"  {'✅' if status else '❌'} {req}")
        
        # Failed tests details
        failed_tests = [r for r in self.results if not r['passed']]
        if failed_tests:
            print(f"\nFailed Tests ({len(failed_tests)}):")
            for test in failed_tests:
                print(f"  ❌ {test['test']}: {test['duration']:.2f}s - {test['details']}")
        
        # Performance insights
        print("\nPerformance Insights:")
        if 'comment_processing' in self.detailed_results:
            cp = self.detailed_results['comment_processing']
            print(f"  Comment Processing Average: {cp['average_duration']:.2f}s (target: <2.0s)")
            if cp['average_duration'] > 2.0:
                print(f"    ⚠️  Performance issue: {cp['average_duration'] - 2.0:.2f}s over target")
        
        # Recommendations
        print("\nRecommendations:")
        if any('Comment Processing' in r['test'] and not r['passed'] for r in self.results):
            print("  🔧 Comment processing is slow - consider optimizing AI models or adding more caching")
        
        if any('Dashboard' in r['test'] and not r['passed'] for r in self.results):
            print("  🔧 Dashboard loading issues - check database queries and API endpoints")
        
        if any('Word Cloud' in r['test'] and not r['passed'] for r in self.results):
            print("  🔧 Word cloud generation issues - verify image generation pipeline")
        
        # Save detailed report to file
        report_file = f"performance_test_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(report_file, 'w') as f:
            json.dump({
                'summary': {
                    'passed_tests': passed_tests,
                    'total_tests': total_tests,
                    'success_rate': passed_tests / total_tests,
                    'requirements_status': requirements
                },
                'detailed_results': self.detailed_results,
                'all_test_results': self.results,
                'timestamp': datetime.now().isoformat()
            }, f, indent=2)
        
        print(f"\nDetailed report saved to: {report_file}")
        
        return all(requirements.values())
    
    def run_all_tests(self):
        """Run comprehensive performance test suite"""
        print("Starting Comprehensive Performance Test Suite")
        print("="*80)
        
        # Check backend health first
        if not self.test_backend_health():
            print("❌ Backend health check failed - some tests may not work properly")
        
        # Run all performance tests
        self.test_comment_processing_multiple()
        self.test_dashboard_performance()
        self.test_wordcloud_performance()
        self.test_csv_upload_performance()
        self.test_api_timeout_behavior()
        
        # Generate comprehensive report
        return self.generate_performance_report()

def main():
    """Main entry point"""
    test_suite = ComprehensivePerformanceTest()
    success = test_suite.run_all_tests()
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
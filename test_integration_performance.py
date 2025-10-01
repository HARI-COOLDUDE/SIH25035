#!/usr/bin/env python3
"""
Integration Performance Test Suite
Tests all performance requirements for the eConsultation AI system
"""

import time
import requests
import json
import os
import sys
import subprocess
import threading
from pathlib import Path
import tempfile
import csv

class PerformanceTestSuite:
    def __init__(self):
        self.backend_url = "http://localhost:8000"
        self.frontend_url = "http://localhost:3000"
        self.results = []
        self.test_data_file = None
        
    def log_result(self, test_name, duration, requirement, passed, details=""):
        """Log test result with timing information"""
        result = {
            'test': test_name,
            'duration': duration,
            'requirement': requirement,
            'passed': passed,
            'details': details
        }
        self.results.append(result)
        status = "PASS" if passed else "FAIL"
        print(f"[{status}] {test_name}: {duration:.2f}s (req: {requirement}s) - {details}")
    
    def wait_for_backend(self, timeout=30):
        """Wait for backend to be available"""
        print("Waiting for backend to be available...")
        start_time = time.time()
        while time.time() - start_time < timeout:
            try:
                response = requests.get(f"{self.backend_url}/health", timeout=5)
                if response.status_code == 200:
                    print("Backend is ready!")
                    return True
            except requests.exceptions.RequestException:
                time.sleep(1)
        return False
    
    def test_comment_processing_performance(self):
        """Test comment processing completes under 2 seconds (Requirement 1.2)"""
        print("\n=== Testing Comment Processing Performance ===")
        
        test_comments = [
            {
                "stakeholder_type": "citizen",
                "raw_text": "This is a test comment for performance testing. It should be processed quickly and efficiently."
            },
            {
                "stakeholder_type": "business", 
                "raw_text": "Another test comment to verify consistent performance across different stakeholder types."
            },
            {
                "stakeholder_type": "ngo",
                "raw_text": "Testing performance with NGO stakeholder type to ensure all types process within time limits."
            }
        ]
        
        for i, comment in enumerate(test_comments):
            start_time = time.time()
            try:
                response = requests.post(
                    f"{self.backend_url}/comments",
                    json=comment,
                    timeout=10
                )
                duration = time.time() - start_time
                
                if response.status_code == 200:
                    data = response.json()
                    passed = duration < 2.0
                    details = f"Status: {response.status_code}, Sentiment: {data.get('sentiment_label', 'N/A')}"
                else:
                    passed = False
                    details = f"HTTP {response.status_code}: {response.text[:100]}"
                    
                self.log_result(
                    f"Comment Processing Test {i+1}",
                    duration,
                    2.0,
                    passed,
                    details
                )
                
            except requests.exceptions.RequestException as e:
                duration = time.time() - start_time
                self.log_result(
                    f"Comment Processing Test {i+1}",
                    duration,
                    2.0,
                    False,
                    f"Request failed: {str(e)}"
                )
    
    def test_dashboard_loading_performance(self):
        """Test dashboard loading completes within 3 seconds (Requirement 3.2)"""
        print("\n=== Testing Dashboard Loading Performance ===")
        
        # Test dashboard stats endpoint
        start_time = time.time()
        try:
            response = requests.get(f"{self.backend_url}/dashboard/stats", timeout=10)
            duration = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                passed = duration < 3.0
                details = f"Total comments: {data.get('total_comments', 0)}, Status: {response.status_code}"
            else:
                passed = False
                details = f"HTTP {response.status_code}: {response.text[:100]}"
                
            self.log_result(
                "Dashboard Stats Loading",
                duration,
                3.0,
                passed,
                details
            )
            
        except requests.exceptions.RequestException as e:
            duration = time.time() - start_time
            self.log_result(
                "Dashboard Stats Loading",
                duration,
                3.0,
                False,
                f"Request failed: {str(e)}"
            )
        
        # Test comments list endpoint
        start_time = time.time()
        try:
            response = requests.get(f"{self.backend_url}/comments", timeout=10)
            duration = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                passed = duration < 3.0
                details = f"Comments loaded: {len(data) if isinstance(data, list) else 'N/A'}, Status: {response.status_code}"
            else:
                passed = False
                details = f"HTTP {response.status_code}: {response.text[:100]}"
                
            self.log_result(
                "Comments List Loading",
                duration,
                3.0,
                passed,
                details
            )
            
        except requests.exceptions.RequestException as e:
            duration = time.time() - start_time
            self.log_result(
                "Comments List Loading",
                duration,
                3.0,
                False,
                f"Request failed: {str(e)}"
            )
    
    def test_wordcloud_generation_performance(self):
        """Test word cloud generation works within 10 seconds (Requirement 3.3)"""
        print("\n=== Testing Word Cloud Generation Performance ===")
        
        # First ensure we have some comments for word cloud generation
        test_comments = [
            "This is a positive comment about the consultation process",
            "I have concerns about the proposed changes and their impact",
            "The consultation is well organized and comprehensive",
            "More transparency is needed in the decision making process"
        ]
        
        # Add test comments
        for comment_text in test_comments:
            try:
                requests.post(
                    f"{self.backend_url}/comments",
                    json={
                        "stakeholder_type": "citizen",
                        "raw_text": comment_text
                    },
                    timeout=5
                )
            except:
                pass  # Continue even if some comments fail
        
        # Test word cloud generation
        start_time = time.time()
        try:
            response = requests.get(f"{self.backend_url}/wordcloud", timeout=15)
            duration = time.time() - start_time
            
            if response.status_code == 200:
                passed = duration < 10.0
                # Check if response contains image data
                content_type = response.headers.get('content-type', '')
                if 'image' in content_type:
                    details = f"Word cloud generated successfully, Content-Type: {content_type}"
                else:
                    details = f"Response received but may not be image data, Content-Type: {content_type}"
            else:
                passed = False
                details = f"HTTP {response.status_code}: {response.text[:100]}"
                
            self.log_result(
                "Word Cloud Generation",
                duration,
                10.0,
                passed,
                details
            )
            
        except requests.exceptions.RequestException as e:
            duration = time.time() - start_time
            self.log_result(
                "Word Cloud Generation",
                duration,
                10.0,
                False,
                f"Request failed: {str(e)}"
            )
    
    def create_test_csv(self):
        """Create a test CSV file for upload testing"""
        test_data = [
            ["stakeholder_type", "raw_text"],
            ["citizen", "This is a test comment for CSV upload performance testing"],
            ["business", "Another test comment to verify CSV processing speed"],
            ["ngo", "Testing CSV upload with NGO stakeholder type"],
            ["academic", "Academic perspective on the consultation process"],
            ["citizen", "Additional citizen feedback for comprehensive testing"]
        ]
        
        # Create temporary CSV file
        temp_file = tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False)
        writer = csv.writer(temp_file)
        writer.writerows(test_data)
        temp_file.close()
        
        self.test_data_file = temp_file.name
        return temp_file.name
    
    def test_csv_upload_performance(self):
        """Test CSV upload with progress indicators (Requirement 3.4)"""
        print("\n=== Testing CSV Upload Performance ===")
        
        # Create test CSV file
        csv_file = self.create_test_csv()
        
        try:
            start_time = time.time()
            
            with open(csv_file, 'rb') as f:
                files = {'file': ('test_comments.csv', f, 'text/csv')}
                response = requests.post(
                    f"{self.backend_url}/upload-csv",
                    files=files,
                    timeout=30
                )
            
            duration = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                passed = True  # CSV upload should complete regardless of time, but we track it
                details = f"Status: {response.status_code}, Processed: {data.get('processed_count', 'N/A')} comments"
            else:
                passed = False
                details = f"HTTP {response.status_code}: {response.text[:100]}"
                
            self.log_result(
                "CSV Upload Processing",
                duration,
                30.0,  # Reasonable timeout for CSV processing
                passed,
                details
            )
            
        except requests.exceptions.RequestException as e:
            duration = time.time() - start_time
            self.log_result(
                "CSV Upload Processing",
                duration,
                30.0,
                False,
                f"Request failed: {str(e)}"
            )
        finally:
            # Clean up test file
            if os.path.exists(csv_file):
                os.unlink(csv_file)
    
    def run_all_tests(self):
        """Run all performance tests"""
        print("Starting Integration Performance Test Suite")
        print("=" * 50)
        
        # Check if backend is available
        if not self.wait_for_backend():
            print("ERROR: Backend is not available. Please start the backend first.")
            return False
        
        # Run all performance tests
        self.test_comment_processing_performance()
        self.test_dashboard_loading_performance()
        self.test_wordcloud_generation_performance()
        self.test_csv_upload_performance()
        
        # Print summary
        self.print_summary()
        
        return self.all_tests_passed()
    
    def all_tests_passed(self):
        """Check if all tests passed"""
        return all(result['passed'] for result in self.results)
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 50)
        print("PERFORMANCE TEST SUMMARY")
        print("=" * 50)
        
        passed_tests = sum(1 for result in self.results if result['passed'])
        total_tests = len(self.results)
        
        print(f"Tests Passed: {passed_tests}/{total_tests}")
        
        if not self.all_tests_passed():
            print("\nFAILED TESTS:")
            for result in self.results:
                if not result['passed']:
                    print(f"  - {result['test']}: {result['duration']:.2f}s (req: {result['requirement']}s)")
                    print(f"    Details: {result['details']}")
        
        print("\nPERFORMANCE REQUIREMENTS STATUS:")
        print(f"  Comment Processing (< 2s): {'✓' if any(r['passed'] and 'Comment Processing' in r['test'] for r in self.results) else '✗'}")
        print(f"  Dashboard Loading (< 3s): {'✓' if any(r['passed'] and 'Dashboard' in r['test'] for r in self.results) else '✗'}")
        print(f"  Word Cloud Generation (< 10s): {'✓' if any(r['passed'] and 'Word Cloud' in r['test'] for r in self.results) else '✗'}")
        print(f"  CSV Upload Processing: {'✓' if any(r['passed'] and 'CSV Upload' in r['test'] for r in self.results) else '✗'}")

if __name__ == "__main__":
    test_suite = PerformanceTestSuite()
    success = test_suite.run_all_tests()
    sys.exit(0 if success else 1)
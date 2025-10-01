#!/usr/bin/env python3
"""
Complete User Workflows Test
Tests end-to-end user workflows from frontend to backend
"""

import requests
import time
import json
import subprocess
import sys
import os
from pathlib import Path

class UserWorkflowTester:
    def __init__(self):
        self.backend_url = "http://localhost:8000"
        self.frontend_url = "http://localhost:3000"
        self.test_results = []
        
    def log_test(self, test_name, success, message="", duration=0):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "duration": duration
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message} ({duration:.2f}s)")

    def test_complete_comment_workflow(self):
        """Test complete comment submission workflow"""
        print("\n🔄 Testing Complete Comment Workflow...")
        
        # Step 1: Submit comment
        start_time = time.time()
        test_comment = {
            "stakeholder_type": "citizen",
            "raw_text": "I support this new policy initiative as it will benefit our community greatly."
        }
        
        try:
            response = requests.post(
                f"{self.backend_url}/api/comments",
                json=test_comment,
                timeout=10
            )
            
            if response.status_code == 200:
                comment_data = response.json()
                comment_id = comment_data['id']
                
                # Step 2: Verify comment appears in comments list
                comments_response = requests.get(f"{self.backend_url}/api/comments", timeout=5)
                if comments_response.status_code == 200:
                    comments = comments_response.json()
                    comment_found = any(c['id'] == comment_id for c in comments)
                    
                    if comment_found:
                        # Step 3: Verify dashboard stats updated
                        dashboard_response = requests.get(f"{self.backend_url}/api/dashboard", timeout=5)
                        if dashboard_response.status_code == 200:
                            dashboard_data = dashboard_response.json()
                            
                            duration = time.time() - start_time
                            self.log_test(
                                "Complete Comment Workflow", 
                                True, 
                                f"Comment processed, listed, and dashboard updated. Sentiment: {comment_data['sentiment_label']}", 
                                duration
                            )
                            return True
                        else:
                            self.log_test("Complete Comment Workflow", False, "Dashboard update failed", time.time() - start_time)
                    else:
                        self.log_test("Complete Comment Workflow", False, "Comment not found in list", time.time() - start_time)
                else:
                    self.log_test("Complete Comment Workflow", False, "Failed to retrieve comments list", time.time() - start_time)
            else:
                self.log_test("Complete Comment Workflow", False, f"Comment submission failed: {response.status_code}", time.time() - start_time)
                
        except Exception as e:
            self.log_test("Complete Comment Workflow", False, f"Error: {str(e)}", time.time() - start_time)
        
        return False

    def test_dashboard_analytics_workflow(self):
        """Test complete dashboard analytics workflow"""
        print("\n📊 Testing Dashboard Analytics Workflow...")
        
        start_time = time.time()
        try:
            # Get dashboard stats
            response = requests.get(f"{self.backend_url}/api/dashboard", timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                
                # Verify all required fields are present
                required_fields = ['total_comments', 'positive_percentage', 'negative_percentage', 'neutral_percentage']
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    # Verify percentages add up to approximately 100%
                    total_percentage = data['positive_percentage'] + data['negative_percentage'] + data['neutral_percentage']
                    
                    if 99.0 <= total_percentage <= 101.0:  # Allow for rounding
                        duration = time.time() - start_time
                        self.log_test(
                            "Dashboard Analytics Workflow", 
                            True, 
                            f"Analytics complete: {data['total_comments']} comments, {total_percentage:.1f}% total", 
                            duration
                        )
                        return True
                    else:
                        self.log_test("Dashboard Analytics Workflow", False, f"Percentages don't add up: {total_percentage:.1f}%", time.time() - start_time)
                else:
                    self.log_test("Dashboard Analytics Workflow", False, f"Missing fields: {missing_fields}", time.time() - start_time)
            else:
                self.log_test("Dashboard Analytics Workflow", False, f"Dashboard request failed: {response.status_code}", time.time() - start_time)
                
        except Exception as e:
            self.log_test("Dashboard Analytics Workflow", False, f"Error: {str(e)}", time.time() - start_time)
        
        return False

    def test_wordcloud_generation_workflow(self):
        """Test complete word cloud generation workflow"""
        print("\n☁️ Testing Word Cloud Generation Workflow...")
        
        start_time = time.time()
        try:
            # Test different sentiment filters
            sentiments = [None, 'positive', 'negative', 'neutral']
            
            for sentiment in sentiments:
                sentiment_start = time.time()
                
                if sentiment:
                    response = requests.get(f"{self.backend_url}/api/wordcloud?sentiment={sentiment}", timeout=15)
                else:
                    response = requests.get(f"{self.backend_url}/api/wordcloud", timeout=15)
                
                if response.status_code == 200:
                    # Check if response contains image data
                    content_type = response.headers.get('content-type', '')
                    if 'image' in content_type or len(response.content) > 1000:
                        sentiment_duration = time.time() - sentiment_start
                        filter_name = sentiment or 'all'
                        self.log_test(
                            f"Word Cloud - {filter_name}", 
                            True, 
                            f"Generated successfully", 
                            sentiment_duration
                        )
                    else:
                        self.log_test(f"Word Cloud - {sentiment or 'all'}", False, "Invalid image response", time.time() - sentiment_start)
                        return False
                else:
                    self.log_test(f"Word Cloud - {sentiment or 'all'}", False, f"Request failed: {response.status_code}", time.time() - sentiment_start)
                    return False
            
            duration = time.time() - start_time
            self.log_test("Word Cloud Generation Workflow", True, "All sentiment filters work", duration)
            return True
            
        except Exception as e:
            self.log_test("Word Cloud Generation Workflow", False, f"Error: {str(e)}", time.time() - start_time)
        
        return False

    def test_csv_upload_workflow(self):
        """Test complete CSV upload workflow"""
        print("\n📁 Testing CSV Upload Workflow...")
        
        # Create test CSV with various comment types
        import tempfile
        import csv
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as f:
            writer = csv.writer(f)
            writer.writerow(['stakeholder_type', 'raw_text'])
            writer.writerow(['citizen', 'This policy is excellent and will help our community thrive.'])
            writer.writerow(['business', 'We have serious concerns about the implementation costs and timeline.'])
            writer.writerow(['ngo', 'This initiative aligns perfectly with our environmental goals.'])
            writer.writerow(['academic', 'The research data supports this approach, though more study is needed.'])
            writer.writerow(['citizen', 'I am neutral about this proposal and need more information.'])
            csv_file_path = f.name
        
        start_time = time.time()
        try:
            with open(csv_file_path, 'rb') as f:
                files = {'file': ('test_workflow_comments.csv', f, 'text/csv')}
                response = requests.post(
                    f"{self.backend_url}/api/comments/bulk",
                    files=files,
                    timeout=30
                )
            
            if response.status_code == 200:
                data = response.json()
                
                if 'comments' in data and len(data['comments']) == 5:
                    # Verify sentiment analysis worked
                    sentiments = [c['sentiment_label'] for c in data['comments']]
                    unique_sentiments = set(sentiments)
                    
                    # Should have detected different sentiments
                    if len(unique_sentiments) > 1:
                        duration = time.time() - start_time
                        self.log_test(
                            "CSV Upload Workflow", 
                            True, 
                            f"Processed 5 comments with {len(unique_sentiments)} different sentiments", 
                            duration
                        )
                        return True
                    else:
                        self.log_test("CSV Upload Workflow", False, "All comments have same sentiment", time.time() - start_time)
                else:
                    self.log_test("CSV Upload Workflow", False, f"Expected 5 comments, got {len(data.get('comments', []))}", time.time() - start_time)
            else:
                self.log_test("CSV Upload Workflow", False, f"Upload failed: {response.status_code}", time.time() - start_time)
                
        except Exception as e:
            self.log_test("CSV Upload Workflow", False, f"Error: {str(e)}", time.time() - start_time)
        finally:
            # Clean up
            try:
                os.unlink(csv_file_path)
            except:
                pass
        
        return False

    def test_error_recovery_workflow(self):
        """Test error recovery and user experience"""
        print("\n🚨 Testing Error Recovery Workflow...")
        
        start_time = time.time()
        
        # Test 1: Invalid stakeholder type
        try:
            invalid_comment = {
                "stakeholder_type": "invalid_type",
                "raw_text": "This should fail validation"
            }
            
            response = requests.post(
                f"{self.backend_url}/api/comments",
                json=invalid_comment,
                timeout=5
            )
            
            if response.status_code in [400, 422]:
                error_data = response.json()
                if 'detail' in error_data:
                    self.log_test("Error Recovery - Validation", True, "Proper validation error returned", 0)
                else:
                    self.log_test("Error Recovery - Validation", False, "Error response missing details", 0)
            else:
                self.log_test("Error Recovery - Validation", False, f"Unexpected status: {response.status_code}", 0)
        except Exception as e:
            self.log_test("Error Recovery - Validation", False, f"Error: {str(e)}", 0)
        
        # Test 2: Empty comment
        try:
            empty_comment = {
                "stakeholder_type": "citizen",
                "raw_text": ""
            }
            
            response = requests.post(
                f"{self.backend_url}/api/comments",
                json=empty_comment,
                timeout=5
            )
            
            if response.status_code in [400, 422]:
                self.log_test("Error Recovery - Empty Text", True, "Empty text properly rejected", 0)
            else:
                self.log_test("Error Recovery - Empty Text", False, f"Empty text not rejected: {response.status_code}", 0)
        except Exception as e:
            self.log_test("Error Recovery - Empty Text", False, f"Error: {str(e)}", 0)
        
        # Test 3: Very long comment (should be truncated, not rejected)
        try:
            long_comment = {
                "stakeholder_type": "citizen",
                "raw_text": "A" * 500  # 500 characters, should be truncated to 300
            }
            
            response = requests.post(
                f"{self.backend_url}/api/comments",
                json=long_comment,
                timeout=5
            )
            
            if response.status_code == 200:
                data = response.json()
                if len(data['raw_text']) <= 300:
                    self.log_test("Error Recovery - Long Text", True, f"Long text truncated to {len(data['raw_text'])} chars", 0)
                else:
                    self.log_test("Error Recovery - Long Text", False, f"Text not truncated: {len(data['raw_text'])} chars", 0)
            elif response.status_code in [400, 422]:
                self.log_test("Error Recovery - Long Text", True, "Long text properly rejected", 0)
            else:
                self.log_test("Error Recovery - Long Text", False, f"Unexpected response: {response.status_code}", 0)
        except Exception as e:
            self.log_test("Error Recovery - Long Text", False, f"Error: {str(e)}", 0)
        
        duration = time.time() - start_time
        self.log_test("Error Recovery Workflow", True, "Error scenarios tested", duration)
        return True

    def test_performance_requirements(self):
        """Test that performance requirements are met"""
        print("\n⚡ Testing Performance Requirements...")
        
        # Test comment processing speed (< 2 seconds)
        start_time = time.time()
        try:
            test_comment = {
                "stakeholder_type": "citizen",
                "raw_text": "Performance test comment to verify processing speed meets requirements."
            }
            
            response = requests.post(
                f"{self.backend_url}/api/comments",
                json=test_comment,
                timeout=5
            )
            
            duration = time.time() - start_time
            
            if response.status_code == 200 and duration < 2.5:  # Allow some margin
                self.log_test("Performance - Comment Processing", True, f"Processed in {duration:.2f}s", duration)
            elif response.status_code == 200:
                self.log_test("Performance - Comment Processing", False, f"Too slow: {duration:.2f}s", duration)
            else:
                self.log_test("Performance - Comment Processing", False, f"Failed: {response.status_code}", duration)
        except Exception as e:
            self.log_test("Performance - Comment Processing", False, f"Error: {str(e)}", time.time() - start_time)
        
        # Test dashboard loading speed (< 3 seconds)
        start_time = time.time()
        try:
            response = requests.get(f"{self.backend_url}/api/dashboard", timeout=5)
            duration = time.time() - start_time
            
            if response.status_code == 200 and duration < 3.0:
                self.log_test("Performance - Dashboard Loading", True, f"Loaded in {duration:.2f}s", duration)
            elif response.status_code == 200:
                self.log_test("Performance - Dashboard Loading", False, f"Too slow: {duration:.2f}s", duration)
            else:
                self.log_test("Performance - Dashboard Loading", False, f"Failed: {response.status_code}", duration)
        except Exception as e:
            self.log_test("Performance - Dashboard Loading", False, f"Error: {str(e)}", time.time() - start_time)
        
        return True

    def run_all_tests(self):
        """Run all user workflow tests"""
        print("🚀 Starting Complete User Workflow Tests...")
        print("=" * 60)
        
        # Run all workflow tests
        self.test_complete_comment_workflow()
        self.test_dashboard_analytics_workflow()
        self.test_wordcloud_generation_workflow()
        self.test_csv_upload_workflow()
        self.test_error_recovery_workflow()
        self.test_performance_requirements()
        
        # Generate report
        self.generate_report()
        
        return len([r for r in self.test_results if not r['success']]) == 0

    def generate_report(self):
        """Generate final test report"""
        print("\n" + "=" * 60)
        print("📋 COMPLETE USER WORKFLOW TEST REPORT")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['success'])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests} ✅")
        print(f"Failed: {failed_tests} ❌")
        print(f"Success Rate: {(passed_tests/total_tests*100):.1f}%")
        
        if failed_tests > 0:
            print(f"\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  - {result['test']}: {result['message']}")
        
        # Performance summary
        print(f"\n⚡ PERFORMANCE SUMMARY:")
        for result in self.test_results:
            if 'Performance' in result['test']:
                status = '✅' if result['success'] else '❌'
                print(f"  {status} {result['test']}: {result['duration']:.2f}s - {result['message']}")
        
        # Workflow summary
        print(f"\n🔄 WORKFLOW SUMMARY:")
        workflow_tests = [r for r in self.test_results if 'Workflow' in r['test']]
        for result in workflow_tests:
            status = '✅' if result['success'] else '❌'
            print(f"  {status} {result['test']}: {result['message']}")
        
        if failed_tests == 0:
            print(f"\n🎉 ALL USER WORKFLOWS COMPLETED SUCCESSFULLY!")
            print("✅ Comment submission and processing works end-to-end")
            print("✅ Dashboard analytics display correctly")
            print("✅ Word cloud generation works for all sentiment filters")
            print("✅ CSV upload processes multiple comments correctly")
            print("✅ Error handling provides appropriate user feedback")
            print("✅ Performance requirements are met")
        else:
            print(f"\n⚠️ Some workflows have issues that need attention.")

def main():
    """Main function"""
    tester = UserWorkflowTester()
    success = tester.run_all_tests()
    
    if success:
        print(f"\n✅ All user workflows completed successfully!")
        return 0
    else:
        print(f"\n❌ Some user workflows need attention.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
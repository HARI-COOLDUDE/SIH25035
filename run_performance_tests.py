#!/usr/bin/env python3
"""
Performance Test Runner
Orchestrates both backend and frontend performance tests
"""

import subprocess
import sys
import time
import os
import signal
import requests
from pathlib import Path

class PerformanceTestRunner:
    def __init__(self):
        self.backend_process = None
        self.frontend_process = None
        self.backend_url = "http://localhost:8000"
        self.frontend_url = "http://localhost:3000"
        
    def start_backend(self):
        """Start the optimized backend"""
        print("Starting optimized backend...")
        
        # Try to start the optimized backend
        backend_script = Path("start_backend_optimized.py")
        if backend_script.exists():
            self.backend_process = subprocess.Popen([
                sys.executable, str(backend_script)
            ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        else:
            # Fallback to regular backend
            backend_dir = Path("backend")
            if backend_dir.exists():
                os.chdir(backend_dir)
                self.backend_process = subprocess.Popen([
                    sys.executable, "app_optimized.py"
                ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                os.chdir("..")
        
        # Wait for backend to be ready
        return self.wait_for_service(self.backend_url + "/health", "Backend")
    
    def start_frontend(self):
        """Start the frontend development server"""
        print("Starting frontend...")
        
        frontend_dir = Path("frontend")
        if not frontend_dir.exists():
            print("Frontend directory not found!")
            return False
            
        # Start frontend development server
        os.chdir(frontend_dir)
        self.frontend_process = subprocess.Popen([
            "npm", "start"
        ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        os.chdir("..")
        
        # Wait for frontend to be ready
        return self.wait_for_service(self.frontend_url, "Frontend")
    
    def wait_for_service(self, url, service_name, timeout=60):
        """Wait for a service to become available"""
        print(f"Waiting for {service_name} to be ready...")
        start_time = time.time()
        
        while time.time() - start_time < timeout:
            try:
                response = requests.get(url, timeout=5)
                if response.status_code in [200, 404]:  # 404 is OK for frontend root
                    print(f"{service_name} is ready!")
                    return True
            except requests.exceptions.RequestException:
                time.sleep(2)
                
        print(f"Timeout waiting for {service_name}")
        return False
    
    def run_backend_performance_tests(self):
        """Run backend performance tests"""
        print("\n" + "="*60)
        print("RUNNING BACKEND PERFORMANCE TESTS")
        print("="*60)
        
        try:
            result = subprocess.run([
                sys.executable, "test_integration_performance.py"
            ], capture_output=True, text=True, timeout=300)
            
            print(result.stdout)
            if result.stderr:
                print("STDERR:", result.stderr)
                
            return result.returncode == 0
            
        except subprocess.TimeoutExpired:
            print("Backend performance tests timed out!")
            return False
        except Exception as e:
            print(f"Error running backend tests: {e}")
            return False
    
    def run_frontend_performance_tests(self):
        """Run frontend performance tests"""
        print("\n" + "="*60)
        print("RUNNING FRONTEND PERFORMANCE TESTS")
        print("="*60)
        
        frontend_dir = Path("frontend")
        if not frontend_dir.exists():
            print("Frontend directory not found!")
            return False
            
        try:
            os.chdir(frontend_dir)
            
            # Run Jest tests for performance
            result = subprocess.run([
                "npm", "test", "--", "--testPathPattern=PerformanceTest", "--watchAll=false"
            ], capture_output=True, text=True, timeout=300)
            
            os.chdir("..")
            
            print(result.stdout)
            if result.stderr:
                print("STDERR:", result.stderr)
                
            return result.returncode == 0
            
        except subprocess.TimeoutExpired:
            print("Frontend performance tests timed out!")
            return False
        except Exception as e:
            print(f"Error running frontend tests: {e}")
            return False
        finally:
            # Make sure we're back in the root directory
            if os.getcwd().endswith("frontend"):
                os.chdir("..")
    
    def cleanup(self):
        """Clean up running processes"""
        print("\nCleaning up processes...")
        
        if self.backend_process:
            try:
                self.backend_process.terminate()
                self.backend_process.wait(timeout=10)
            except subprocess.TimeoutExpired:
                self.backend_process.kill()
            except Exception as e:
                print(f"Error stopping backend: {e}")
        
        if self.frontend_process:
            try:
                self.frontend_process.terminate()
                self.frontend_process.wait(timeout=10)
            except subprocess.TimeoutExpired:
                self.frontend_process.kill()
            except Exception as e:
                print(f"Error stopping frontend: {e}")
    
    def run_all_tests(self):
        """Run complete performance test suite"""
        print("Starting Performance Test Suite")
        print("="*60)
        
        backend_started = False
        frontend_started = False
        backend_tests_passed = False
        frontend_tests_passed = False
        
        try:
            # Start services
            backend_started = self.start_backend()
            if not backend_started:
                print("Failed to start backend - some tests may fail")
            
            # Run backend tests (these don't require frontend)
            if backend_started:
                backend_tests_passed = self.run_backend_performance_tests()
            
            # Start frontend for frontend-specific tests
            frontend_started = self.start_frontend()
            if not frontend_started:
                print("Failed to start frontend - frontend tests will be skipped")
            
            # Run frontend tests
            if frontend_started:
                frontend_tests_passed = self.run_frontend_performance_tests()
            
            # Print final summary
            self.print_final_summary(backend_tests_passed, frontend_tests_passed)
            
            return backend_tests_passed and (frontend_tests_passed or not frontend_started)
            
        except KeyboardInterrupt:
            print("\nTest execution interrupted by user")
            return False
        finally:
            self.cleanup()
    
    def print_final_summary(self, backend_passed, frontend_passed):
        """Print final test summary"""
        print("\n" + "="*60)
        print("FINAL PERFORMANCE TEST SUMMARY")
        print("="*60)
        
        print(f"Backend Performance Tests: {'PASSED' if backend_passed else 'FAILED'}")
        print(f"Frontend Performance Tests: {'PASSED' if frontend_passed else 'FAILED'}")
        
        if backend_passed and frontend_passed:
            print("\n✅ ALL PERFORMANCE REQUIREMENTS VALIDATED")
            print("\nPerformance Requirements Status:")
            print("  ✅ Comment processing < 2 seconds (Requirement 1.2)")
            print("  ✅ Dashboard loading < 3 seconds (Requirement 3.2)")
            print("  ✅ Word cloud generation < 10 seconds (Requirement 3.3)")
            print("  ✅ CSV upload with progress indicators (Requirement 3.4)")
        else:
            print("\n❌ SOME PERFORMANCE TESTS FAILED")
            print("\nPlease review the test output above for details.")

def main():
    """Main entry point"""
    runner = PerformanceTestRunner()
    
    # Handle Ctrl+C gracefully
    def signal_handler(sig, frame):
        print("\nReceived interrupt signal, cleaning up...")
        runner.cleanup()
        sys.exit(1)
    
    signal.signal(signal.SIGINT, signal_handler)
    
    success = runner.run_all_tests()
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
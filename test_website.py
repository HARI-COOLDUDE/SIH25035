#!/usr/bin/env python3
"""
Test if the website is running and accessible
"""

import requests
import subprocess
import time
import os
import sys

def check_frontend():
    """Check if frontend is running on port 3000"""
    try:
        response = requests.get('http://localhost:3000', timeout=5)
        print(f"Frontend Status: {response.status_code}")
        if response.status_code == 200:
            print("✓ Frontend is running and accessible")
            return True
        else:
            print("✗ Frontend returned non-200 status")
            return False
    except requests.exceptions.ConnectionError:
        print("✗ Frontend is not running (connection refused)")
        return False
    except requests.exceptions.Timeout:
        print("✗ Frontend request timed out")
        return False
    except Exception as e:
        print(f"✗ Frontend check failed: {e}")
        return False

def check_backend():
    """Check if backend is running on port 8000"""
    try:
        response = requests.get('http://localhost:8000/api/health', timeout=5)
        print(f"Backend Status: {response.status_code}")
        if response.status_code == 200:
            print("✓ Backend is running and accessible")
            return True
        else:
            print("✗ Backend returned non-200 status")
            return False
    except requests.exceptions.ConnectionError:
        print("✗ Backend is not running (connection refused)")
        return False
    except requests.exceptions.Timeout:
        print("✗ Backend request timed out")
        return False
    except Exception as e:
        print(f"✗ Backend check failed: {e}")
        return False

def check_processes():
    """Check if Node.js and Python processes are running"""
    try:
        # Check for Node.js processes
        result = subprocess.run(['tasklist', '/FI', 'IMAGENAME eq node.exe'], 
                              capture_output=True, text=True, shell=True)
        if 'node.exe' in result.stdout:
            print("✓ Node.js process found")
        else:
            print("✗ No Node.js process found")
        
        # Check for Python processes
        result = subprocess.run(['tasklist', '/FI', 'IMAGENAME eq python.exe'], 
                              capture_output=True, text=True, shell=True)
        if 'python.exe' in result.stdout:
            print("✓ Python process found")
        else:
            print("✗ No Python process found")
            
    except Exception as e:
        print(f"Process check failed: {e}")

def main():
    print("eConsultation AI Website Status Check")
    print("=" * 40)
    
    print("\n1. Checking processes...")
    check_processes()
    
    print("\n2. Checking frontend (React)...")
    frontend_ok = check_frontend()
    
    print("\n3. Checking backend (FastAPI)...")
    backend_ok = check_backend()
    
    print("\n" + "=" * 40)
    if frontend_ok and backend_ok:
        print("✓ Both frontend and backend are running!")
        print("✓ Website should be accessible at http://localhost:3000")
    elif frontend_ok:
        print("⚠ Frontend is running but backend is down")
        print("⚠ Some features may not work properly")
    elif backend_ok:
        print("⚠ Backend is running but frontend is down")
        print("⚠ Website is not accessible")
    else:
        print("✗ Both frontend and backend are down")
        print("✗ Website is not accessible")
        print("\nTo start the services:")
        print("1. Backend: python backend/app.py")
        print("2. Frontend: cd frontend && npm start")

if __name__ == "__main__":
    main()
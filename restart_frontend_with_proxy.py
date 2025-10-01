#!/usr/bin/env python3
"""
Restart Frontend with Proxy Configuration
This script helps restart the frontend development server to ensure
the proxy configuration in package.json takes effect properly.
"""

import subprocess
import sys
import time
import requests
import os
import signal

def check_port_in_use(port):
    """Check if a port is in use"""
    try:
        response = requests.get(f'http://localhost:{port}', timeout=1)
        return True
    except:
        return False

def kill_process_on_port(port):
    """Kill process running on specified port (Windows)"""
    try:
        # Find process using the port
        result = subprocess.run(['netstat', '-ano'], capture_output=True, text=True)
        lines = result.stdout.split('\n')
        
        for line in lines:
            if f':{port}' in line and 'LISTENING' in line:
                parts = line.split()
                if len(parts) >= 5:
                    pid = parts[-1]
                    print(f"Found process {pid} using port {port}")
                    
                    # Kill the process
                    subprocess.run(['taskkill', '/F', '/PID', pid], capture_output=True)
                    print(f"Killed process {pid}")
                    time.sleep(2)
                    break
    except Exception as e:
        print(f"Error killing process on port {port}: {e}")

def restart_frontend():
    """Restart the frontend development server"""
    print("🔄 Restarting frontend development server with proxy configuration...\n")
    
    # Check if frontend is running on port 3000
    if check_port_in_use(3000):
        print("📍 Frontend is currently running on port 3000")
        print("🛑 Stopping current frontend server...")
        kill_process_on_port(3000)
        
        # Wait for port to be free
        for i in range(10):
            if not check_port_in_use(3000):
                print("✅ Port 3000 is now free")
                break
            print(f"   Waiting for port 3000 to be free... ({i+1}/10)")
            time.sleep(1)
        else:
            print("⚠️  Port 3000 is still in use, but continuing anyway...")
    
    # Check if backend is running
    if not check_port_in_use(8000):
        print("⚠️  Backend is not running on port 8000!")
        print("   Please start the backend first with: python backend/app.py")
        return False
    else:
        print("✅ Backend is running on port 8000")
    
    print("\n🚀 Starting frontend development server...")
    print("   This will start the React development server with proxy configuration")
    print("   The proxy will forward API requests to http://localhost:8000")
    print("\n📝 Commands to run manually:")
    print("   cd frontend")
    print("   npm start")
    print("\n💡 After starting, test comment loading at: http://localhost:3000")
    print("   Navigate to 'View Comments' and click 'Load Comments'")
    
    return True

def verify_integration():
    """Verify that the integration is working"""
    print("\n🔍 Integration verification checklist:")
    print("=" * 50)
    
    # Check backend
    try:
        response = requests.get('http://localhost:8000/health', timeout=5)
        if response.status_code == 200:
            print("✅ Backend health check: PASSED")
        else:
            print(f"❌ Backend health check: FAILED ({response.status_code})")
    except Exception as e:
        print(f"❌ Backend health check: FAILED ({e})")
    
    # Check comments endpoint
    try:
        response = requests.get('http://localhost:8000/api/comments', timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Comments endpoint: PASSED ({len(data)} comments)")
        else:
            print(f"❌ Comments endpoint: FAILED ({response.status_code})")
    except Exception as e:
        print(f"❌ Comments endpoint: FAILED ({e})")
    
    # Check CORS
    try:
        response = requests.get('http://localhost:8000/api/comments', 
                              headers={'Origin': 'http://localhost:3000'}, 
                              timeout=5)
        cors_origin = response.headers.get('access-control-allow-origin')
        if cors_origin:
            print(f"✅ CORS configuration: PASSED ({cors_origin})")
        else:
            print("⚠️  CORS headers not visible (but may still work)")
    except Exception as e:
        print(f"❌ CORS check: FAILED ({e})")
    
    print("\n📋 Manual testing steps:")
    print("1. Open http://localhost:3000 in your browser")
    print("2. Navigate to 'View Comments' page")
    print("3. Click 'Load Comments' button")
    print("4. Verify comments are displayed")
    print("5. Check browser console for any errors")

if __name__ == "__main__":
    print("Frontend Restart Script")
    print("=" * 30)
    
    if restart_frontend():
        verify_integration()
        
        print("\n🎯 Next Steps:")
        print("1. Open a new terminal/command prompt")
        print("2. Navigate to the frontend directory: cd frontend")
        print("3. Start the development server: npm start")
        print("4. Test comment loading in the browser")
    else:
        print("\n❌ Could not restart frontend. Please check the backend is running.")
        sys.exit(1)
#!/usr/bin/env python3
"""
Restart Services Script
Properly restarts both backend and frontend with CORS fixes
"""

import subprocess
import time
import os
import signal
import psutil

def kill_processes_on_ports():
    """Kill processes running on ports 3000 and 8000"""
    ports_to_kill = [3000, 8000]
    
    for port in ports_to_kill:
        try:
            # Find processes using the port
            for proc in psutil.process_iter(['pid', 'name', 'connections']):
                try:
                    for conn in proc.info['connections'] or []:
                        if conn.laddr.port == port:
                            print(f"🔪 Killing process {proc.info['pid']} ({proc.info['name']}) on port {port}")
                            proc.kill()
                            time.sleep(1)
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    pass
        except Exception as e:
            print(f"⚠️ Error killing processes on port {port}: {e}")

def start_backend():
    """Start the backend server"""
    print("🚀 Starting Backend Server...")
    try:
        backend_process = subprocess.Popen([
            'python', 'backend/app.py'
        ], cwd=os.getcwd())
        
        # Wait a bit for backend to start
        time.sleep(3)
        
        # Check if backend is running
        if backend_process.poll() is None:
            print("✅ Backend started successfully")
            return backend_process
        else:
            print("❌ Backend failed to start")
            return None
    except Exception as e:
        print(f"❌ Error starting backend: {e}")
        return None

def start_frontend():
    """Start the frontend server"""
    print("🌐 Starting Frontend Server...")
    try:
        frontend_process = subprocess.Popen([
            'npm', 'run', 'start-windows'
        ], cwd='frontend', shell=True)
        
        print("✅ Frontend starting... (will open in browser)")
        return frontend_process
    except Exception as e:
        print(f"❌ Error starting frontend: {e}")
        return None

def main():
    """Main function"""
    print("🔄 eConsultation AI - Service Restart")
    print("=" * 50)
    
    print("1. Stopping existing services...")
    kill_processes_on_ports()
    
    print("\n2. Starting backend...")
    backend_proc = start_backend()
    
    if backend_proc:
        print("\n3. Starting frontend...")
        frontend_proc = start_frontend()
        
        if frontend_proc:
            print("\n" + "=" * 50)
            print("✅ Both services started successfully!")
            print("🌐 Frontend: http://localhost:3000")
            print("🔧 Backend API: http://localhost:8000")
            print("📚 API Docs: http://localhost:8000/docs")
            print("\n⏹️ Press Ctrl+C to stop both services")
            
            try:
                # Keep the script running
                while True:
                    time.sleep(1)
            except KeyboardInterrupt:
                print("\n\n🛑 Stopping services...")
                if backend_proc and backend_proc.poll() is None:
                    backend_proc.terminate()
                if frontend_proc and frontend_proc.poll() is None:
                    frontend_proc.terminate()
                print("✅ Services stopped")
        else:
            print("❌ Failed to start frontend")
            if backend_proc:
                backend_proc.terminate()
    else:
        print("❌ Failed to start backend")

if __name__ == "__main__":
    main()
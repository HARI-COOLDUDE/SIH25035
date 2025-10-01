#!/usr/bin/env python3
"""
Fixed Frontend Startup Script
Handles the case sensitivity issue and starts React properly
"""

import subprocess
import os
import sys
import time

def start_frontend():
    """Start the React frontend with proper error handling"""
    
    print("🚀 Starting eConsultation AI Frontend...")
    print("=" * 50)
    
    # Change to frontend directory
    frontend_dir = os.path.join(os.getcwd(), 'frontend')
    
    if not os.path.exists(frontend_dir):
        print("❌ Frontend directory not found!")
        return False
    
    print(f"📁 Frontend directory: {frontend_dir}")
    
    # Check if node_modules exists
    node_modules = os.path.join(frontend_dir, 'node_modules')
    if not os.path.exists(node_modules):
        print("📦 Installing dependencies...")
        try:
            subprocess.run(['npm', 'install'], cwd=frontend_dir, check=True)
            print("✅ Dependencies installed successfully")
        except subprocess.CalledProcessError as e:
            print(f"❌ Failed to install dependencies: {e}")
            return False
    
    # Check critical files
    critical_files = [
        'src/App.jsx',
        'src/index.js',
        'src/index.css',
        'package.json'
    ]
    
    print("\n🔍 Checking critical files...")
    for file in critical_files:
        file_path = os.path.join(frontend_dir, file)
        if os.path.exists(file_path):
            print(f"✅ {file}")
        else:
            print(f"❌ {file} - MISSING!")
            return False
    
    # Start the development server
    print("\n🌐 Starting React development server...")
    print("📍 Frontend will be available at: http://localhost:3000")
    print("⏹️  Press Ctrl+C to stop the server")
    print("-" * 50)
    
    try:
        # Use the Windows-specific start command
        env = os.environ.copy()
        env['ESLINT_NO_DEV_ERRORS'] = 'true'
        
        subprocess.run([
            'npm', 'run', 'start-windows'
        ], cwd=frontend_dir, env=env)
        
    except KeyboardInterrupt:
        print("\n\n🛑 Frontend server stopped by user")
        return True
    except subprocess.CalledProcessError as e:
        print(f"\n❌ Frontend server failed: {e}")
        return False
    except FileNotFoundError:
        print("\n❌ npm not found. Please install Node.js and npm")
        return False

def main():
    """Main function"""
    print("eConsultation AI - Frontend Startup (Fixed)")
    print("=" * 50)
    
    success = start_frontend()
    
    if success:
        print("\n✅ Frontend startup completed successfully")
    else:
        print("\n❌ Frontend startup failed")
        print("\nTroubleshooting:")
        print("1. Make sure Node.js and npm are installed")
        print("2. Check if all files exist in frontend/src/")
        print("3. Try running: cd frontend && npm install")
        print("4. Try running: cd frontend && npm run start-windows")

if __name__ == "__main__":
    main()
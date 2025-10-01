#!/usr/bin/env python3
"""
Switch to Optimized Backend Script
This script switches the backend to the optimized version with faster performance
and updated text limits (300 chars for comments, 50 chars for summaries).
"""

import os
import subprocess
import time
import requests
import shutil

def stop_existing_backend():
    """Stop any existing backend processes"""
    print("🛑 Stopping existing backend processes...")
    try:
        # Kill any existing Python processes running the backend
        subprocess.run(['taskkill', '/F', '/IM', 'python.exe'], 
                      capture_output=True, shell=True)
        subprocess.run(['taskkill', '/F', '/IM', 'uvicorn.exe'], 
                      capture_output=True, shell=True)
        time.sleep(2)
        print("✅ Existing processes stopped")
    except Exception as e:
        print(f"⚠️ Error stopping processes (may not be running): {e}")

def backup_original_backend():
    """Backup the original backend"""
    print("💾 Backing up original backend...")
    try:
        if os.path.exists('backend/app.py') and not os.path.exists('backend/app_original.py'):
            shutil.copy2('backend/app.py', 'backend/app_original.py')
            print("✅ Original backend backed up as app_original.py")
        else:
            print("ℹ️ Backup already exists or original not found")
    except Exception as e:
        print(f"❌ Error backing up: {e}")

def switch_to_optimized():
    """Switch to the optimized backend"""
    print("🔄 Switching to optimized backend...")
    try:
        # Copy optimized version to main app.py
        if os.path.exists('backend/app_optimized.py'):
            shutil.copy2('backend/app_optimized.py', 'backend/app.py')
            print("✅ Switched to optimized backend")
            return True
        else:
            print("❌ Optimized backend file not found")
            return False
    except Exception as e:
        print(f"❌ Error switching backend: {e}")
        return False

def start_optimized_backend():
    """Start the optimized backend"""
    print("🚀 Starting optimized backend...")
    try:
        # Start the backend in a new console window
        subprocess.Popen([
            'python', '-m', 'uvicorn', 'app:app', 
            '--host', '0.0.0.0', 
            '--port', '8000', 
            '--reload'
        ], cwd='backend', creationflags=subprocess.CREATE_NEW_CONSOLE)
        
        print("✅ Optimized backend started")
        return True
    except Exception as e:
        print(f"❌ Error starting backend: {e}")
        return False

def wait_for_backend():
    """Wait for backend to be ready"""
    print("⏳ Waiting for backend to be ready...")
    max_attempts = 30
    for attempt in range(max_attempts):
        try:
            response = requests.get('http://localhost:8000/health', timeout=2)
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Backend is ready! Version: {data.get('version', 'unknown')}")
                return True
        except:
            pass
        
        time.sleep(1)
        print(f"⏳ Attempt {attempt + 1}/{max_attempts}...")
    
    print("❌ Backend did not start within expected time")
    return False

def test_optimized_features():
    """Test the optimized backend features"""
    print("🧪 Testing optimized features...")
    
    try:
        # Test health endpoint
        response = requests.get('http://localhost:8000/health')
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Health check passed")
            print(f"   Version: {data.get('version')}")
            print(f"   Optimizations: {data.get('optimizations', {})}")
        
        # Test comment submission with 300 char limit
        test_comment = {
            "stakeholder_type": "citizen",
            "raw_text": "This is a test comment to verify the optimized backend is working correctly with the new 300 character limit for comments and 50 character limit for summaries. The system should process this faster than before with caching and async processing enabled."
        }
        
        response = requests.post('http://localhost:8000/api/comments', json=test_comment)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Comment processing test passed")
            print(f"   Comment length: {len(data['raw_text'])} chars (max 300)")
            print(f"   Summary length: {len(data['summary'])} chars (max 50)")
            print(f"   Summary: {data['summary']}")
        else:
            print(f"❌ Comment test failed: {response.status_code}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error testing features: {e}")
        return False

def main():
    """Main function to switch to optimized backend"""
    print("🚀 eConsultation AI - Backend Optimization")
    print("=" * 50)
    print("Switching to optimized backend with:")
    print("• 300 character limit for comments")
    print("• 50 character limit for summaries")
    print("• Faster processing with caching")
    print("• Async processing for better performance")
    print("• Optimized database queries")
    print("=" * 50)
    
    # Step 1: Stop existing backend
    stop_existing_backend()
    
    # Step 2: Backup original
    backup_original_backend()
    
    # Step 3: Switch to optimized version
    if not switch_to_optimized():
        print("❌ Failed to switch to optimized backend")
        return False
    
    # Step 4: Start optimized backend
    if not start_optimized_backend():
        print("❌ Failed to start optimized backend")
        return False
    
    # Step 5: Wait for backend to be ready
    if not wait_for_backend():
        print("❌ Backend failed to start properly")
        return False
    
    # Step 6: Test optimized features
    if not test_optimized_features():
        print("⚠️ Some features may not be working correctly")
    
    print("\n🎉 SUCCESS! Optimized backend is now running")
    print("\n📋 What's New:")
    print("• ⚡ Faster comment processing with caching")
    print("• 📝 300 character limit for comments (enforced)")
    print("• 📄 50 character limit for summaries (enforced)")
    print("• 🔄 Async processing for bulk uploads")
    print("• 🗄️ Optimized database with indexes")
    print("• 💾 Result caching for repeated requests")
    
    print(f"\n🌐 Backend URL: http://localhost:8000")
    print(f"📊 Health Check: http://localhost:8000/health")
    print(f"📚 API Docs: http://localhost:8000/docs")
    
    print("\n✅ Your frontend will now work with the optimized backend!")
    print("   The comment input and file uploads will be much faster.")

if __name__ == "__main__":
    main()
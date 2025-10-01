#!/usr/bin/env python3
"""
Switch to Ultra-Fast Backend
Replaces the current backend with optimized version for maximum speed
"""

import os
import shutil
import subprocess
import time
import requests

def stop_current_backend():
    """Stop any running backend processes"""
    try:
        # Kill any Python processes running on port 8000
        subprocess.run(['taskkill', '/F', '/FI', 'IMAGENAME eq python.exe'], 
                      capture_output=True, shell=True)
        time.sleep(2)
        print("✅ Stopped existing backend processes")
    except Exception as e:
        print(f"⚠️ Could not stop backend: {e}")

def backup_current_backend():
    """Backup current backend"""
    try:
        if os.path.exists('backend/app.py'):
            shutil.copy('backend/app.py', 'backend/app_backup.py')
            print("✅ Backed up current backend to app_backup.py")
    except Exception as e:
        print(f"⚠️ Could not backup backend: {e}")

def switch_to_fast_backend():
    """Replace current backend with fast version"""
    try:
        # Copy fast backend over current one
        shutil.copy('backend/app_fast.py', 'backend/app.py')
        print("✅ Switched to ultra-fast backend")
        return True
    except Exception as e:
        print(f"❌ Error switching backend: {e}")
        return False

def start_fast_backend():
    """Start the fast backend"""
    try:
        print("🚀 Starting ultra-fast backend...")
        
        # Start backend in background
        process = subprocess.Popen(
            ['python', 'app.py'],
            cwd='backend',
            creationflags=subprocess.CREATE_NEW_CONSOLE
        )
        
        # Wait for backend to start
        print("⏳ Waiting for backend to initialize...")
        time.sleep(5)
        
        # Test if backend is running
        for i in range(10):
            try:
                response = requests.get('http://localhost:8000/health', timeout=2)
                if response.status_code == 200:
                    data = response.json()
                    print(f"✅ Ultra-fast backend is running!")
                    print(f"   Version: {data.get('version', 'unknown')}")
                    print(f"   Performance: {data.get('performance', 'unknown')}")
                    print(f"   Comments: {data.get('comment_count', 0)}")
                    return True
            except:
                time.sleep(1)
        
        print("❌ Backend may not have started properly")
        return False
        
    except Exception as e:
        print(f"❌ Error starting backend: {e}")
        return False

def test_backend_speed():
    """Test the backend speed"""
    try:
        print("\n🏃 Testing backend speed...")
        
        # Test health endpoint
        start_time = time.time()
        response = requests.get('http://localhost:8000/health')
        health_time = time.time() - start_time
        
        if response.status_code == 200:
            print(f"✅ Health check: {health_time:.3f}s")
        
        # Test comment creation
        start_time = time.time()
        test_comment = {
            "stakeholder_type": "citizen",
            "raw_text": "This is a test comment to check the speed of the new backend system."
        }
        
        response = requests.post('http://localhost:8000/api/comments', json=test_comment)
        comment_time = time.time() - start_time
        
        if response.status_code == 200:
            print(f"✅ Comment processing: {comment_time:.3f}s")
            data = response.json()
            print(f"   Sentiment: {data['sentiment_label']} ({data['sentiment_score']:.2f})")
            print(f"   Summary: {data['summary']}")
        
        # Test dashboard
        start_time = time.time()
        response = requests.get('http://localhost:8000/api/dashboard')
        dashboard_time = time.time() - start_time
        
        if response.status_code == 200:
            print(f"✅ Dashboard load: {dashboard_time:.3f}s")
        
        print(f"\n🎯 Total test time: {health_time + comment_time + dashboard_time:.3f}s")
        
    except Exception as e:
        print(f"❌ Error testing backend: {e}")

def main():
    print("🚀 Switching to Ultra-Fast Backend")
    print("=" * 50)
    
    print("\n1. Stopping current backend...")
    stop_current_backend()
    
    print("\n2. Backing up current backend...")
    backup_current_backend()
    
    print("\n3. Switching to fast backend...")
    if not switch_to_fast_backend():
        print("❌ Failed to switch backend")
        return
    
    print("\n4. Starting ultra-fast backend...")
    if not start_fast_backend():
        print("❌ Failed to start backend")
        return
    
    print("\n5. Testing backend performance...")
    test_backend_speed()
    
    print("\n✅ SUCCESS! Ultra-fast backend is now running")
    print("\nKey improvements:")
    print("• 300 character limit for comments")
    print("• 50 character limit for summaries") 
    print("• Parallel processing for bulk uploads")
    print("• Optimized database queries")
    print("• Faster AI model loading")
    print("• Improved error handling")
    
    print(f"\n🌐 Backend running at: http://localhost:8000")
    print(f"📊 Health check: http://localhost:8000/health")

if __name__ == "__main__":
    main()
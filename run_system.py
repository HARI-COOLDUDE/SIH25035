#!/usr/bin/env python3
"""
Complete System Runner for eConsultation AI
Handles all scenarios and provides multiple options
"""

import os
import sys
import subprocess
import logging
import threading
import time
import webbrowser

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def check_nodejs():
    """Check if Node.js is installed"""
    try:
        result = subprocess.run(['node', '--version'], capture_output=True, text=True)
        return result.returncode == 0
    except FileNotFoundError:
        return False

def check_python():
    """Check Python installation"""
    logger.info(f"✅ Python {sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}")
    return True

def start_backend_service():
    """Start backend service"""
    logger.info("🔧 Starting backend service...")
    try:
        os.chdir('backend')
        
        # Get Python command
        python_cmd = get_python_command()
        
        # Create models if needed
        if not os.path.exists('models/simple_sentiment_model.pkl'):
            logger.info("Creating AI models...")
            subprocess.run([python_cmd, 'instant_train.py'])
        
        # Start backend
        logger.info("✅ Backend starting on http://localhost:8000")
        subprocess.run([python_cmd, 'app.py'])
        
    except Exception as e:
        logger.error(f"❌ Backend failed: {e}")
    finally:
        os.chdir('..')

def start_frontend_service():
    """Start frontend service"""
    logger.info("🔧 Starting frontend service...")
    
    if check_nodejs():
        # Try React app
        try:
            os.chdir('frontend')
            
            if not os.path.exists('node_modules'):
                logger.info("Installing dependencies...")
                subprocess.run(['npm', 'install'], check=True)
            
            logger.info("✅ Frontend starting on http://localhost:3000")
            subprocess.run(['npm', 'start'])
            
        except Exception as e:
            logger.error(f"❌ React app failed: {e}")
            logger.info("Falling back to simple interface...")
            start_simple_frontend()
        finally:
            os.chdir('..')
    else:
        # Use simple interface
        start_simple_frontend()

def start_simple_frontend():
    """Start simple HTML frontend"""
    logger.info("🔧 Starting simple frontend...")
    try:
        # Run the simple frontend script
        subprocess.run([sys.executable, 'start_frontend_simple.py'])
    except Exception as e:
        logger.error(f"❌ Simple frontend failed: {e}")

def get_python_command():
    """Get the appropriate Python command"""
    if os.name == 'nt':  # Windows
        if os.path.exists('venv\\Scripts\\python.exe'):
            return 'venv\\Scripts\\python'
        else:
            return 'python'
    else:  # Unix/Linux/Mac
        if os.path.exists('venv/bin/python'):
            return 'venv/bin/python'
        else:
            return 'python3'

def run_quick_fix():
    """Run quick fix"""
    logger.info("🔧 Running quick fix...")
    try:
        subprocess.run([sys.executable, 'quick_fix.py'])
        return True
    except Exception as e:
        logger.error(f"❌ Quick fix failed: {e}")
        return False

def open_browser():
    """Open browser after delay"""
    time.sleep(5)  # Wait for services to start
    try:
        webbrowser.open('http://localhost:3000')
        webbrowser.open('http://localhost:8000/docs')
    except:
        pass

def show_menu():
    """Show interactive menu"""
    print("\n" + "="*60)
    print("🤖 eConsultation AI - System Runner")
    print("="*60)
    print("1. 🚀 Start Complete System (Backend + Frontend)")
    print("2. 🔧 Run Quick Fix First")
    print("3. 🖥️  Start Backend Only")
    print("4. 🌐 Start Frontend Only (React)")
    print("5. 📄 Start Simple Frontend (HTML)")
    print("6. 🧪 Test System")
    print("7. 📋 System Information")
    print("8. ❌ Exit")
    print("="*60)

def show_system_info():
    """Show system information"""
    logger.info("📋 System Information:")
    logger.info(f"   Python: {sys.version}")
    logger.info(f"   Node.js: {'✅ Installed' if check_nodejs() else '❌ Not found'}")
    logger.info(f"   Backend Models: {'✅ Ready' if os.path.exists('backend/models/simple_sentiment_model.pkl') else '❌ Missing'}")
    logger.info(f"   Frontend Build: {'✅ Ready' if os.path.exists('frontend/build') else '❌ Missing'}")
    logger.info(f"   Database: {'✅ Ready' if os.path.exists('backend/eConsultation.db') else '❌ Missing'}")

def main():
    """Main interactive function"""
    while True:
        show_menu()
        
        try:
            choice = input("\nEnter your choice (1-8): ").strip()
            
            if choice == '1':
                # Start complete system
                logger.info("🚀 Starting complete system...")
                
                # Run quick fix first
                if not run_quick_fix():
                    logger.error("Quick fix failed, but continuing...")
                
                # Start backend in thread
                backend_thread = threading.Thread(target=start_backend_service, daemon=True)
                backend_thread.start()
                
                # Wait a bit for backend to start
                time.sleep(3)
                
                # Open browser
                browser_thread = threading.Thread(target=open_browser, daemon=True)
                browser_thread.start()
                
                # Start frontend (this will block)
                start_frontend_service()
                
            elif choice == '2':
                # Run quick fix
                run_quick_fix()
                
            elif choice == '3':
                # Start backend only
                start_backend_service()
                
            elif choice == '4':
                # Start frontend only
                start_frontend_service()
                
            elif choice == '5':
                # Start simple frontend
                start_simple_frontend()
                
            elif choice == '6':
                # Test system
                logger.info("🧪 Testing system...")
                try:
                    subprocess.run([sys.executable, 'test_system.py'])
                except Exception as e:
                    logger.error(f"❌ Test failed: {e}")
                
            elif choice == '7':
                # System information
                show_system_info()
                
            elif choice == '8':
                # Exit
                logger.info("👋 Goodbye!")
                break
                
            else:
                logger.warning("Invalid choice. Please enter 1-8.")
                
        except KeyboardInterrupt:
            logger.info("\n👋 Goodbye!")
            break
        except Exception as e:
            logger.error(f"❌ Error: {e}")

if __name__ == "__main__":
    main()
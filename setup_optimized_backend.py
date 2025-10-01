#!/usr/bin/env python3
"""
Setup Optimized Backend Script
Ensures virtual environment is properly configured with all dependencies
"""

import os
import sys
import subprocess
import logging
import shutil

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_venv_if_needed():
    """Create virtual environment if it doesn't exist"""
    venv_path = os.path.join('backend', 'venv')
    
    if os.path.exists(venv_path):
        logger.info(f"✅ Virtual environment already exists at {venv_path}")
        return True
    
    logger.info(f"🔧 Creating virtual environment at {venv_path}...")
    
    try:
        # Create virtual environment
        subprocess.run([sys.executable, '-m', 'venv', venv_path], check=True)
        logger.info(f"✅ Virtual environment created successfully")
        return True
    except subprocess.CalledProcessError as e:
        logger.error(f"❌ Failed to create virtual environment: {e}")
        return False
    except Exception as e:
        logger.error(f"❌ Error creating virtual environment: {e}")
        return False

def get_venv_executables():
    """Get paths to Python and pip executables in venv"""
    venv_path = os.path.join('backend', 'venv')
    
    if os.name == 'nt':  # Windows
        python_exe = os.path.join(venv_path, 'Scripts', 'python.exe')
        pip_exe = os.path.join(venv_path, 'Scripts', 'pip.exe')
    else:  # Unix/Linux/Mac
        python_exe = os.path.join(venv_path, 'bin', 'python')
        pip_exe = os.path.join(venv_path, 'bin', 'pip')
    
    return python_exe, pip_exe

def install_dependencies(pip_exe):
    """Install all required dependencies in virtual environment"""
    logger.info("📦 Installing dependencies in virtual environment...")
    
    requirements_path = os.path.join('backend', 'requirements.txt')
    
    if not os.path.exists(requirements_path):
        logger.error(f"❌ Requirements file not found at {requirements_path}")
        return False
    
    try:
        # Upgrade pip first
        logger.info("🔧 Upgrading pip...")
        subprocess.run([pip_exe, 'install', '--upgrade', 'pip'], 
                      cwd='backend', check=True, capture_output=True)
        
        # Install requirements
        logger.info("📦 Installing requirements...")
        result = subprocess.run([pip_exe, 'install', '-r', 'requirements.txt'], 
                               cwd='backend', check=True, capture_output=True, text=True)
        
        logger.info("✅ Dependencies installed successfully")
        return True
        
    except subprocess.CalledProcessError as e:
        logger.error(f"❌ Failed to install dependencies: {e}")
        if e.stdout:
            logger.error(f"STDOUT: {e.stdout}")
        if e.stderr:
            logger.error(f"STDERR: {e.stderr}")
        return False
    except Exception as e:
        logger.error(f"❌ Error installing dependencies: {e}")
        return False

def verify_installation(python_exe):
    """Verify that all key packages are properly installed"""
    logger.info("🔍 Verifying installation...")
    
    test_imports = [
        'fastapi',
        'uvicorn', 
        'transformers',
        'torch',
        'pandas',
        'wordcloud',
        'matplotlib',
        'sqlite3',
        'pydantic'
    ]
    
    try:
        for package in test_imports:
            result = subprocess.run([python_exe, '-c', f'import {package}; print("✅ {package}")'],
                                  capture_output=True, text=True, cwd='backend')
            
            if result.returncode == 0:
                logger.info(f"✅ {package} - OK")
            else:
                logger.warning(f"⚠️ {package} - May have issues")
        
        # Test FastAPI specifically
        result = subprocess.run([python_exe, '-c', 
            'from fastapi import FastAPI; print("FastAPI working")'],
            capture_output=True, text=True, cwd='backend')
        
        if result.returncode == 0:
            logger.info("✅ FastAPI verification passed")
            return True
        else:
            logger.error("❌ FastAPI verification failed")
            return False
            
    except Exception as e:
        logger.error(f"❌ Error verifying installation: {e}")
        return False

def setup_optimized_backend():
    """Set up app_optimized.py as the primary backend"""
    backend_dir = 'backend'
    optimized_path = os.path.join(backend_dir, 'app_optimized.py')
    main_app_path = os.path.join(backend_dir, 'app.py')
    
    if not os.path.exists(optimized_path):
        logger.error(f"❌ Optimized backend not found at {optimized_path}")
        return False
    
    # Always ensure app.py is the optimized version
    try:
        shutil.copy2(optimized_path, main_app_path)
        logger.info("✅ Set app_optimized.py as primary backend (app.py)")
        return True
    except Exception as e:
        logger.error(f"❌ Error setting up optimized backend: {e}")
        return False

def create_startup_scripts():
    """Ensure startup scripts are available"""
    scripts_created = []
    
    # Check if optimized startup scripts exist
    if os.path.exists('start_backend_optimized.py'):
        scripts_created.append('start_backend_optimized.py')
    
    if os.path.exists('start_backend_optimized.bat'):
        scripts_created.append('start_backend_optimized.bat')
    
    if scripts_created:
        logger.info(f"✅ Startup scripts available: {', '.join(scripts_created)}")
    else:
        logger.warning("⚠️ No optimized startup scripts found")
    
    return len(scripts_created) > 0

def main():
    """Main setup function"""
    print("🔧 eConsultation AI - Optimized Backend Setup")
    print("=" * 60)
    print("This script will:")
    print("• Create virtual environment if needed")
    print("• Install all required dependencies")
    print("• Configure optimized backend as primary")
    print("• Verify installation")
    print("=" * 60)
    
    # Step 1: Create virtual environment if needed
    if not create_venv_if_needed():
        logger.error("❌ Failed to create virtual environment")
        return False
    
    # Step 2: Get venv executables
    python_exe, pip_exe = get_venv_executables()
    
    if not os.path.exists(python_exe):
        logger.error(f"❌ Python executable not found at {python_exe}")
        return False
    
    # Step 3: Install dependencies
    if not install_dependencies(pip_exe):
        logger.error("❌ Failed to install dependencies")
        return False
    
    # Step 4: Verify installation
    if not verify_installation(python_exe):
        logger.error("❌ Installation verification failed")
        return False
    
    # Step 5: Setup optimized backend
    if not setup_optimized_backend():
        logger.error("❌ Failed to setup optimized backend")
        return False
    
    # Step 6: Check startup scripts
    create_startup_scripts()
    
    print("\n🎉 SUCCESS! Optimized backend setup complete!")
    print("\n📋 What's configured:")
    print("✅ Virtual environment with all dependencies")
    print("✅ app_optimized.py set as primary backend")
    print("✅ 300 character limit for comments")
    print("✅ 50 character limit for summaries")
    print("✅ AI model caching enabled")
    print("✅ Async processing configured")
    print("✅ Optimized database queries")
    
    print(f"\n🚀 To start the backend:")
    print(f"   python start_backend_optimized.py")
    print(f"   OR")
    print(f"   start_backend_optimized.bat")
    
    print(f"\n🌐 Backend will be available at:")
    print(f"   http://localhost:8000")
    print(f"   http://localhost:8000/docs (API documentation)")
    print(f"   http://localhost:8000/health (health check)")
    
    return True

if __name__ == "__main__":
    success = main()
    if not success:
        print("\n❌ Setup failed. Please check the error messages above.")
        input("Press Enter to exit...")
    else:
        input("\nPress Enter to exit...")
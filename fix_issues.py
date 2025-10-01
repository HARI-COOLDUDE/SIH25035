#!/usr/bin/env python3
"""
Quick Fix Script for Common Issues
Automatically fixes common problems in the eConsultation AI system
"""

import os
import sys
import subprocess
import logging
import json

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def fix_backend_models():
    """Fix backend AI models"""
    logger.info("🔧 Fixing backend AI models...")
    
    os.chdir('backend')
    
    # Create models directory
    os.makedirs('models', exist_ok=True)
    
    # Run instant training if no models exist
    if not os.path.exists('models/simple_sentiment_model.pkl'):
        logger.info("Creating missing AI models...")
        python_cmd = 'venv\\Scripts\\python' if os.name == 'nt' else 'venv/bin/python'
        if not os.path.exists(python_cmd.split('\\')[0] if os.name == 'nt' else python_cmd.split('/')[0]):
            python_cmd = 'python'
        
        subprocess.run([python_cmd, 'instant_train.py'])
    
    # Fix model configurations
    if os.path.exists('fix_model_config.py'):
        python_cmd = 'venv\\Scripts\\python' if os.name == 'nt' else 'venv/bin/python'
        if not os.path.exists(python_cmd.split('\\')[0] if os.name == 'nt' else python_cmd.split('/')[0]):
            python_cmd = 'python'
        
        subprocess.run([python_cmd, 'fix_model_config.py'])
    
    os.chdir('..')
    logger.info("✅ Backend models fixed")

def fix_database():
    """Fix database issues"""
    logger.info("🔧 Fixing database...")
    
    os.chdir('backend')
    
    # Initialize database if it doesn't exist
    if not os.path.exists('eConsultation.db'):
        logger.info("Creating missing database...")
        python_cmd = 'venv\\Scripts\\python' if os.name == 'nt' else 'venv/bin/python'
        if not os.path.exists(python_cmd.split('\\')[0] if os.name == 'nt' else python_cmd.split('/')[0]):
            python_cmd = 'python'
        
        subprocess.run([python_cmd, '-c', 'from app import init_database; init_database()'])
    
    os.chdir('..')
    logger.info("✅ Database fixed")

def fix_frontend_dependencies():
    """Fix frontend dependencies"""
    logger.info("🔧 Fixing frontend dependencies...")
    
    os.chdir('frontend')
    
    # Reinstall node_modules if missing or corrupted
    if not os.path.exists('node_modules') or not os.path.exists('node_modules/.package-lock.json'):
        logger.info("Reinstalling Node.js dependencies...")
        
        # Remove existing node_modules
        if os.path.exists('node_modules'):
            import shutil
            shutil.rmtree('node_modules')
        
        # Remove package-lock.json
        if os.path.exists('package-lock.json'):
            os.remove('package-lock.json')
        
        # Reinstall
        subprocess.run(['npm', 'install'])
    
    os.chdir('..')
    logger.info("✅ Frontend dependencies fixed")

def fix_permissions():
    """Fix file permissions (Unix/Linux/Mac only)"""
    if os.name != 'nt':
        logger.info("🔧 Fixing file permissions...")
        
        # Make scripts executable
        scripts = ['setup.py', 'start_backend.py', 'start_frontend.py', 'test_system.py', 'fix_issues.py']
        for script in scripts:
            if os.path.exists(script):
                os.chmod(script, 0o755)
        
        logger.info("✅ File permissions fixed")

def fix_environment_files():
    """Fix environment configuration files"""
    logger.info("🔧 Fixing environment files...")
    
    # Backend .env
    backend_env_path = 'backend/.env'
    if not os.path.exists(backend_env_path):
        logger.info("Creating backend .env file...")
        with open(backend_env_path, 'w') as f:
            f.write("""DATABASE_URL=sqlite:///./eConsultation.db
MODEL_CACHE_DIR=./models
LOG_LEVEL=INFO
CORS_ORIGINS=http://localhost:3000
""")
    
    # Frontend .env
    frontend_env_path = 'frontend/.env'
    if not os.path.exists(frontend_env_path):
        logger.info("Creating frontend .env file...")
        with open(frontend_env_path, 'w') as f:
            f.write("""REACT_APP_API_URL=http://localhost:8000
REACT_APP_ENVIRONMENT=development
""")
    
    logger.info("✅ Environment files fixed")

def fix_docker_issues():
    """Fix Docker-related issues"""
    logger.info("🔧 Fixing Docker issues...")
    
    # Check if Docker is available
    try:
        subprocess.run(['docker', '--version'], capture_output=True, check=True)
        
        # Stop any running containers
        subprocess.run(['docker-compose', 'down'], capture_output=True)
        
        # Remove any orphaned containers
        subprocess.run(['docker', 'system', 'prune', '-f'], capture_output=True)
        
        logger.info("✅ Docker issues fixed")
    except:
        logger.info("Docker not available, skipping Docker fixes")

def check_system_requirements():
    """Check system requirements"""
    logger.info("🔍 Checking system requirements...")
    
    issues = []
    
    # Check Python version
    if sys.version_info < (3, 8):
        issues.append("Python 3.8+ required")
    else:
        logger.info(f"✅ Python {sys.version_info.major}.{sys.version_info.minor} OK")
    
    # Check Node.js
    try:
        result = subprocess.run(['node', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            version = result.stdout.strip()
            logger.info(f"✅ Node.js {version} OK")
        else:
            issues.append("Node.js not found")
    except:
        issues.append("Node.js not found")
    
    # Check npm
    try:
        result = subprocess.run(['npm', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            version = result.stdout.strip()
            logger.info(f"✅ npm {version} OK")
        else:
            issues.append("npm not found")
    except:
        issues.append("npm not found")
    
    if issues:
        logger.error("❌ System requirement issues:")
        for issue in issues:
            logger.error(f"   - {issue}")
        return False
    
    logger.info("✅ All system requirements met")
    return True

def main():
    """Run all fixes"""
    logger.info("🔧 Starting eConsultation AI Issue Fix")
    logger.info("=" * 50)
    
    # Check system requirements first
    if not check_system_requirements():
        logger.error("❌ Please install missing requirements and try again")
        return False
    
    fixes = [
        ("Environment Files", fix_environment_files),
        ("Backend Models", fix_backend_models),
        ("Database", fix_database),
        ("Frontend Dependencies", fix_frontend_dependencies),
        ("File Permissions", fix_permissions),
        ("Docker Issues", fix_docker_issues),
    ]
    
    for fix_name, fix_func in fixes:
        logger.info(f"\n🔧 Running {fix_name} fix...")
        try:
            fix_func()
        except Exception as e:
            logger.error(f"❌ {fix_name} fix failed: {e}")
    
    logger.info("\n" + "=" * 50)
    logger.info("🎉 Issue fixing completed!")
    logger.info("\nNext steps:")
    logger.info("1. Run: python start_backend.py")
    logger.info("2. Run: python start_frontend.py")
    logger.info("3. Test: python test_system.py")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
@echo off
echo ========================================
echo  eConsultation AI - Complete Website Fix
echo ========================================
echo.
echo Fixing all issues including:
echo - ESLint errors
echo - Missing imports  
echo - AlertCircle issues
echo - Startup problems
echo.
python fix_website.py
echo.
echo ========================================
echo  Fix completed! Choose how to start:
echo ========================================
echo 1. start_frontend_safe.bat (Recommended)
echo 2. start_frontend_simple.bat (No Node.js needed)
echo 3. run_system.bat (Interactive menu)
echo.
pause
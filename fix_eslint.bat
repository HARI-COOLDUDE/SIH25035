@echo off
echo Fixing ESLint Issues...
python fix_eslint.py
echo.
echo ESLint issues fixed!
echo.
echo To start the frontend:
echo 1. python start_frontend_safe.py
echo 2. Or: start_frontend_simple.bat
echo.
pause
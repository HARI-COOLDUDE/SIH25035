#!/usr/bin/env python3
"""
Fix Import Issues Script
Fixes case sensitivity and import path issues
"""

import os
import re

def fix_index_js():
    """Fix the index.js import statement"""
    index_path = 'frontend/src/index.js'
    
    if not os.path.exists(index_path):
        print(f"❌ {index_path} not found")
        return False
    
    with open(index_path, 'r') as f:
        content = f.read()
    
    # Fix the import statement
    original_content = content
    content = re.sub(r"import App from ['\"]\.\/app['\"];", "import App from './App';", content)
    content = re.sub(r"import App from ['\"]\.\/app\.jsx['\"];", "import App from './App';", content)
    
    if content != original_content:
        with open(index_path, 'w') as f:
            f.write(content)
        print(f"✅ Fixed import in {index_path}")
        return True
    else:
        print(f"✅ {index_path} already correct")
        return True

def check_app_jsx():
    """Check if App.jsx exists and has proper structure"""
    app_path = 'frontend/src/App.jsx'
    
    if not os.path.exists(app_path):
        print(f"❌ {app_path} not found")
        return False
    
    with open(app_path, 'r') as f:
        content = f.read()
    
    # Check for essential parts
    checks = [
        ('React import', r'import React'),
        ('Function declaration', r'function App\(\)'),
        ('Export statement', r'export default App'),
        ('Return statement', r'return \('),
    ]
    
    all_good = True
    for name, pattern in checks:
        if re.search(pattern, content):
            print(f"✅ {name} found")
        else:
            print(f"❌ {name} missing")
            all_good = False
    
    return all_good

def main():
    """Main function"""
    print("eConsultation AI - Import Fix Script")
    print("=" * 40)
    
    print("\n1. Fixing index.js imports...")
    fix_index_js()
    
    print("\n2. Checking App.jsx structure...")
    check_app_jsx()
    
    print("\n3. Checking file existence...")
    files_to_check = [
        'frontend/src/App.jsx',
        'frontend/src/index.js',
        'frontend/src/index.css',
        'frontend/src/components/CommentCard.jsx',
        'frontend/package.json'
    ]
    
    for file_path in files_to_check:
        if os.path.exists(file_path):
            print(f"✅ {file_path}")
        else:
            print(f"❌ {file_path} - MISSING!")
    
    print("\n" + "=" * 40)
    print("✅ Import fix completed!")
    print("\nNext steps:")
    print("1. Run: python start_frontend_fixed.py")
    print("2. Or manually: cd frontend && npm run start-windows")

if __name__ == "__main__":
    main()
#!/usr/bin/env python
"""
Quick start script to launch the backend server with automatic installation
"""

import subprocess
import sys
import os
from pathlib import Path

def install_requirements():
    """Install Python requirements if not already installed"""
    print("Checking dependencies...")
    requirements_file = Path(__file__).parent / 'requirements.txt'
    
    try:
        subprocess.check_call(
            [sys.executable, '-m', 'pip', 'install', '-r', str(requirements_file)],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
        print("✓ Dependencies are up to date")
    except subprocess.CalledProcessError:
        print("✗ Failed to install dependencies")
        print("Run: pip install -r requirements.txt")
        sys.exit(1)

def start_server():
    """Start the Flask backend server"""
    print("\n" + "="*60)
    print("  SCRS Backend Server")
    print("="*60)
    print("\nStarting server on http://localhost:5000")
    print("Press Ctrl+C to stop\n")
    
    try:
        from app import app
        app.run(debug=True, port=5000)
    except ImportError:
        print("Error: Could not import Flask app")
        print("Make sure you're in the correct directory")
        sys.exit(1)

if __name__ == '__main__':
    install_requirements()
    start_server()

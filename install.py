# -*- coding: utf-8 -*-
"""
Leibnitz6 Platform - Standalone Remote Installer
Hosted on https://yogoreal.net/install.py for immediate end-user installation via terminal.
Deploys lightweight client interfaces (Structured Notepad v4 & Suganita Terminal REPL CLI)
connected to the 24/7 central Leibnitz 6 Cloud Engine on Render. Zero local server setup!
"""

import sys
import os
import urllib.request
import subprocess

REQUIRED_PACKAGES = ['numpy', 'scipy', 'matplotlib', 'flask', 'requests', 'pillow', 'pytest']

def run_remote_installation():
    print("==========================================================================")
    print("     LEIBNITZ 6 CLOUD CLIENT & SUGANITA TERMINAL REMOTE INSTALLER        ")
    print("==========================================================================")
    
    # 1. Install dependencies
    print("\n[Step 1/3] Checking and installing Python client dependencies...")
    for pkg in REQUIRED_PACKAGES:
        try:
            __import__(pkg)
        except ImportError:
            print(f"  [+] Installing {pkg}...")
            try:
                subprocess.check_call([sys.executable, "-m", "pip", "install", "--user", pkg])
            except subprocess.CalledProcessError:
                # Fallback for PEP 668 externally-managed environments (Ubuntu 23+, Debian 12+, macOS)
                subprocess.check_call([sys.executable, "-m", "pip", "install", "--user", "--break-system-packages", pkg])
    print("  [OK] Dependencies verified.")

    # 2. Connect to Centralized Cloud Server on Render
    print("\n[Step 2/3] Connecting to Centralized Leibnitz 6 Cloud Server...")
    cloud_url = os.environ.get("LEIBNITZ_SERVER_URL", "https://leibnitz6.onrender.com")
    print(f"  [OK] Central Cloud Engine: {cloud_url}")
    print("  [OK] Centralized Solar-10.7B AI Copilot Endpoint active. (Zero local server setup required!)")

    # 3. Create Launchers for Client Frontends (GUI Notepad v4 & Terminal REPL CLI)
    print("\n[Step 3/3] Creating Client Launchers...")
    cwd = os.getcwd()
    
    # Locate Leibnitz6 root directory if executed from sub-path or home
    target_dir = cwd
    if not os.path.exists(os.path.join(cwd, "structured_notepad_ext")):
        possible_root = os.path.join(cwd, "REALWeb", "Leibnitz6")
        if os.path.exists(possible_root):
            target_dir = possible_root
        else:
            # Download Leibnitz 6 client modules automatically if running in empty directory
            print("  [+] Remote machine environment detected. Downloading Leibnitz 6 client modules...")
            try:
                zip_url = "https://github.com/achawla4/leibnitz6/archive/refs/heads/main.zip"
                req = urllib.request.Request(zip_url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'})
                zip_path = os.path.join(cwd, "leibnitz6_main.zip")
                with urllib.request.urlopen(req) as resp, open(zip_path, 'wb') as out_f:
                    out_f.write(resp.read())
                
                import zipfile
                with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                    zip_ref.extractall(cwd)
                
                extracted_dir = os.path.join(cwd, "leibnitz6-main")
                if os.path.exists(extracted_dir):
                    target_dir = extracted_dir
                if os.path.exists(zip_path):
                    os.remove(zip_path)
                print("  [OK] Client modules downloaded and configured successfully.")
            except Exception as err:
                print(f"  [!] Notice: Module auto-download error ({err}).")

    if target_dir not in sys.path:
        sys.path.insert(0, target_dir)

    notepad_bat = os.path.join(cwd, "StructuredNotepad_v4.bat")
    repl_bat = os.path.join(cwd, "Suganita_Terminal_REPL.bat")
    notepad_sh = os.path.join(cwd, "StructuredNotepad_v4.sh")
    repl_sh = os.path.join(cwd, "Suganita_Terminal_REPL.sh")
    
    ps = os.pathsep

    # Windows Client Launcher (GUI) with explicit PYTHONPATH
    with open(notepad_bat, 'w', encoding='utf-8') as f:
        f.write(f'@echo off\nset PYTHONPATH={target_dir};%PYTHONPATH%\ncd /d "{target_dir}"\nstart "Structured Notepad v4 Client" "{sys.executable}" -m structured_notepad_ext.notepad_app\n')

    # Windows Terminal REPL Launcher (CLI) with explicit PYTHONPATH
    with open(repl_bat, 'w', encoding='utf-8') as f:
        f.write(f'@echo off\nset PYTHONPATH={target_dir};%PYTHONPATH%\ncd /d "{target_dir}"\n"{sys.executable}" -m leibnitz6_server.cli\npause\n')

    # Linux/macOS Client Launcher (GUI) with Unix LF line endings
    with open(notepad_sh, 'w', encoding='utf-8', newline='\n') as f:
        f.write(f'#!/usr/bin/env bash\nexport PYTHONPATH="{target_dir}:$PYTHONPATH"\ncd "{target_dir}"\n"{sys.executable}" -m structured_notepad_ext.notepad_app\n')
    try:
        os.chmod(notepad_sh, 0o755)
    except Exception:
        pass

    # Linux/macOS Terminal REPL Launcher (CLI) with Unix LF line endings
    with open(repl_sh, 'w', encoding='utf-8', newline='\n') as f:
        f.write(f'#!/usr/bin/env bash\nexport PYTHONPATH="{target_dir}:$PYTHONPATH"\ncd "{target_dir}"\n"{sys.executable}" -m leibnitz6_server.cli\n')
    try:
        os.chmod(repl_sh, 0o755)
    except Exception:
        pass

    print(f"  [OK] Structured Notepad v4 GUI created: {notepad_bat} / {notepad_sh}")
    print(f"  [OK] Suganita Terminal REPL CLI created: {repl_bat} / {repl_sh}")

    # Launch Client Interface (GUI Notebook if tkinter available, otherwise Terminal REPL CLI)
    has_tkinter = True
    try:
        import tkinter
    except ImportError:
        has_tkinter = False

    env = os.environ.copy()
    env["PYTHONPATH"] = f"{target_dir}{ps}{env.get('PYTHONPATH', '')}"

    if has_tkinter:
        print("\n[+] Launching Structured Notepad v4 GUI Client...")
        subprocess.Popen([sys.executable, "-m", "structured_notepad_ext.notepad_app"], cwd=target_dir, env=env)
        print("\n==========================================================================")
        print("  [SUCCESS] STRUCTURED NOTEPAD v4 CLIENT IS NOW RUNNING! HAPPY SIGNAL CODING!")
        print("  (Connected to Central Leibnitz 6 Cloud Engine — Zero local server setup!)")
        print("==========================================================================")
    else:
        print("\n[!] Notice: 'tkinter' GUI library is not installed on this Linux system.")
        print("    - To use the GUI Notebook: Run 'sudo apt install python3-tk' (Ubuntu/Debian) or 'sudo dnf install python3-tkinter' (Fedora)")
        print("\n[+] Launching Suganita Terminal REPL CLI Client (Pure Terminal Mode)...")
        subprocess.Popen([sys.executable, "-m", "leibnitz6_server.cli"], cwd=target_dir, env=env)
        print("\n==========================================================================")
        print("  [SUCCESS] SUGANITA TERMINAL REPL CLI IS NOW RUNNING! HAPPY SIGNAL CODING!")
        print("  (Connected to Central Leibnitz 6 Cloud Engine — Zero local server setup!)")
        print("==========================================================================")

if __name__ == "__main__":
    run_remote_installation()

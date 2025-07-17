#!/usr/bin/env python3
import os
import sys
import subprocess

def check_virtualenv():
    if hasattr(sys, 'real_prefix') or (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix):
        print("✅ Estás dentro de un entorno virtual.")
    else:
        print("❌ No estás en un entorno virtual.")
        print("👉 Activá tu entorno con: source venv/bin/activate")
        return False
    return True

def check_python_path():
    print(f"🧠 Intérprete actual: {sys.executable}")

def check_installed_packages():
    try:
        import dotenv
        print("⚠️ Tenés instalado el paquete conflictivo: `dotenv` (no recomendado).")
    except ImportError:
        print("✅ No está instalado el paquete conflictivo `dotenv`.")

    try:
        import dotenv as correct_dotenv
        print("✅ `python-dotenv` parece estar presente.")
    except ImportError:
        print("❌ Falta `python-dotenv`. Instalalo con:")
        print("   pip install python-dotenv")

def run():
    print("🔍 Verificando entorno virtual y dependencias...\n")
    if check_virtualenv():
        check_python_path()
        check_installed_packages()

if __name__ == "__main__":
    run()
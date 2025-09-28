@echo off
REM This batch file automates the process of building the installer for the Advocacia application.

REM Step 1: Install dependencies from requirements.txt
echo Installing dependencies...
pip install -r ..\requirements.txt

REM Step 2: Use PyInstaller to create an executable from src/main.py
echo Building the executable...
pyinstaller --onefile --windowed ..\src\main.py

REM Step 3: Move the executable to a designated folder (optional)
if exist dist (
    echo Moving executable to installer folder...
    move dist\main.exe ..\installer\
) else (
    echo Build failed. Executable not found.
)

REM Step 4: Clean up temporary files created by PyInstaller
echo Cleaning up...
rmdir /s /q build
rmdir /s /q dist
del ..\main.spec

echo Installer build process completed.
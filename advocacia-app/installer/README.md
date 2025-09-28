# AdvocaciaApp - Instalador Python

## Como gerar o executável no Windows

1. Instale as dependências:
   ```
pip install -r ../requirements.txt
   ```
2. Gere o executável com PyInstaller:
   ```
pyinstaller --onefile --windowed ../src/main.py
   ```
3. (Opcional) Use o Inno Setup para criar um instalador amigável:
   - Abra `AdvocaciaAppSetup.iss` no Inno Setup e compile.

## Autor
Lucas Lima

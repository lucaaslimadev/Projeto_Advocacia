; Script de instalador para o Inno Setup
; Gere o main.exe com PyInstaller antes de rodar este script

[Setup]
AppName=Sistema de Petições - Advocacia
AppVersion=1.0
DefaultDirName={pf}\AdvocaciaApp
DefaultGroupName=AdvocaciaApp
OutputBaseFilename=AdvocaciaAppSetup
Compression=lzma
SolidCompression=yes

[Files]
Source: "main.exe"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{group}\Sistema de Petições"; Filename: "{app}\main.exe"
Name: "{group}\Desinstalar Sistema de Petições"; Filename: "{uninstallexe}"

[Run]
Filename: "{app}\main.exe"; Description: "Executar o Sistema de Petições"; Flags: nowait postinstall skipifsilent

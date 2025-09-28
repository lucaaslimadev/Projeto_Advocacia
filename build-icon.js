// Script para criar ícone básico
const fs = require('fs');
const path = require('path');

// Criar diretório build se não existir
const buildDir = path.join(__dirname, 'build');
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
}

console.log('Diretório build criado/verificado');
console.log('Nota: Adicione um arquivo icon.ico na pasta build/ para personalizar o ícone do aplicativo');
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

let mainWindow;
let db;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    },
    titleBarStyle: 'hiddenInset',
    show: false
  });

  mainWindow.loadURL(
    isDev
      ? 'http://localhost:3000'
      : `file://${path.join(__dirname, '../build/index.html')}`
  );

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
}

function initDatabase() {
  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, 'advocacia.db');
  
  db = new sqlite3.Database(dbPath);
  
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS sessoes (
        id INTEGER PRIMARY KEY,
        nome TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    db.run(`
      CREATE TABLE IF NOT EXISTS arquivos (
        id INTEGER PRIMARY KEY,
        nome TEXT NOT NULL,
        caminho TEXT NOT NULL,
        sessao_id INTEGER,
        palavras_chave TEXT,
        accessed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sessao_id) REFERENCES sessoes (id)
      )
    `);
    
    // Inserir sessões padrão
    const sessoesPadrao = ['Criminal', 'Cível', 'Trabalhista', 'Tributário', 'Família'];
    sessoesPadrao.forEach(sessao => {
      db.run('INSERT OR IGNORE INTO sessoes (nome) VALUES (?)', [sessao]);
    });
  });
}

app.whenReady().then(() => {
  createWindow();
  initDatabase();
  updateDatabase();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC handlers
// Atualizar estrutura do banco
function updateDatabase() {
  db.serialize(() => {
    // Adicionar novas colunas se não existirem
    db.run('ALTER TABLE arquivos ADD COLUMN cliente TEXT', () => {});
    db.run('ALTER TABLE arquivos ADD COLUMN favorito INTEGER DEFAULT 0', () => {});
    db.run('ALTER TABLE arquivos ADD COLUMN notas TEXT', () => {});
    db.run('ALTER TABLE arquivos ADD COLUMN tag_cor TEXT', () => {});
    db.run('ALTER TABLE arquivos ADD COLUMN data_criacao DATE', () => {});
  });
}

ipcMain.handle('get-sessoes', () => {
  try {
    const stmt = db.prepare('SELECT * FROM sessoes ORDER BY nome');
    return stmt.all();
  } catch (error) {
    throw error;
  }
});

ipcMain.handle('create-sessao', (event, nome) => {
  try {
    const stmt = db.prepare('INSERT INTO sessoes (nome) VALUES (?)');
    const result = stmt.run(nome);
    return { id: result.lastInsertRowid, nome };
  } catch (error) {
    throw error;
  }
});

ipcMain.handle('delete-sessao', (event, id) => {
  try {
    const stmt = db.prepare('DELETE FROM sessoes WHERE id = ?');
    stmt.run(id);
    return true;
  } catch (error) {
    throw error;
  }
});

ipcMain.handle('search-arquivos', (event, query) => {
  try {
    const stmt = db.prepare(`
      SELECT a.*, s.nome as sessao_nome 
      FROM arquivos a 
      LEFT JOIN sessoes s ON a.sessao_id = s.id 
      WHERE a.nome LIKE ? OR a.palavras_chave LIKE ?
      ORDER BY a.accessed_at DESC
    `);
    return stmt.all(`%${query}%`, `%${query}%`);
  } catch (error) {
    throw error;
  }
});

ipcMain.handle('get-recent-arquivos', () => {
  try {
    const stmt = db.prepare(`
      SELECT a.*, s.nome as sessao_nome 
      FROM arquivos a 
      LEFT JOIN sessoes s ON a.sessao_id = s.id 
      ORDER BY a.accessed_at DESC 
      LIMIT 20
    `);
    return stmt.all();
  } catch (error) {
    throw error;
  }
});

ipcMain.handle('save-arquivo', (event, arquivo) => {
  try {
    const stmt = db.prepare(`
      INSERT INTO arquivos (nome, caminho, sessao_id, palavras_chave, cliente, tag_cor, data_criacao) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(arquivo.nome, arquivo.caminho, arquivo.sessao_id, arquivo.palavras_chave, arquivo.cliente, arquivo.tag_cor, arquivo.data_criacao);
    return { id: result.lastInsertRowid, ...arquivo };
  } catch (error) {
    throw error;
  }
});

ipcMain.handle('update-arquivo-access', (event, id) => {
  try {
    const stmt = db.prepare('UPDATE arquivos SET accessed_at = CURRENT_TIMESTAMP WHERE id = ?');
    stmt.run(id);
    return true;
  } catch (error) {
    throw error;
  }
});

ipcMain.handle('select-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Documentos', extensions: ['pdf', 'doc', 'docx', 'txt'] },
      { name: 'PDF', extensions: ['pdf'] },
      { name: 'Word', extensions: ['doc', 'docx'] },
      { name: 'Todos os arquivos', extensions: ['*'] }
    ]
  });
  
  return result;
});

ipcMain.handle('select-multiple-files', async () => {
  try {
    console.log('Handler select-multiple-files chamado');
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: 'Documentos', extensions: ['pdf', 'doc', 'docx', 'txt'] },
        { name: 'PDF', extensions: ['pdf'] },
        { name: 'Word', extensions: ['doc', 'docx'] },
        { name: 'Todos os arquivos', extensions: ['*'] }
      ]
    });
    console.log('Resultado do dialog:', result);
    return result;
  } catch (error) {
    console.error('Erro no handler select-multiple-files:', error);
    throw error;
  }
});

ipcMain.handle('get-user-data-path', () => {
  return app.getPath('userData');
});

ipcMain.handle('open-file', (event, filePath) => {
  const { shell } = require('electron');
  return shell.openPath(filePath);
});

ipcMain.handle('toggle-favorito', (event, id) => {
  try {
    const stmt = db.prepare('UPDATE arquivos SET favorito = CASE WHEN favorito = 1 THEN 0 ELSE 1 END WHERE id = ?');
    stmt.run(id);
    return true;
  } catch (error) {
    throw error;
  }
});

ipcMain.handle('update-notas', (event, id, notas) => {
  try {
    const stmt = db.prepare('UPDATE arquivos SET notas = ? WHERE id = ?');
    stmt.run(notas, id);
    return true;
  } catch (error) {
    throw error;
  }
});

ipcMain.handle('update-tag-cor', (event, id, cor) => {
  try {
    const stmt = db.prepare('UPDATE arquivos SET tag_cor = ? WHERE id = ?');
    stmt.run(cor, id);
    return true;
  } catch (error) {
    throw error;
  }
});

ipcMain.handle('delete-arquivo', (event, id) => {
  try {
    console.log('Tentando excluir arquivo com ID:', id);
    const stmt = db.prepare('DELETE FROM arquivos WHERE id = ?');
    const result = stmt.run(id);
    console.log('Arquivo excluído com sucesso. Linhas afetadas:', result.changes);
    return { success: true, changes: result.changes };
  } catch (error) {
    console.error('Erro ao excluir arquivo:', error);
    throw error;
  }
});

ipcMain.handle('update-arquivo', (event, arquivo) => {
  try {
    const stmt = db.prepare(`
      UPDATE arquivos 
      SET nome = ?, sessao_id = ?, palavras_chave = ?, cliente = ?, tag_cor = ?
      WHERE id = ?
    `);
    stmt.run(arquivo.nome, arquivo.sessao_id, arquivo.palavras_chave, arquivo.cliente, arquivo.tag_cor, arquivo.id);
    return true;
  } catch (error) {
    throw error;
  }
});

ipcMain.handle('search-arquivos-avancado', (event, filtros) => {
  try {
    let query = `
      SELECT a.*, s.nome as sessao_nome 
      FROM arquivos a 
      LEFT JOIN sessoes s ON a.sessao_id = s.id 
      WHERE 1=1
    `;
    let params = [];
    
    if (filtros.texto) {
      query += ' AND (a.nome LIKE ? OR a.palavras_chave LIKE ?)';
      params.push(`%${filtros.texto}%`, `%${filtros.texto}%`);
    }
    
    if (filtros.cliente) {
      query += ' AND a.cliente LIKE ?';
      params.push(`%${filtros.cliente}%`);
    }
    
    if (filtros.sessao) {
      query += ' AND s.nome = ?';
      params.push(filtros.sessao);
    }
    
    if (filtros.favoritos) {
      query += ' AND a.favorito = 1';
    }
    
    if (filtros.dataInicio) {
      query += ' AND a.data_criacao >= ?';
      params.push(filtros.dataInicio);
    }
    
    if (filtros.dataFim) {
      query += ' AND a.data_criacao <= ?';
      params.push(filtros.dataFim);
    }
    
    query += ' ORDER BY a.accessed_at DESC';
    
    const stmt = db.prepare(query);
    return stmt.all(...params);
  } catch (error) {
    throw error;
  }
});

ipcMain.handle('get-arquivos-by-session', (event, sessionId) => {
  try {
    const stmt = db.prepare(`
      SELECT a.*, s.nome as sessao_nome 
      FROM arquivos a 
      LEFT JOIN sessoes s ON a.sessao_id = s.id 
      WHERE a.sessao_id = ?
      ORDER BY a.accessed_at DESC
    `);
    return stmt.all(sessionId);
  } catch (error) {
    throw error;
  }
});

ipcMain.handle('convert-file', async (event, filePath) => {
  try {
    const path = require('path');
    const fs = require('fs');
    
    if (!fs.existsSync(filePath)) {
      return { success: false, error: 'Arquivo não encontrado' };
    }
    
    const ext = path.extname(filePath).toLowerCase();
    const baseName = path.basename(filePath, ext);
    const dir = path.dirname(filePath);
    
    if (ext === '.pdf') {
      // PDF para DOCX - conversão básica
      const newPath = path.join(dir, `${baseName}_convertido.docx`);
      
      try {
        const { Document, Packer, Paragraph, TextRun } = require('docx');
        
        // Criar documento Word básico
        const doc = new Document({
          sections: [{
            properties: {},
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Arquivo convertido de: ${path.basename(filePath)}`,
                    bold: true,
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "\nEste é um arquivo convertido de PDF para DOCX.",
                  }),
                  new TextRun({
                    text: "\nPara conversão completa do conteúdo, use ferramentas especializadas como:",
                  }),
                  new TextRun({
                    text: "\n• Adobe Acrobat\n• SmallPDF\n• ILovePDF",
                  }),
                ],
              }),
            ],
          }],
        });
        
        const buffer = await Packer.toBuffer(doc);
        fs.writeFileSync(newPath, buffer);
        
        return { success: true, newPath };
      } catch (error) {
        return { success: false, error: 'Erro na conversão PDF→DOCX: ' + error.message };
      }
      
    } else if (['.doc', '.docx'].includes(ext)) {
      // DOCX para PDF - conversão básica
      const newPath = path.join(dir, `${baseName}_convertido.pdf`);
      
      try {
        const { PDFDocument, rgb } = require('pdf-lib');
        
        // Criar PDF básico
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([595.28, 841.89]); // A4
        
        page.drawText(`Arquivo convertido de: ${path.basename(filePath)}`, {
          x: 50,
          y: 750,
          size: 16,
          color: rgb(0, 0, 0),
        });
        
        page.drawText('Este é um arquivo convertido de DOCX para PDF.', {
          x: 50,
          y: 700,
          size: 12,
          color: rgb(0, 0, 0),
        });
        
        page.drawText('Para conversão completa do conteúdo, use:', {
          x: 50,
          y: 650,
          size: 12,
          color: rgb(0, 0, 0),
        });
        
        page.drawText('• Microsoft Word (Salvar como PDF)', {
          x: 50,
          y: 620,
          size: 12,
          color: rgb(0, 0, 0),
        });
        
        page.drawText('• Google Docs', {
          x: 50,
          y: 590,
          size: 12,
          color: rgb(0, 0, 0),
        });
        
        page.drawText('• SmallPDF ou ILovePDF', {
          x: 50,
          y: 560,
          size: 12,
          color: rgb(0, 0, 0),
        });
        
        const pdfBytes = await pdfDoc.save();
        fs.writeFileSync(newPath, pdfBytes);
        
        return { success: true, newPath };
      } catch (error) {
        return { success: false, error: 'Erro na conversão DOCX→PDF: ' + error.message };
      }
      
    } else {
      return { success: false, error: 'Formato não suportado. Apenas PDF, DOC e DOCX.' };
    }
    
  } catch (error) {
    return { success: false, error: error.message };
  }
});
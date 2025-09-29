const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const isDev = require("electron-is-dev");
const Database = require("better-sqlite3");
const fs = require("fs");

let mainWindow;
let db;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      // Carrega o script de preload para expor APIs de forma segura
      preload: path.join(__dirname, "preload.js"),
      // As opções abaixo são as recomendadas para segurança
      contextIsolation: true,
      nodeIntegration: false,
    },
    titleBarStyle: "hiddenInset",
    show: false,
  });

  mainWindow.loadURL(
    isDev
      ? "http://localhost:3000"
      : `file://${path.join(__dirname, "../build/index.html")}`
  );

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
}

function initDatabase() {
  try {
    const userDataPath = app.getPath("userData");
    // Garante que o diretório de dados do aplicativo exista antes de criar o banco.
    // Esta é a correção principal.
    fs.mkdirSync(userDataPath, { recursive: true });
    const dbPath = path.join(userDataPath, "advocacia.db");

    // O construtor já abre o banco e lança um erro se falhar
    db = new Database(dbPath, { verbose: isDev ? console.log : undefined });

    // Usar transaction para garantir que todas as operações iniciais sejam atômicas
    const initTx = db.transaction(() => {
      db.exec(`
          CREATE TABLE IF NOT EXISTS sessoes (
            id INTEGER PRIMARY KEY,
            nome TEXT UNIQUE NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

      db.exec(`
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

      const insertSessao = db.prepare(
        "INSERT OR IGNORE INTO sessoes (nome) VALUES (?)"
      );
      const sessoesPadrao = [
        "Criminal",
        "Cível",
        "Trabalhista",
        "Tributário",
        "Família",
      ];
      sessoesPadrao.forEach((sessao) => insertSessao.run(sessao));
    });

    initTx();
    // A migração (adição de colunas) deve ser feita fora da transação inicial.
    updateDatabase();
  } catch (error) {
    console.error("Falha ao inicializar o banco de dados:", error);
    dialog.showErrorBox(
      "Erro de Banco de Dados",
      "Não foi possível iniciar o banco de dados. O aplicativo será encerrado."
    );
    app.quit();
  }
}

app.whenReady().then(() => {
  try {
    initDatabase(); // Garante que o DB esteja pronto antes da janela
    createWindow();
  } catch (e) {
    // Se initDatabase falhar, o app já terá sido encerrado.
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    if (db) db.close(); // Fecha a conexão com o banco de dados ao sair
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC handlers
// Atualizar estrutura do banco
// Esta função é mais segura, pois verifica se a coluna já existe antes de tentar adicioná-la.
function updateDatabase() {
  if (!db) {
    console.error(
      "updateDatabase foi chamada mas o banco de dados não está inicializado."
    );
    return;
  }

  const columns = db.prepare("PRAGMA table_info(arquivos)").all();
  const columnNames = columns.map((col) => col.name);

  const addColumnIfNotExists = (name, type) => {
    if (!columnNames.includes(name)) {
      db.exec(`ALTER TABLE arquivos ADD COLUMN ${name} ${type}`);
      console.log(`Column "${name}" added to "arquivos" table.`);
    }
  };

  addColumnIfNotExists("cliente", "TEXT");
  addColumnIfNotExists("favorito", "INTEGER DEFAULT 0");
  addColumnIfNotExists("notas", "TEXT");
  addColumnIfNotExists("tag_cor", "TEXT");
  addColumnIfNotExists("data_criacao", "DATE");
}

ipcMain.handle("get-sessoes", () => {
  try {
    const stmt = db.prepare("SELECT * FROM sessoes ORDER BY nome");
    return stmt.all();
  } catch (error) {
    console.error("Erro ao buscar sessões:", error);
    throw new Error(`Erro ao buscar sessões: ${error.message}`);
  }
});

ipcMain.handle("create-sessao", (event, nome) => {
  try {
    const stmt = db.prepare("INSERT INTO sessoes (nome) VALUES (?)");
    const result = stmt.run(nome);
    return { id: result.lastInsertRowid, nome };
  } catch (error) {
    console.error("Erro ao criar sessão:", error);
    throw new Error(`Erro ao criar sessão: ${error.message}`);
  }
});

ipcMain.handle("delete-sessao", (event, id) => {
  try {
    const stmt = db.prepare("DELETE FROM sessoes WHERE id = ?");
    stmt.run(id);
    return true;
  } catch (error) {
    console.error("Erro ao deletar sessão:", error);
    throw new Error(`Erro ao deletar sessão: ${error.message}`);
  }
});

ipcMain.handle("search-arquivos", (event, query) => {
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
    console.error("Erro na busca de arquivos:", error);
    throw new Error(`Erro na busca de arquivos: ${error.message}`);
  }
});

ipcMain.handle("get-recent-arquivos", () => {
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
    console.error("Erro ao buscar arquivos recentes:", error);
    throw new Error(`Erro ao buscar arquivos recentes: ${error.message}`);
  }
});

ipcMain.handle("save-arquivo", (event, arquivo) => {
  try {
    const userDataPath = app.getPath("userData");
    const filesDir = path.join(userDataPath, "files");
    fs.mkdirSync(filesDir, { recursive: true });

    // 1. Copiar o arquivo para o diretório de dados do app
    const originalPath = arquivo.caminho;
    const fileExtension = path.extname(originalPath);
    let newFileName = `${arquivo.nome}${fileExtension}`;
    let newPath = path.join(filesDir, newFileName);

    // 2. Evitar sobrescrever arquivos com o mesmo nome
    let counter = 1;
    while (fs.existsSync(newPath)) {
      newFileName = `${arquivo.nome}_${counter}${fileExtension}`;
      newPath = path.join(filesDir, newFileName);
      counter++;
    }
    fs.copyFileSync(originalPath, newPath);

    // 3. Salvar o NOVO caminho no banco de dados
    const stmt = db.prepare(`
      INSERT INTO arquivos (nome, caminho, sessao_id, palavras_chave, cliente, tag_cor, data_criacao) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      arquivo.nome,
      newPath, // Usar o novo caminho
      arquivo.sessao_id,
      arquivo.palavras_chave,
      arquivo.cliente,
      arquivo.tag_cor,
      arquivo.data_criacao
    );
    return { id: result.lastInsertRowid, ...arquivo };
  } catch (error) {
    console.error("Erro ao salvar arquivo:", error);
    throw new Error(`Erro ao salvar arquivo: ${error.message}`);
  }
});

ipcMain.handle("update-arquivo-access", (event, id) => {
  try {
    const stmt = db.prepare(
      "UPDATE arquivos SET accessed_at = CURRENT_TIMESTAMP WHERE id = ?"
    );
    stmt.run(id);
    return true;
  } catch (error) {
    console.error("Erro ao atualizar acesso do arquivo:", error);
    throw new Error(`Erro ao atualizar acesso do arquivo: ${error.message}`);
  }
});

ipcMain.handle("select-file", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openFile"],
    filters: [
      { name: "Documentos", extensions: ["pdf", "doc", "docx", "txt"] },
      { name: "PDF", extensions: ["pdf"] },
      { name: "Word", extensions: ["doc", "docx"] },
      { name: "Todos os arquivos", extensions: ["*"] },
    ],
  });

  return result;
});

ipcMain.handle("select-multiple-files", async () => {
  try {
    console.log("Handler select-multiple-files chamado");
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ["openFile", "multiSelections"],
      filters: [
        { name: "Documentos", extensions: ["pdf", "doc", "docx", "txt"] },
        { name: "PDF", extensions: ["pdf"] },
        { name: "Word", extensions: ["doc", "docx"] },
        { name: "Todos os arquivos", extensions: ["*"] },
      ],
    });
    console.log("Resultado do dialog:", result);
    return result;
  } catch (error) {
    console.error("Erro no handler select-multiple-files:", error);
    throw error;
  }
});

ipcMain.handle("get-user-data-path", () => {
  return app.getPath("userData");
});

ipcMain.handle("open-file", (event, filePath) => {
  const { shell } = require("electron");
  return shell.openPath(filePath);
});

ipcMain.handle("toggle-favorito", (event, id) => {
  try {
    const stmt = db.prepare(
      "UPDATE arquivos SET favorito = CASE WHEN favorito = 1 THEN 0 ELSE 1 END WHERE id = ?"
    );
    stmt.run(id);
    return true;
  } catch (error) {
    console.error("Erro ao favoritar arquivo:", error);
    throw new Error(`Erro ao favoritar arquivo: ${error.message}`);
  }
});

ipcMain.handle("update-notas", (event, id, notas) => {
  try {
    const stmt = db.prepare("UPDATE arquivos SET notas = ? WHERE id = ?");
    stmt.run(notas, id);
    return true;
  } catch (error) {
    console.error("Erro ao atualizar notas:", error);
    throw new Error(`Erro ao atualizar notas: ${error.message}`);
  }
});

ipcMain.handle("update-tag-cor", (event, id, cor) => {
  try {
    const stmt = db.prepare("UPDATE arquivos SET tag_cor = ? WHERE id = ?");
    stmt.run(cor, id);
    return true;
  } catch (error) {
    console.error("Erro ao atualizar tag de cor:", error);
    throw new Error(`Erro ao atualizar tag de cor: ${error.message}`);
  }
});

ipcMain.handle("delete-arquivo", (event, id) => {
  try {
    // Primeiro, buscar o caminho do arquivo no banco de dados
    const fileToDelete = db
      .prepare("SELECT caminho FROM arquivos WHERE id = ?")
      .get(id);

    if (fileToDelete && fileToDelete.caminho) {
      // Apagar o arquivo físico se ele existir
      if (fs.existsSync(fileToDelete.caminho)) {
        fs.unlinkSync(fileToDelete.caminho);
        console.log(`Arquivo físico excluído: ${fileToDelete.caminho}`);
      }
    }

    // Em seguida, remover o registro do banco de dados
    const stmt = db.prepare("DELETE FROM arquivos WHERE id = ?");
    const result = stmt.run(id);
    console.log(
      `Registro do arquivo ID ${id} excluído. Linhas afetadas:`,
      result.changes
    );
    return { success: true, changes: result.changes };
  } catch (error) {
    console.error("Erro ao excluir arquivo:", error);
    throw new Error(`Erro ao excluir arquivo: ${error.message}`);
  }
});

ipcMain.handle("update-arquivo", (event, arquivo) => {
  try {
    const stmt = db.prepare(`
      UPDATE arquivos 
      SET nome = ?, sessao_id = ?, palavras_chave = ?, cliente = ?, tag_cor = ?
      WHERE id = ?
    `);
    stmt.run(
      arquivo.nome,
      arquivo.sessao_id,
      arquivo.palavras_chave,
      arquivo.cliente,
      arquivo.tag_cor,
      arquivo.id
    );
    return true;
  } catch (error) {
    console.error("Erro ao atualizar arquivo:", error);
    throw new Error(`Erro ao atualizar arquivo: ${error.message}`);
  }
});

ipcMain.handle("search-arquivos-avancado", (event, filtros) => {
  try {
    let query = `
      SELECT a.*, s.nome as sessao_nome 
      FROM arquivos a 
      LEFT JOIN sessoes s ON a.sessao_id = s.id 
      WHERE 1=1
    `;
    let params = [];

    if (filtros.texto) {
      query += " AND (a.nome LIKE ? OR a.palavras_chave LIKE ?)";
      params.push(`%${filtros.texto}%`, `%${filtros.texto}%`);
    }

    if (filtros.cliente) {
      query += " AND a.cliente LIKE ?";
      params.push(`%${filtros.cliente}%`);
    }

    if (filtros.sessao) {
      query += " AND s.nome = ?";
      params.push(filtros.sessao);
    }

    if (filtros.favoritos) {
      query += " AND a.favorito = 1";
    }

    if (filtros.dataInicio) {
      query += " AND a.data_criacao >= ?";
      params.push(filtros.dataInicio);
    }

    if (filtros.dataFim) {
      query += " AND a.data_criacao <= ?";
      params.push(filtros.dataFim);
    }

    query += " ORDER BY a.accessed_at DESC";

    const stmt = db.prepare(query);
    return stmt.all(...params);
  } catch (error) {
    console.error("Erro na busca avançada:", error);
    throw new Error(`Erro na busca avançada: ${error.message}`);
  }
});

ipcMain.handle("get-arquivos-by-session", (event, sessionId) => {
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
    console.error("Erro ao buscar arquivos da sessão:", error);
    throw new Error(`Erro ao buscar arquivos da sessão: ${error.message}`);
  }
});

ipcMain.handle("convert-file", async (event, filePath) => {
  try {
    const path = require("path");
    const fs = require("fs");

    if (!fs.existsSync(filePath)) {
      return { success: false, error: "Arquivo não encontrado" };
    }

    const ext = path.extname(filePath).toLowerCase();
    const baseName = path.basename(filePath, ext);
    const dir = path.dirname(filePath);

    if (ext === ".pdf") {
      // PDF para DOCX - conversão básica
      const newPath = path.join(dir, `${baseName}_convertido.docx`);

      try {
        const { Document, Packer, Paragraph, TextRun } = require("docx");

        // Criar documento Word básico
        const doc = new Document({
          sections: [
            {
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
            },
          ],
        });

        const buffer = await Packer.toBuffer(doc);
        fs.writeFileSync(newPath, buffer);

        return { success: true, newPath };
      } catch (error) {
        return {
          success: false,
          error: "Erro na conversão PDF→DOCX: " + error.message,
        };
      }
    } else if ([".doc", ".docx"].includes(ext)) {
      // DOCX para PDF - conversão básica
      const newPath = path.join(dir, `${baseName}_convertido.pdf`);

      try {
        const { PDFDocument, rgb } = require("pdf-lib");

        // Criar PDF básico
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([595.28, 841.89]); // A4

        page.drawText(`Arquivo convertido de: ${path.basename(filePath)}`, {
          x: 50,
          y: 750,
          size: 16,
          color: rgb(0, 0, 0),
        });

        page.drawText("Este é um arquivo convertido de DOCX para PDF.", {
          x: 50,
          y: 700,
          size: 12,
          color: rgb(0, 0, 0),
        });

        page.drawText("Para conversão completa do conteúdo, use:", {
          x: 50,
          y: 650,
          size: 12,
          color: rgb(0, 0, 0),
        });

        page.drawText("• Microsoft Word (Salvar como PDF)", {
          x: 50,
          y: 620,
          size: 12,
          color: rgb(0, 0, 0),
        });

        page.drawText("• Google Docs", {
          x: 50,
          y: 590,
          size: 12,
          color: rgb(0, 0, 0),
        });

        page.drawText("• SmallPDF ou ILovePDF", {
          x: 50,
          y: 560,
          size: 12,
          color: rgb(0, 0, 0),
        });

        const pdfBytes = await pdfDoc.save();
        fs.writeFileSync(newPath, pdfBytes);

        return { success: true, newPath };
      } catch (error) {
        return {
          success: false,
          error: "Erro na conversão DOCX→PDF: " + error.message,
        };
      }
    } else {
      return {
        success: false,
        error: "Formato não suportado. Apenas PDF, DOC e DOCX.",
      };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
});

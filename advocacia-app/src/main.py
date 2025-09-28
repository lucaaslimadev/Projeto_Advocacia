# filepath: /advocacia-app/advocacia-app/src/main.py
import tkinter as tk
from tkinter import ttk, filedialog, messagebox
import sqlite3
import os
import shutil
from pathlib import Path
import subprocess
import platform
from datetime import datetime

class AdvocaciaApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Sistema de Petições - Advocacia")
        self.root.geometry("1200x800")
        self.root.configure(bg='#f0f0f0')
        
        # Criar diretório de dados
        self.data_dir = Path("data")
        self.data_dir.mkdir(exist_ok=True)
        self.files_dir = self.data_dir / "files"
        
        self.files_dir.mkdir(exist_ok=True)
        
        self.init_database()
        self.create_widgets()
        self.load_recent_files()
        
    def init_database(self):
        self.conn = sqlite3.connect(self.data_dir / "advocacia.db")
        cursor = self.conn.cursor()
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS sessoes (
                id INTEGER PRIMARY KEY,
                nome TEXT UNIQUE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS arquivos (
                id INTEGER PRIMARY KEY,
                nome TEXT NOT NULL,
                caminho TEXT NOT NULL,
                sessao_id INTEGER,
                palavras_chave TEXT,
                accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (sessao_id) REFERENCES sessoes (id)
            )
        ''')
        
        # Inserir sessões padrão
        sessoes_padrao = ['Criminal', 'Cível', 'Trabalhista', 'Tributário', 'Família']
        for sessao in sessoes_padrao:
            cursor.execute('INSERT OR IGNORE INTO sessoes (nome) VALUES (?)', (sessao,))
        
        self.conn.commit()
    
    def create_widgets(self):
        # Frame principal
        main_frame = ttk.Frame(self.root, padding="20")
        main_frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # Título
        title_label = ttk.Label(main_frame, text="Sistema de Petições", 
                               font=('Arial', 24, 'bold'))
        title_label.grid(row=0, column=0, columnspan=3, pady=(0, 20))
        
        # Frame de pesquisa
        search_frame = ttk.LabelFrame(main_frame, text="Pesquisar Documentos", padding="10")
        search_frame.grid(row=1, column=0, columnspan=3, sticky=(tk.W, tk.E), pady=(0, 20))
        
        self.search_var = tk.StringVar()
        self.search_var.trace('w', self.on_search_change)
        search_entry = ttk.Entry(search_frame, textvariable=self.search_var, 
                                font=('Arial', 12), width=50)
        search_entry.grid(row=0, column=0, padx=(0, 10))
        
        search_btn = ttk.Button(search_frame, text="Pesquisar", 
                               command=self.search_files)
        search_btn.grid(row=0, column=1)
        
        # Notebook para abas
        self.notebook = ttk.Notebook(main_frame)
        self.notebook.grid(row=2, column=0, columnspan=3, sticky=(tk.W, tk.E, tk.N, tk.S), pady=(0, 20))
        
        # Aba de resultados de pesquisa
        self.search_frame = ttk.Frame(self.notebook)
        self.notebook.add(self.search_frame, text="Resultados da Pesquisa")
        
        # Aba de arquivos recentes
        self.recent_frame = ttk.Frame(self.notebook)
        self.notebook.add(self.recent_frame, text="Arquivos Recentes")
        
        # Criar listas para as abas
        self.create_file_lists()
        
        # Frame de ações
        actions_frame = ttk.Frame(main_frame)
        actions_frame.grid(row=3, column=0, columnspan=3, pady=(0, 20))
        
        # Botões de ação
        upload_btn = ttk.Button(actions_frame, text="Upload de Arquivo", 
                               command=self.upload_file, style='Accent.TButton')
        upload_btn.grid(row=0, column=0, padx=(0, 10))
        
        session_btn = ttk.Button(actions_frame, text="Gerenciar Sessões", 
                                command=self.manage_sessions)
        session_btn.grid(row=0, column=1, padx=(0, 10))
        
        export_btn = ttk.Button(actions_frame, text="Converter PDF ↔ Word", 
                               command=self.convert_files)
        export_btn.grid(row=0, column=2)
        
        # Configurar redimensionamento
        self.root.columnconfigure(0, weight=1)
        self.root.rowconfigure(0, weight=1)
        main_frame.columnconfigure(0, weight=1)
        main_frame.rowconfigure(2, weight=1)
    
    def create_file_lists(self):
        # Lista de resultados de pesquisa
        search_tree = ttk.Treeview(self.search_frame, columns=('Sessão', 'Palavras-chave'), show='tree headings')
        search_tree.heading('#0', text='Nome do Arquivo')
        search_tree.heading('Sessão', text='Sessão')
        search_tree.heading('Palavras-chave', text='Palavras-chave')
        search_tree.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S), padx=10, pady=10)
        
        search_scroll = ttk.Scrollbar(self.search_frame, orient=tk.VERTICAL, command=search_tree.yview)
        search_scroll.grid(row=0, column=1, sticky=(tk.N, tk.S))
        search_tree.configure(yscrollcommand=search_scroll.set)
        
        self.search_tree = search_tree
        search_tree.bind('<Double-1>', self.open_file)
        
        # Lista de arquivos recentes
        recent_tree = ttk.Treeview(self.recent_frame, columns=('Sessão', 'Último Acesso'), show='tree headings')
        recent_tree.heading('#0', text='Nome do Arquivo')
        recent_tree.heading('Sessão', text='Sessão')
        recent_tree.heading('Último Acesso', text='Último Acesso')
        recent_tree.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S), padx=10, pady=10)
        
        recent_scroll = ttk.Scrollbar(self.recent_frame, orient=tk.VERTICAL, command=recent_tree.yview)
        recent_scroll.grid(row=0, column=1, sticky=(tk.N, tk.S))
        recent_tree.configure(yscrollcommand=recent_scroll.set)
        
        self.recent_tree = recent_tree
        recent_tree.bind('<Double-1>', self.open_file)
        
        # Configurar redimensionamento das abas
        self.search_frame.columnconfigure(0, weight=1)
        self.search_frame.rowconfigure(0, weight=1)
        self.recent_frame.columnconfigure(0, weight=1)
        self.recent_frame.rowconfigure(0, weight=1)
    
    def on_search_change(self, *args):
        if len(self.search_var.get()) >= 2:
            self.search_files()
    
    def search_files(self):
        query = self.search_var.get().strip()
        if not query:
            return
        
        cursor = self.conn.cursor()
        cursor.execute('''
            SELECT a.nome, s.nome, a.palavras_chave, a.caminho, a.id
            FROM arquivos a
            LEFT JOIN sessoes s ON a.sessao_id = s.id
            WHERE a.nome LIKE ? OR a.palavras_chave LIKE ?
            ORDER BY a.accessed_at DESC
        ''', (f'%{query}%', f'%{query}%'))
        
        # Limpar resultados anteriores
        for item in self.search_tree.get_children():
            self.search_tree.delete(item)
        
        # Adicionar novos resultados
        for row in cursor.fetchall():
            nome, sessao, palavras_chave, caminho, arquivo_id = row
            self.search_tree.insert('', 'end', text=nome, 
                                   values=(sessao or 'Sem sessão', palavras_chave or ''),
                                   tags=(arquivo_id, caminho))
        
        # Mudar para aba de resultados
        self.notebook.select(0)
    
    def load_recent_files(self):
        cursor = self.conn.cursor()
        cursor.execute('''
            SELECT a.nome, s.nome, a.accessed_at, a.caminho, a.id
            FROM arquivos a
            LEFT JOIN sessoes s ON a.sessao_id = s.id
            ORDER BY a.accessed_at DESC
            LIMIT 20
        ''')
        
        # Limpar lista anterior
        for item in self.recent_tree.get_children():
            self.recent_tree.delete(item)
        
        # Adicionar arquivos recentes
        for row in cursor.fetchall():
            nome, sessao, accessed_at, caminho, arquivo_id = row
            self.recent_tree.insert('', 'end', text=nome,
                                   values=(sessao or 'Sem sessão', accessed_at),
                                   tags=(arquivo_id, caminho))
    
    def upload_file(self):
        file_path = filedialog.askopenfilename(
            title="Selecionar arquivo",
            filetypes=[
                ("Documentos", "*.pdf *.doc *.docx *.txt"),
                ("PDF", "*.pdf"),
                ("Word", "*.doc *.docx"),
                ("Todos os arquivos", "*.*")
            ]
        )
        
        if not file_path:
            return
        
        # Janela para configurar o arquivo
        self.configure_file_upload(file_path)
    
    def configure_file_upload(self, file_path):
        dialog = tk.Toplevel(self.root)
        dialog.title("Configurar Upload")
        dialog.geometry("400x300")
        dialog.transient(self.root)
        dialog.grab_set()
        
        # Nome do arquivo
        ttk.Label(dialog, text="Nome do arquivo:").grid(row=0, column=0, sticky=tk.W, padx=10, pady=5)
        name_var = tk.StringVar(value=Path(file_path).stem)
        ttk.Entry(dialog, textvariable=name_var, width=40).grid(row=0, column=1, padx=10, pady=5)
        
        # Sessão
        ttk.Label(dialog, text="Sessão:").grid(row=1, column=0, sticky=tk.W, padx=10, pady=5)
        session_var = tk.StringVar()
        session_combo = ttk.Combobox(dialog, textvariable=session_var, width=37)
        session_combo.grid(row=1, column=1, padx=10, pady=5)
        
        # Carregar sessões
        cursor = self.conn.cursor()
        cursor.execute('SELECT nome FROM sessoes ORDER BY nome')
        sessions = [row[0] for row in cursor.fetchall()]
        session_combo['values'] = sessions
        
        # Palavras-chave
        ttk.Label(dialog, text="Palavras-chave:").grid(row=2, column=0, sticky=tk.W, padx=10, pady=5)
        keywords_var = tk.StringVar()
        keywords_entry = tk.Text(dialog, width=30, height=4)
        keywords_entry.grid(row=2, column=1, padx=10, pady=5)
        
        # Botões
        button_frame = ttk.Frame(dialog)
        button_frame.grid(row=3, column=0, columnspan=2, pady=20)
        
        def save_file():
            nome = name_var.get().strip()
            sessao = session_var.get().strip()
            keywords = keywords_entry.get(1.0, tk.END).strip()
            
            if not nome:
                messagebox.showerror("Erro", "Nome do arquivo é obrigatório")
                return
            
            # Copiar arquivo para diretório de dados
            file_extension = Path(file_path).suffix
            new_filename = f"{nome}{file_extension}"
            new_path = self.files_dir / new_filename
            
            # Evitar sobrescrever arquivos
            counter = 1
            while new_path.exists():
                new_filename = f"{nome}_{counter}{file_extension}"
                new_path = self.files_dir / new_filename
                counter += 1
            
            shutil.copy2(file_path, new_path)
            
            # Salvar no banco de dados
            cursor = self.conn.cursor()
            sessao_id = None
            if sessao:
                cursor.execute('SELECT id FROM sessoes WHERE nome = ?', (sessao,))
                result = cursor.fetchone()
                if result:
                    sessao_id = result[0]
            
            cursor.execute('''
                INSERT INTO arquivos (nome, caminho, sessao_id, palavras_chave)
                VALUES (?, ?, ?, ?)
            ''', (nome, str(new_path), sessao_id, keywords))
            
            self.conn.commit()
            
            messagebox.showinfo("Sucesso", "Arquivo salvo com sucesso!")
            dialog.destroy()
            self.load_recent_files()
        
        ttk.Button(button_frame, text="Salvar", command=save_file).grid(row=0, column=0, padx=5)
        ttk.Button(button_frame, text="Cancelar", command=dialog.destroy).grid(row=0, column=1, padx=5)
    
    def manage_sessions(self):
        dialog = tk.Toplevel(self.root)
        dialog.title("Gerenciar Sessões")
        dialog.geometry("400x300")
        dialog.transient(self.root)
        dialog.grab_set()
        
        # Lista de sessões
        sessions_listbox = tk.Listbox(dialog, height=10)
        sessions_listbox.grid(row=0, column=0, columnspan=2, padx=10, pady=10, sticky=(tk.W, tk.E))
        
        # Carregar sessões
        def load_sessions():
            sessions_listbox.delete(0, tk.END)
            cursor = self.conn.cursor()
            cursor.execute('SELECT nome FROM sessoes ORDER BY nome')
            for row in cursor.fetchall():
                sessions_listbox.insert(tk.END, row[0])
        
        load_sessions()
        
        # Nova sessão
        ttk.Label(dialog, text="Nova sessão:").grid(row=1, column=0, sticky=tk.W, padx=10, pady=5)
        new_session_var = tk.StringVar()
        ttk.Entry(dialog, textvariable=new_session_var, width=30).grid(row=1, column=1, padx=10, pady=5)
        
        def add_session():
            nome = new_session_var.get().strip()
            if not nome:
                return
            
            cursor = self.conn.cursor()
            try:
                cursor.execute('INSERT INTO sessoes (nome) VALUES (?)', (nome,))
                self.conn.commit()
                new_session_var.set('')
                load_sessions()
            except sqlite3.IntegrityError:
                messagebox.showerror("Erro", "Sessão já existe")
        
        def delete_session():
            selection = sessions_listbox.curselection()
            if not selection:
                return
            
            nome = sessions_listbox.get(selection[0])
            if messagebox.askyesno("Confirmar", f"Excluir sessão '{nome}'?"):
                cursor = self.conn.cursor()
                cursor.execute('DELETE FROM sessoes WHERE nome = ?', (nome,))
                self.conn.commit()
                load_sessions()
        
        # Botões
        button_frame = ttk.Frame(dialog)
        button_frame.grid(row=2, column=0, columnspan=2, pady=10)
        
        ttk.Button(button_frame, text="Adicionar", command=add_session).grid(row=0, column=0, padx=5)
        ttk.Button(button_frame, text="Excluir", command=delete_session).grid(row=0, column=1, padx=5)
        ttk.Button(button_frame, text="Fechar", command=dialog.destroy).grid(row=0, column=2, padx=5)
    
    def convert_files(self):
        messagebox.showinfo("Conversão", 
                           "Para converter PDF ↔ Word, recomendamos usar:\n\n" +
                           "• LibreOffice (gratuito)\n" +
                           "• Microsoft Word\n" +
                           "• Ferramentas online como SmallPDF\n\n" +
                           "Esta funcionalidade pode ser implementada com bibliotecas específicas.")
    
    def open_file(self, event):
        tree = event.widget
        selection = tree.selection()
        if not selection:
            return
        
        item = tree.item(selection[0])
        tags = tree.item(selection[0], 'tags')
        
        if len(tags) >= 2:
            arquivo_id, caminho = tags[0], tags[1]
            
            # Atualizar último acesso
            cursor = self.conn.cursor()
            cursor.execute('UPDATE arquivos SET accessed_at = CURRENT_TIMESTAMP WHERE id = ?', 
                          (arquivo_id,))
            self.conn.commit()
            
            # Abrir arquivo
            if os.path.exists(caminho):
                if platform.system() == 'Darwin':  # macOS
                    subprocess.call(['open', caminho])
                elif platform.system() == 'Windows':
                    os.startfile(caminho)
                else:  # Linux
                    subprocess.call(['xdg-open', caminho])
                
                self.load_recent_files()
            else:
                messagebox.showerror("Erro", "Arquivo não encontrado")

if __name__ == "__main__":
    root = tk.Tk()
    app = AdvocaciaApp(root)
    root.mainloop()
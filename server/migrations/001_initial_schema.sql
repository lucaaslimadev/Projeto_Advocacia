-- Tabela de usuários
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de sessões
CREATE TABLE IF NOT EXISTS sessoes (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de arquivos
CREATE TABLE IF NOT EXISTS arquivos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    caminho VARCHAR(500) NOT NULL,
    nome_original VARCHAR(255) NOT NULL,
    tamanho BIGINT,
    tipo_mime VARCHAR(100),
    sessao_id INTEGER REFERENCES sessoes(id) ON DELETE SET NULL,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    palavras_chave TEXT,
    cliente VARCHAR(255),
    favorito BOOLEAN DEFAULT false,
    notas TEXT,
    tag_cor VARCHAR(20),
    data_criacao DATE,
    accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_arquivos_usuario ON arquivos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_arquivos_sessao ON arquivos(sessao_id);
CREATE INDEX IF NOT EXISTS idx_arquivos_accessed ON arquivos(accessed_at DESC);
CREATE INDEX IF NOT EXISTS idx_arquivos_nome ON arquivos USING gin(to_tsvector('portuguese', nome));
CREATE INDEX IF NOT EXISTS idx_sessoes_usuario ON sessoes(usuario_id);

-- Índice único composto para sessões (permite mesmo nome para global e usuário, mas não duplicatas)
CREATE UNIQUE INDEX IF NOT EXISTS sessoes_nome_usuario_unique 
ON sessoes (nome, COALESCE(usuario_id::text, 'GLOBAL'));

-- Sessões globais serão criadas pelo script de setup
-- Não inserir aqui para evitar conflitos

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_usuarios_updated_at ON usuarios;
CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


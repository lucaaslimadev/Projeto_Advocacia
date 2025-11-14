-- Migration para corrigir problema de sessões duplicadas
-- Remove a constraint UNIQUE do nome e cria índice único composto

-- 1. Remover a constraint UNIQUE do nome
ALTER TABLE sessoes DROP CONSTRAINT IF EXISTS sessoes_nome_key;

-- 2. Criar índice único composto que permite:
--    - Sessões globais (usuario_id IS NULL) com nomes únicos
--    - Sessões de usuário (usuario_id IS NOT NULL) com nomes únicos por usuário
--    - Mas permite que usuários tenham sessões com mesmo nome de sessões globais
CREATE UNIQUE INDEX IF NOT EXISTS sessoes_nome_usuario_unique 
ON sessoes (nome, COALESCE(usuario_id::text, 'GLOBAL'));

-- 3. Remover sessões globais duplicadas (deixar apenas as que não têm conflito)
-- Primeiro, vamos identificar e remover sessões globais que foram duplicadas
-- Se houver sessões globais e do usuário com mesmo nome, manter apenas a do usuário
DELETE FROM sessoes s1
WHERE s1.usuario_id IS NULL
AND EXISTS (
  SELECT 1 FROM sessoes s2 
  WHERE s2.nome = s1.nome 
  AND s2.usuario_id IS NOT NULL
);

-- 4. Se ainda houver sessões globais duplicadas (mesmo nome), manter apenas uma
DELETE FROM sessoes s1
WHERE s1.usuario_id IS NULL
AND s1.id NOT IN (
  SELECT MIN(id) FROM sessoes 
  WHERE usuario_id IS NULL 
  GROUP BY nome
);




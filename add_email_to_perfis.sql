-- Adicionar coluna de email na tabela de perfis para facilitar exibição na admin
ALTER TABLE public.perfis ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Sincronizar emails existentes do Auth para o Perfis (se possível via SQL)
-- Nota: Isso só funciona se o editor SQL tiver permissão para ler auth.users
UPDATE public.perfis p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND p.email IS NULL;

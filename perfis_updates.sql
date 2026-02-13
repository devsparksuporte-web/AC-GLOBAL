-- ===============================================
-- ADICIONAR CAMPO DE TELEFONE AOS PERFIS
-- ===============================================

ALTER TABLE public.perfis 
ADD COLUMN IF NOT EXISTS telefone VARCHAR(20),
ADD COLUMN IF NOT EXISTS cpf VARCHAR(14);

COMMENT ON COLUMN public.perfis.telefone IS 'Número de telefone/WhatsApp do usuário para notificações.';
COMMENT ON COLUMN public.perfis.cpf IS 'CPF do usuário/técnico.';

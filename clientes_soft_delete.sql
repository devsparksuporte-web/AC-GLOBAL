-- ===============================================
-- ADICIONAR CAMPO DE ATIVO AOS CLIENTES (SOFT DELETE)
-- ===============================================

ALTER TABLE public.clientes 
ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT TRUE;

COMMENT ON COLUMN public.clientes.ativo IS 'Indica se o cliente está ativo no sistema. Usado para soft delete.';

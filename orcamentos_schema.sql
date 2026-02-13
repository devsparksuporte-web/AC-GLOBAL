-- ==========================================
-- CRIAÇÃO DA TABELA DE ORÇAMENTOS
-- ==========================================

CREATE TABLE IF NOT EXISTS public.orcamentos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE NOT NULL,
    cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE NOT NULL,
    descricao TEXT NOT NULL,
    equipamento TEXT,
    valor DECIMAL(10,2) DEFAULT 0,
    data_inicio DATE,
    data_fim DATE,
    status VARCHAR(50) DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado', 'concluido')),
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.orcamentos ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso (Seguindo o padrão V5)
DROP POLICY IF EXISTS "Acesso Orcamentos" ON public.orcamentos;

CREATE POLICY "Acesso Orcamentos" ON public.orcamentos
    USING (
        empresa_id IN (SELECT empresa_id FROM public.perfis WHERE id = auth.uid()) OR
        EXISTS (SELECT 1 FROM public.perfis WHERE id = auth.uid() AND role = 'super_admin')
    )
    WITH CHECK (
        empresa_id IN (SELECT empresa_id FROM public.perfis WHERE id = auth.uid()) OR
        EXISTS (SELECT 1 FROM public.perfis WHERE id = auth.uid() AND role = 'super_admin')
    );

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_orcamentos_updated_at
    BEFORE UPDATE ON public.orcamentos
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

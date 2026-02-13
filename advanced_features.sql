-- === SISTEMA DE ESTOQUE (PROXIMIDADE COM SERVICE ORDERS) ===

-- 1. Tabela de Itens de Estoque
CREATE TABLE IF NOT EXISTS public.estoque (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    descricao TEXT,
    unidade TEXT DEFAULT 'un', -- un, kg, m, etc
    quantidade DECIMAL(10,2) NOT NULL DEFAULT 0,
    quantidade_minima DECIMAL(10,2) DEFAULT 0,
    preco_unitario DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Histórico de Movimentação (Entradas e Saídas)
CREATE TABLE IF NOT EXISTS public.movimentacao_estoque (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES public.estoque(id) ON DELETE CASCADE,
    ordem_id UUID REFERENCES public.ordens_servico(id) ON DELETE SET NULL, -- Se for saída para uma OS
    tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),
    quantidade DECIMAL(10,2) NOT NULL,
    motivo TEXT, -- Ex: 'Compra', 'Uso em OS #123', 'Ajuste'
    created_at TIMESTAMPTZ DEFAULT now(),
    usuario_id UUID REFERENCES auth.users(id)
);

-- 3. Habilitar RLS
ALTER TABLE public.estoque ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimentacao_estoque ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de RLS (Isolamento por Empresa)
-- Usando a função auth.empresa_id() que já existe no sistema

DROP POLICY IF EXISTS "Empresa pode ver seu estoque" ON public.estoque;
CREATE POLICY "Empresa pode ver seu estoque" ON public.estoque
    FOR SELECT USING (empresa_id = (SELECT empresa_id FROM perfis WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Empresa pode gerenciar seu estoque" ON public.estoque;
CREATE POLICY "Empresa pode gerenciar seu estoque" ON public.estoque
    FOR ALL USING (empresa_id = (SELECT empresa_id FROM perfis WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Empresa pode ver suas movimentações" ON public.movimentacao_estoque;
CREATE POLICY "Empresa pode ver suas movimentações" ON public.movimentacao_estoque
    FOR SELECT USING (empresa_id = (SELECT empresa_id FROM perfis WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Empresa pode gerenciar suas movimentações" ON public.movimentacao_estoque;
CREATE POLICY "Empresa pode gerenciar suas movimentações" ON public.movimentacao_estoque
    FOR ALL USING (empresa_id = (SELECT empresa_id FROM perfis WHERE id = auth.uid()));

-- 5. Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_estoque_updated_at
    BEFORE UPDATE ON public.estoque
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

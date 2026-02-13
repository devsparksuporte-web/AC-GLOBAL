-- === MELHORIAS NO ESTOQUE E INTEGRAÇÃO COM ORÇAMENTOS ===

-- 1. Adicionar preço de venda ao estoque (preco_unitario será o de custo)
ALTER TABLE public.estoque 
ADD COLUMN IF NOT EXISTS preco_venda DECIMAL(10,2) DEFAULT 0;

-- 2. Tabela de Itens do Orçamento
CREATE TABLE IF NOT EXISTS public.itens_orcamento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    orcamento_id UUID NOT NULL REFERENCES public.orcamentos(id) ON DELETE CASCADE,
    item_id UUID REFERENCES public.estoque(id) ON DELETE SET NULL, -- Opcional, se for item do estoque
    nome TEXT NOT NULL, -- Nome do item (copiado do estoque ou manual)
    quantidade DECIMAL(10,2) NOT NULL DEFAULT 1,
    preco_unitario DECIMAL(10,2) NOT NULL DEFAULT 0, -- Preço praticado NESTE orçamento
    total DECIMAL(10,2) GENERATED ALWAYS AS (quantidade * preco_unitario) STORED,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Habilitar RLS
ALTER TABLE public.itens_orcamento ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de RLS
DROP POLICY IF EXISTS "Empresa pode ver itens de seus orçamentos" ON public.itens_orcamento;
CREATE POLICY "Empresa pode ver itens de seus orçamentos" ON public.itens_orcamento
    FOR SELECT USING (empresa_id = (SELECT empresa_id FROM perfis WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Empresa pode gerenciar itens de seus orçamentos" ON public.itens_orcamento;
CREATE POLICY "Empresa pode gerenciar itens de seus orçamentos" ON public.itens_orcamento
    FOR ALL USING (empresa_id = (SELECT empresa_id FROM perfis WHERE id = auth.uid()));

-- 5. Trigger (opcional) para atualizar o valor total do orçamento automaticamente
-- NOTA: Como o valor do orçamento já existe na tabela orçamentos, 
-- precisaremos de um mecanismo para sincronizar se quisermos automação via BD.
-- Por enquanto, faremos a soma via Frontend para maior flexibilidade.

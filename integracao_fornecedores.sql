-- ==========================================
-- MÓDULO: INTEGRAÇÃO COM FABRICANTES E FORNECEDORES
-- ==========================================

-- Função genérica para atualizar updated_at (caso não exista)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. Garantias de Equipamentos
CREATE TABLE IF NOT EXISTS public.garantias_equipamentos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
    fabricante TEXT NOT NULL,
    modelo TEXT NOT NULL,
    numero_serie TEXT,
    data_compra DATE,
    data_vencimento_garantia DATE NOT NULL,
    tipo_garantia TEXT DEFAULT 'padrao' CHECK (tipo_garantia IN ('padrao', 'estendida', 'contratual')),
    status TEXT DEFAULT 'ativa' CHECK (status IN ('ativa', 'vencida', 'utilizada')),
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Manuais Técnicos
CREATE TABLE IF NOT EXISTS public.manuais_tecnicos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
    fabricante TEXT NOT NULL,
    modelo TEXT,
    titulo TEXT NOT NULL,
    url_arquivo TEXT, -- Link para PDF ou storage
    categoria TEXT, -- 'instalacao', 'manutencao', 'troubleshooting'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Cotações (solicitações enviadas a fornecedores)
CREATE TABLE IF NOT EXISTS public.cotacoes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
    solicitante_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    titulo TEXT NOT NULL,
    descricao TEXT,
    status TEXT DEFAULT 'aberta' CHECK (status IN ('aberta', 'em_analise', 'finalizada', 'cancelada')),
    data_limite DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Itens da Cotação (peças solicitadas)
CREATE TABLE IF NOT EXISTS public.itens_cotacao (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cotacao_id UUID REFERENCES public.cotacoes(id) ON DELETE CASCADE,
    descricao_peca TEXT NOT NULL,
    quantidade INTEGER DEFAULT 1,
    unidade TEXT DEFAULT 'un',
    especificacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Respostas de Fornecedores às Cotações
CREATE TABLE IF NOT EXISTS public.respostas_cotacao (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cotacao_id UUID REFERENCES public.cotacoes(id) ON DELETE CASCADE,
    item_cotacao_id UUID REFERENCES public.itens_cotacao(id) ON DELETE CASCADE,
    fornecedor_nome TEXT NOT NULL,
    preco_unitario DECIMAL(12,2),
    prazo_entrega INTEGER, -- em dias
    disponibilidade TEXT DEFAULT 'disponivel' CHECK (disponibilidade IN ('disponivel', 'sob_encomenda', 'indisponivel')),
    observacoes TEXT,
    selecionado BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Pedidos a Fornecedores (com rastreamento)
CREATE TABLE IF NOT EXISTS public.pedidos_fornecedor (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
    cotacao_id UUID REFERENCES public.cotacoes(id) ON DELETE SET NULL,
    fornecedor_nome TEXT NOT NULL,
    numero_pedido TEXT,
    valor_total DECIMAL(12,2) DEFAULT 0,
    status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'confirmado', 'em_transito', 'entregue', 'cancelado')),
    codigo_rastreio TEXT,
    previsao_entrega DATE,
    data_entrega DATE,
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- SEGURANÇA (RLS)
-- ==========================================

ALTER TABLE public.garantias_equipamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manuais_tecnicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cotacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_cotacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.respostas_cotacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos_fornecedor ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acesso garantias" ON public.garantias_equipamentos;
CREATE POLICY "Acesso garantias" ON public.garantias_equipamentos
    USING (empresa_id IN (SELECT empresa_id FROM public.perfis WHERE id = auth.uid())
           OR EXISTS (SELECT 1 FROM public.perfis WHERE id = auth.uid() AND role = 'super_admin'));

DROP POLICY IF EXISTS "Acesso manuais" ON public.manuais_tecnicos;
CREATE POLICY "Acesso manuais" ON public.manuais_tecnicos
    USING (empresa_id IN (SELECT empresa_id FROM public.perfis WHERE id = auth.uid())
           OR EXISTS (SELECT 1 FROM public.perfis WHERE id = auth.uid() AND role = 'super_admin'));

DROP POLICY IF EXISTS "Acesso cotacoes" ON public.cotacoes;
CREATE POLICY "Acesso cotacoes" ON public.cotacoes
    USING (empresa_id IN (SELECT empresa_id FROM public.perfis WHERE id = auth.uid())
           OR EXISTS (SELECT 1 FROM public.perfis WHERE id = auth.uid() AND role = 'super_admin'));

DROP POLICY IF EXISTS "Acesso itens cotacao" ON public.itens_cotacao;
CREATE POLICY "Acesso itens cotacao" ON public.itens_cotacao
    USING (cotacao_id IN (SELECT id FROM public.cotacoes));

DROP POLICY IF EXISTS "Acesso respostas cotacao" ON public.respostas_cotacao;
CREATE POLICY "Acesso respostas cotacao" ON public.respostas_cotacao
    USING (cotacao_id IN (SELECT id FROM public.cotacoes));

DROP POLICY IF EXISTS "Acesso pedidos" ON public.pedidos_fornecedor;
CREATE POLICY "Acesso pedidos" ON public.pedidos_fornecedor
    USING (empresa_id IN (SELECT empresa_id FROM public.perfis WHERE id = auth.uid())
           OR EXISTS (SELECT 1 FROM public.perfis WHERE id = auth.uid() AND role = 'super_admin'));

-- ==========================================
-- TRIGGERS updated_at
-- ==========================================

DROP TRIGGER IF EXISTS set_updated_at_garantias ON public.garantias_equipamentos;
CREATE TRIGGER set_updated_at_garantias BEFORE UPDATE ON public.garantias_equipamentos FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
DROP TRIGGER IF EXISTS set_updated_at_cotacoes ON public.cotacoes;
CREATE TRIGGER set_updated_at_cotacoes BEFORE UPDATE ON public.cotacoes FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
DROP TRIGGER IF EXISTS set_updated_at_pedidos ON public.pedidos_fornecedor;
CREATE TRIGGER set_updated_at_pedidos BEFORE UPDATE ON public.pedidos_fornecedor FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

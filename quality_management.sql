-- ==========================================
-- MÓDULO: GESTÃO DE QUALIDADE
-- ==========================================

-- Função genérica para atualizar updated_at (caso não exista)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- 1. Templates de Checklist
CREATE TABLE IF NOT EXISTS public.checklists_qualidade (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    descricao TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Itens do Checklist (perguntas)
CREATE TABLE IF NOT EXISTS public.itens_checklist (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    checklist_id UUID REFERENCES public.checklists_qualidade(id) ON DELETE CASCADE,
    pergunta TEXT NOT NULL,
    tipo TEXT DEFAULT 'sim_nao' CHECK (tipo IN ('sim_nao', 'nota', 'texto')),
    ordem INTEGER DEFAULT 0,
    obrigatorio BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Respostas preenchidas pelo técnico (vinculadas a uma OS)
CREATE TABLE IF NOT EXISTS public.respostas_checklist (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
    checklist_id UUID REFERENCES public.checklists_qualidade(id) ON DELETE CASCADE,
    ordem_servico_id UUID, -- Referência à OS
    tecnico_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    respostas JSONB NOT NULL DEFAULT '[]', -- [{item_id, resposta, observacao}]
    nota_geral DECIMAL(3,1) DEFAULT 0, -- Média calculada
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Auditorias Remotas (supervisores)
CREATE TABLE IF NOT EXISTS public.auditorias (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
    ordem_servico_id UUID,
    auditor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'reprovado', 'observacao')),
    nota DECIMAL(3,1),
    parecer TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Indicadores de Qualidade (calculados - tabela de cache)
CREATE TABLE IF NOT EXISTS public.indicadores_qualidade (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
    periodo TEXT NOT NULL, -- Ex: '2026-02'
    total_servicos INTEGER DEFAULT 0,
    total_retrabalho INTEGER DEFAULT 0,
    taxa_retrabalho DECIMAL(5,2) DEFAULT 0,
    media_satisfacao DECIMAL(3,1) DEFAULT 0,
    tempo_medio_resolucao DECIMAL(10,2) DEFAULT 0, -- em horas
    total_auditorias INTEGER DEFAULT 0,
    aprovacoes_auditoria INTEGER DEFAULT 0,
    taxa_aprovacao DECIMAL(5,2) DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(empresa_id, periodo)
);

-- ==========================================
-- SEGURANÇA (RLS)
-- ==========================================

ALTER TABLE public.checklists_qualidade ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.respostas_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.indicadores_qualidade ENABLE ROW LEVEL SECURITY;

-- Políticas por empresa
CREATE POLICY "Acesso checklists" ON public.checklists_qualidade
    USING (empresa_id IN (SELECT empresa_id FROM public.perfis WHERE id = auth.uid()) 
           OR EXISTS (SELECT 1 FROM public.perfis WHERE id = auth.uid() AND role = 'super_admin'));

CREATE POLICY "Acesso itens checklist" ON public.itens_checklist
    USING (checklist_id IN (SELECT id FROM public.checklists_qualidade));

CREATE POLICY "Acesso respostas" ON public.respostas_checklist
    USING (empresa_id IN (SELECT empresa_id FROM public.perfis WHERE id = auth.uid()) 
           OR EXISTS (SELECT 1 FROM public.perfis WHERE id = auth.uid() AND role = 'super_admin'));

CREATE POLICY "Acesso auditorias" ON public.auditorias
    USING (empresa_id IN (SELECT empresa_id FROM public.perfis WHERE id = auth.uid()) 
           OR EXISTS (SELECT 1 FROM public.perfis WHERE id = auth.uid() AND role = 'super_admin'));

CREATE POLICY "Acesso indicadores" ON public.indicadores_qualidade
    USING (empresa_id IN (SELECT empresa_id FROM public.perfis WHERE id = auth.uid()) 
           OR EXISTS (SELECT 1 FROM public.perfis WHERE id = auth.uid() AND role = 'super_admin'));

-- ==========================================
-- TRIGGER updated_at
-- ==========================================

CREATE TRIGGER set_updated_at_checklists BEFORE UPDATE ON public.checklists_qualidade FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at_auditorias BEFORE UPDATE ON public.auditorias FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

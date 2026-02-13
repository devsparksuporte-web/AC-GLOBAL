-- 1. Cadastro de Certificações (NR-10, NR-35, etc.)
CREATE TABLE IF NOT EXISTS public.certificacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    obrigatoria BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Certificações dos Técnicos
CREATE TABLE IF NOT EXISTS public.tecnico_certificacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    perfil_id UUID NOT NULL REFERENCES public.perfis(id) ON DELETE CASCADE,
    certificacao_id UUID NOT NULL REFERENCES public.certificacoes(id) ON DELETE CASCADE,
    data_emissao DATE NOT NULL,
    data_vencimento DATE NOT NULL,
    numero_registro VARCHAR(100),
    documento_url TEXT,
    status VARCHAR(20) DEFAULT 'ativo', -- 'ativo', 'vencido', 'suspenso'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tipos de Risco e Configuração de Alertas
CREATE TABLE IF NOT EXISTS public.tipos_risco (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL, -- Ex: Trabalho em Altura, Gases, Elétrica
    descricao TEXT,
    cor_alerta VARCHAR(20) DEFAULT 'warning', -- 'warning', 'danger'
    certificacoes_requeridas UUID[] DEFAULT '{}', -- Array de IDs de certificações
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Templates de Checklists de Segurança
CREATE TABLE IF NOT EXISTS public.checklists_seguranca (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    tipo_risco_id UUID REFERENCES public.tipos_risco(id) ON DELETE SET NULL,
    titulo VARCHAR(255) NOT NULL,
    itens JSONB NOT NULL DEFAULT '[]', -- Array de string ou {pergunta, obrigatorio}
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Registro de Segurança da OS
CREATE TABLE IF NOT EXISTS public.os_seguranca (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    os_id UUID NOT NULL REFERENCES public.ordens_servico(id) ON DELETE CASCADE,
    checklist_id UUID REFERENCES public.checklists_seguranca(id),
    respostas JSONB NOT NULL DEFAULT '{}',
    executado_por UUID REFERENCES auth.users(id),
    data_execucao TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    geolocalizacao JSONB, -- Opcional: Onde foi assinado
    assinatura_url TEXT
);

-- Enable RLS
ALTER TABLE public.certificacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tecnico_certificacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tipos_risco ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklists_seguranca ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.os_seguranca ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Empresas podem ver suas certificações" ON public.certificacoes FOR ALL USING (empresa_id IN (SELECT empresa_id FROM public.perfis WHERE id = auth.uid()));
CREATE POLICY "Empresas podem ver certificações de técnicos" ON public.tecnico_certificacoes FOR ALL USING (empresa_id IN (SELECT empresa_id FROM public.perfis WHERE id = auth.uid()));
CREATE POLICY "Empresas podem ver seus tipos de risco" ON public.tipos_risco FOR ALL USING (empresa_id IN (SELECT empresa_id FROM public.perfis WHERE id = auth.uid()));
CREATE POLICY "Empresas podem ver seus checklists" ON public.checklists_seguranca FOR ALL USING (empresa_id IN (SELECT empresa_id FROM public.perfis WHERE id = auth.uid()));
CREATE POLICY "Empresas podem ver registros de segurança" ON public.os_seguranca FOR ALL USING (empresa_id IN (SELECT empresa_id FROM public.perfis WHERE id = auth.uid()));

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_certificacoes_modtime BEFORE UPDATE ON public.certificacoes FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_tecnico_certificacoes_modtime BEFORE UPDATE ON public.tecnico_certificacoes FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_tipos_risco_modtime BEFORE UPDATE ON public.tipos_risco FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_checklists_seguranca_modtime BEFORE UPDATE ON public.checklists_seguranca FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 6. Adicionar campo de risco à Ordem de Serviço
ALTER TABLE public.ordens_servico ADD COLUMN IF NOT EXISTS tipo_risco_id UUID REFERENCES public.tipos_risco(id) ON DELETE SET NULL;

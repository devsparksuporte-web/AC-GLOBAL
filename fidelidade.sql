-- ========================================================
-- SISTEMA DE FIDELIDADE
-- ========================================================

-- 1. Configuração do Programa de Fidelidade
CREATE TABLE IF NOT EXISTS public.programas_fidelidade (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    pontos_por_real DECIMAL(10,2) DEFAULT 1.00, -- Quantos pontos ganha por R$ 1,00
    valor_ponto_resgate DECIMAL(10,4) DEFAULT 0.05, -- Cada ponto vale quanto em R$ no resgate
    pontos_minimos_resgate INTEGER DEFAULT 100,
    pontos_por_indicacao INTEGER DEFAULT 500,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(empresa_id)
);

-- 2. Saldo de Pontos do Cliente
CREATE TABLE IF NOT EXISTS public.pontos_cliente (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    pontos_atuais INTEGER DEFAULT 0,
    pontos_totais_acumulados INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(empresa_id, cliente_id)
);

-- 3. Histórico de Transações de Pontos
CREATE TABLE IF NOT EXISTS public.transacoes_pontos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    pontos INTEGER NOT NULL, -- Positivo para crédito, negativo para débito
    tipo VARCHAR(50) NOT NULL, -- 'servico_concluido', 'indicacao', 'resgate', 'bonus', 'ajuste_manual'
    referencia_id UUID, -- ID da OS, Indicação ou Resgate
    descricao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    criado_por UUID REFERENCES auth.users(id)
);

-- 4. Programa de Indicações
CREATE TABLE IF NOT EXISTS public.indicacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    indicador_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    nome_indicado VARCHAR(255) NOT NULL,
    contato_indicado VARCHAR(100),
    status VARCHAR(50) DEFAULT 'pendente', -- 'pendente', 'confirmada', 'recompensada', 'cancelada'
    data_conversao TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Regras de Desconto para Manutenção Preventiva
CREATE TABLE IF NOT EXISTS public.descontos_preventiva (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    min_manutencoes INTEGER NOT NULL, -- Ex: 3 manutenções regulares
    percentual_desconto DECIMAL(5,2) NOT NULL, -- Ex: 10.00%
    descricao TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(empresa_id, min_manutencoes)
);

-- 6. Resgates de Pontos
CREATE TABLE IF NOT EXISTS public.resgates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    pontos_utilizados INTEGER NOT NULL,
    valor_desconto_aplicado DECIMAL(10,2),
    tipo_resgate VARCHAR(50) DEFAULT 'desconto', -- 'desconto', 'servico_gratuito'
    status VARCHAR(50) DEFAULT 'concluido',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ========================================================
-- HABILITAR RLS (Row Level Security)
-- ========================================================

ALTER TABLE public.programas_fidelidade ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pontos_cliente ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transacoes_pontos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.indicacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.descontos_preventiva ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resgates ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS DE ACESSO POR EMPRESA_ID
-- Assumindo que o usuário tem empresa_id em seu perfil/JWT

DROP POLICY IF EXISTS "Empresas podem ver seu programa de fidelidade" ON public.programas_fidelidade;
CREATE POLICY "Empresas podem ver seu programa de fidelidade" 
ON public.programas_fidelidade FOR ALL 
USING (empresa_id IN (SELECT empresa_id FROM public.perfis WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Empresas podem ver pontos de seus clientes" ON public.pontos_cliente;
CREATE POLICY "Empresas podem ver pontos de seus clientes" 
ON public.pontos_cliente FOR ALL 
USING (empresa_id IN (SELECT empresa_id FROM public.perfis WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Empresas podem ver transações de seus clientes" ON public.transacoes_pontos;
CREATE POLICY "Empresas podem ver transações de seus clientes" 
ON public.transacoes_pontos FOR ALL 
USING (empresa_id IN (SELECT empresa_id FROM public.perfis WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Empresas podem ver suas indicações" ON public.indicacoes;
CREATE POLICY "Empresas podem ver suas indicações" 
ON public.indicacoes FOR ALL 
USING (empresa_id IN (SELECT empresa_id FROM public.perfis WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Empresas podem ver regras de desconto" ON public.descontos_preventiva;
CREATE POLICY "Empresas podem ver regras de desconto" 
ON public.descontos_preventiva FOR ALL 
USING (empresa_id IN (SELECT empresa_id FROM public.perfis WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Empresas podem ver resgates" ON public.resgates;
CREATE POLICY "Empresas podem ver resgates" 
ON public.resgates FOR ALL 
USING (empresa_id IN (SELECT empresa_id FROM public.perfis WHERE id = auth.uid()));

-- ========================================================
-- TRIGGERS PARA UPDATED_AT
-- ========================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at_programa ON public.programas_fidelidade;
CREATE TRIGGER set_updated_at_programa BEFORE UPDATE ON public.programas_fidelidade FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_pontos ON public.pontos_cliente;
CREATE TRIGGER set_updated_at_pontos BEFORE UPDATE ON public.pontos_cliente FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_indicacoes ON public.indicacoes;
CREATE TRIGGER set_updated_at_indicacoes BEFORE UPDATE ON public.indicacoes FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

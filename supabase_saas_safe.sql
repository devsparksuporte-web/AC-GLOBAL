-- ==========================================
-- MIGRAÇÃO SAAS V3 (SAFE FIX) - AC GLOBAL SUPORTE
-- Execute este script para garantir que todas as estruturas existam
-- sem erros de duplicação.
-- ==========================================

-- 1. Tabela de Empresas
CREATE TABLE IF NOT EXISTS public.empresas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    cnpj VARCHAR(20),
    email VARCHAR(255),
    telefone VARCHAR(20),
    logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    ativo BOOLEAN DEFAULT TRUE
);

-- Ativar RLS
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;

-- 2. Tabela de Perfis de Usuário
CREATE TABLE IF NOT EXISTS public.perfis (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
    nome VARCHAR(255),
    role VARCHAR(50) DEFAULT 'tecnico' CHECK (role IN ('admin', 'tecnico', 'cliente')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ativar RLS
ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;

-- 3. Adicionar coluna empresa_id nas tabelas existentes (com verificação)
DO $$
BEGIN
    -- Clientes
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clientes' AND column_name = 'empresa_id') THEN
        ALTER TABLE public.clientes ADD COLUMN empresa_id UUID REFERENCES public.empresas(id);
    END IF;

    -- Ordens de Serviço
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ordens_servico' AND column_name = 'empresa_id') THEN
        ALTER TABLE public.ordens_servico ADD COLUMN empresa_id UUID REFERENCES public.empresas(id);
    END IF;

    -- Produtos
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'produtos' AND column_name = 'empresa_id') THEN
        ALTER TABLE public.produtos ADD COLUMN empresa_id UUID REFERENCES public.empresas(id);
    END IF;
END $$;

-- Ativar RLS nas tabelas existentes
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordens_servico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;

-- 4. Contratos
CREATE TABLE IF NOT EXISTS public.contratos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID REFERENCES public.empresas(id) NOT NULL,
    cliente_id UUID REFERENCES public.clientes(id) NOT NULL,
    nome VARCHAR(100) NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    data_inicio DATE NOT NULL,
    data_fim DATE,
    dia_vencimento INTEGER NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    descricao TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.contratos ENABLE ROW LEVEL SECURITY;

-- 5. Faturas (Financeiro)
CREATE TABLE IF NOT EXISTS public.faturas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID REFERENCES public.empresas(id) NOT NULL,
    cliente_id UUID REFERENCES public.clientes(id) NOT NULL,
    contrato_id UUID REFERENCES public.contratos(id),
    ordem_servico_id UUID REFERENCES public.ordens_servico(id),
    descricao VARCHAR(255),
    valor DECIMAL(10,2) NOT NULL,
    data_vencimento DATE NOT NULL,
    data_pagamento DATE,
    status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'atrasado', 'cancelado')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.faturas ENABLE ROW LEVEL SECURITY;

-- 6. Manutenção Preventiva (PMOC)
CREATE TABLE IF NOT EXISTS public.planos_manutencao (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID REFERENCES public.empresas(id) NOT NULL,
    cliente_id UUID REFERENCES public.clientes(id) NOT NULL,
    contrato_id UUID REFERENCES public.contratos(id),
    titulo VARCHAR(255) NOT NULL,
    equipamento VARCHAR(255),
    localizacao VARCHAR(255),
    frequencia_dias INTEGER NOT NULL,
    ultima_visita DATE,
    proxima_visita DATE NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.planos_manutencao ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- POLÍTICAS DE SEGURANÇA (RLS)
-- Removemos as antigas antes de recriar para evitar erros
-- ==========================================

-- Função auxiliar para pegar empresa do usuário logado
CREATE OR REPLACE FUNCTION auth.empresa_id() RETURNS UUID AS $$
    SELECT empresa_id FROM public.perfis WHERE id = auth.uid()
$$ LANGUAGE sql STABLE;

-- Drop Policies (Safe)
DROP POLICY IF EXISTS "Acesso Empresa" ON public.empresas;
DROP POLICY IF EXISTS "Acesso Perfis" ON public.perfis;
DROP POLICY IF EXISTS "Acesso Clientes" ON public.clientes;
DROP POLICY IF EXISTS "Acesso Ordens" ON public.ordens_servico;
DROP POLICY IF EXISTS "Acesso Produtos" ON public.produtos;
DROP POLICY IF EXISTS "Acesso Contratos" ON public.contratos;
DROP POLICY IF EXISTS "Acesso Faturas" ON public.faturas;
DROP POLICY IF EXISTS "Acesso PMOC" ON public.planos_manutencao;

-- Recreate Policies
CREATE POLICY "Acesso Empresa" ON public.empresas
    USING (id = auth.empresa_id());

CREATE POLICY "Acesso Perfis" ON public.perfis
    USING (empresa_id = auth.empresa_id());

CREATE POLICY "Acesso Clientes" ON public.clientes
    USING (empresa_id = auth.empresa_id())
    WITH CHECK (empresa_id = auth.empresa_id());

CREATE POLICY "Acesso Ordens" ON public.ordens_servico
    USING (empresa_id = auth.empresa_id())
    WITH CHECK (empresa_id = auth.empresa_id());

CREATE POLICY "Acesso Produtos" ON public.produtos
    USING (empresa_id = auth.empresa_id())
    WITH CHECK (empresa_id = auth.empresa_id());

CREATE POLICY "Acesso Contratos" ON public.contratos
    USING (empresa_id = auth.empresa_id())
    WITH CHECK (empresa_id = auth.empresa_id());

CREATE POLICY "Acesso Faturas" ON public.faturas
    USING (empresa_id = auth.empresa_id())
    WITH CHECK (empresa_id = auth.empresa_id());

CREATE POLICY "Acesso PMOC" ON public.planos_manutencao
    USING (empresa_id = auth.empresa_id())
    WITH CHECK (empresa_id = auth.empresa_id());

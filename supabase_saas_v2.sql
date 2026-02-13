-- ==========================================
-- MIGRAÇÃO SAAS V1 - AC GLOBAL SUPORTE
-- ==========================================

-- 1. Tabela de Empresas
CREATE TABLE public.empresas (
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
CREATE TABLE public.perfis (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
    nome VARCHAR(255),
    role VARCHAR(50) DEFAULT 'tecnico' CHECK (role IN ('admin', 'tecnico', 'cliente')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ativar RLS
ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;

-- 3. Adicionar coluna empresa_id nas tabelas existentes
ALTER TABLE public.clientes ADD COLUMN empresa_id UUID REFERENCES public.empresas(id);
ALTER TABLE public.ordens_servico ADD COLUMN empresa_id UUID REFERENCES public.empresas(id);
ALTER TABLE public.produtos ADD COLUMN empresa_id UUID REFERENCES public.empresas(id);

-- Ativar RLS nas tabelas existentes
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordens_servico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;

-- 4. Contratos
CREATE TABLE public.contratos (
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
CREATE TABLE public.faturas (
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
CREATE TABLE public.planos_manutencao (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID REFERENCES public.empresas(id) NOT NULL,
    cliente_id UUID REFERENCES public.clientes(id) NOT NULL,
    contrato_id UUID REFERENCES public.contratos(id),
    titulo VARCHAR(255) NOT NULL,
    equipamento VARCHAR(255),
    localizacao VARCHAR(255),
    frequencia_dias INTEGER NOT NULL, -- 30, 60, 90...
    ultima_visita DATE,
    proxima_visita DATE NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.planos_manutencao ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- POLÍTICAS DE SEGURANÇA (RLS)
-- ==========================================

-- Função auxiliar para pegar empresa do usuário logado
CREATE OR REPLACE FUNCTION auth.empresa_id() RETURNS UUID AS $$
    SELECT empresa_id FROM public.perfis WHERE id = auth.uid()
$$ LANGUAGE sql STABLE;

-- Policies
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

-- ==========================================
-- CRIAÇÃO DA EMPRESA PADRÃO (Para o usuário atual)
-- ==========================================
-- Execute este bloco separadamente após criar as tabelas

/*
DO $$ 
DECLARE 
    nova_empresa_id UUID;
    meu_usuario_id UUID;
BEGIN
    -- 1. Pegar ID do Usuário Adm (Substitua se necessário ou use auth.uid() se rodar no SQL Editor logado)
    SELECT id INTO meu_usuario_id FROM auth.users LIMIT 1;

    -- 2. Criar Empresa
    INSERT INTO public.empresas (nome, cnpj) 
    VALUES ('Minha Empresa', '00.000.000/0001-00') 
    RETURNING id INTO nova_empresa_id;

    -- 3. Criar Perfil Admin
    INSERT INTO public.perfis (id, empresa_id, nome, role)
    VALUES (meu_usuario_id, nova_empresa_id, 'Admin', 'admin');

    -- 4. Migrar dados órfãos para esta empresa
    UPDATE public.clientes SET empresa_id = nova_empresa_id WHERE empresa_id IS NULL;
    UPDATE public.ordens_servico SET empresa_id = nova_empresa_id WHERE empresa_id IS NULL;
    UPDATE public.produtos SET empresa_id = nova_empresa_id WHERE empresa_id IS NULL;
END $$;
*/

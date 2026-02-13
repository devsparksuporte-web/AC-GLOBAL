-- ==========================================
-- PORTAL DO CLIENTE AVANÇADO: SCHEMA
-- ==========================================

-- 1. Vincular Perfil ao Cliente
ALTER TABLE public.perfis 
ADD COLUMN IF NOT EXISTS cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.perfis.cliente_id IS 'Vinculação direta com o registro de cliente para acesso ao portal.';

-- 2. Tabela de Equipamentos (Ativos do Cliente)
CREATE TABLE IF NOT EXISTS public.equipamentos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE NOT NULL,
    cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE NOT NULL,
    nome TEXT NOT NULL, -- Ex: "Ar Sala", "Ar Quarto 1"
    marca TEXT,
    modelo TEXT,
    capacidade TEXT, -- Ex: "12.000 BTU"
    tipo TEXT, -- Ex: "Split", "Cassete"
    numero_serie TEXT,
    localizacao TEXT, -- Ex: "2º Andar / Sala 204"
    data_instalacao DATE,
    ultima_revisao DATE,
    proxima_revisao DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de Serviços e Preços (Para Orçamentos Automáticos)
CREATE TABLE IF NOT EXISTS public.servicos_precos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE NOT NULL,
    nome TEXT NOT NULL, -- Ex: "Limpeza Preventiva"
    descricao TEXT,
    preco_base DECIMAL(10,2) NOT NULL,
    tempo_estimado_minutos INTEGER DEFAULT 60,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Habilitar RLS
ALTER TABLE public.equipamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicos_precos ENABLE ROW LEVEL SECURITY;

-- 5. Políticas de RLS: Equipamentos
DROP POLICY IF EXISTS "Empresa ve equipamentos" ON public.equipamentos;
CREATE POLICY "Empresa ve equipamentos" ON public.equipamentos
    FOR ALL USING (
        empresa_id IN (SELECT empresa_id FROM public.perfis WHERE id = auth.uid()) OR
        EXISTS (SELECT 1 FROM public.perfis WHERE id = auth.uid() AND role = 'super_admin')
    );

DROP POLICY IF EXISTS "Cliente ve seus equipamentos" ON public.equipamentos;
CREATE POLICY "Cliente ve seus equipamentos" ON public.equipamentos
    FOR SELECT USING (
        cliente_id IN (SELECT cliente_id FROM public.perfis WHERE id = auth.uid())
    );

-- 6. Políticas de RLS: Serviços e Preços
DROP POLICY IF EXISTS "Empresa ve seus precos" ON public.servicos_precos;
CREATE POLICY "Empresa ve seus precos" ON public.servicos_precos
    FOR ALL USING (
        empresa_id IN (SELECT empresa_id FROM public.perfis WHERE id = auth.uid()) OR
        EXISTS (SELECT 1 FROM public.perfis WHERE id = auth.uid() AND role = 'super_admin')
    );

DROP POLICY IF EXISTS "Clientes veem precos da sua empresa" ON public.servicos_precos;
CREATE POLICY "Clientes veem precos da sua empresa" ON public.servicos_precos
    FOR SELECT USING (
        empresa_id IN (SELECT empresa_id FROM public.perfis WHERE id = auth.uid())
    );

-- 7. Triggers para updated_at
CREATE TRIGGER update_equipamentos_updated_at BEFORE UPDATE ON public.equipamentos FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_servicos_precos_updated_at BEFORE UPDATE ON public.servicos_precos FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

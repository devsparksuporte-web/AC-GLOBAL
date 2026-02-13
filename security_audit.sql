-- ==========================================
-- SISTEMA DE AUDITORIA E SEGURANÇA (Multi-Tenancy)
-- ==========================================

-- 1. Tabela de Logs de Auditoria
CREATE TABLE IF NOT EXISTS public.logs_auditoria (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
    acao VARCHAR(50) NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    tabela VARCHAR(50) NOT NULL,
    registro_id UUID NOT NULL,
    dados_antigos JSONB,
    dados_novos JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS para Logs
ALTER TABLE public.logs_auditoria ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso Logs Auditoria" ON public.logs_auditoria
    USING (
        empresa_id IN (SELECT empresa_id FROM public.perfis WHERE id = auth.uid()) OR
        EXISTS (SELECT 1 FROM public.perfis WHERE id = auth.uid() AND role = 'super_admin')
    );

-- 2. Função de Auditoria Genérica
CREATE OR REPLACE FUNCTION public.process_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    current_user_id UUID;
    user_empresa_id UUID;
BEGIN
    -- Obter o ID do usuário logado do auth.uid()
    current_user_id := auth.uid();
    
    -- Obter a empresa do usuário do perfil
    SELECT empresa_id INTO user_empresa_id FROM public.perfis WHERE id = current_user_id;

    IF (TG_OP = 'DELETE') THEN
        INSERT INTO public.logs_auditoria (user_id, empresa_id, acao, tabela, registro_id, dados_antigos)
        VALUES (current_user_id, user_empresa_id, TG_OP, TG_TABLE_NAME, OLD.id, to_jsonb(OLD));
        RETURN OLD;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO public.logs_auditoria (user_id, empresa_id, acao, tabela, registro_id, dados_antigos, dados_novos)
        VALUES (current_user_id, user_empresa_id, TG_OP, TG_TABLE_NAME, NEW.id, to_jsonb(OLD), to_jsonb(NEW));
        RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO public.logs_auditoria (user_id, empresa_id, acao, tabela, registro_id, dados_novos)
        VALUES (current_user_id, user_empresa_id, TG_OP, TG_TABLE_NAME, NEW.id, to_jsonb(NEW));
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Função de Proteção de Multi-Tenancy (Forçar empresa_id)
CREATE OR REPLACE FUNCTION public.enforce_tenant_isolation()
RETURNS TRIGGER AS $$
DECLARE
    user_empresa_id UUID;
BEGIN
    -- Ignorar se for Super Admin (opcional, mas seguro manter para todos)
    SELECT empresa_id INTO user_empresa_id FROM public.perfis WHERE id = auth.uid();
    
    IF user_empresa_id IS NULL AND EXISTS (SELECT 1 FROM public.perfis WHERE id = auth.uid() AND role = 'super_admin') THEN
        -- Super Admin pode definir qualquer empresa_id
        RETURN NEW;
    END IF;

    -- Forçar a empresa do usuário logado
    IF NEW.empresa_id IS DISTINCT FROM user_empresa_id THEN
        NEW.empresa_id := user_empresa_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Aplicar Triggers de Auditoria
-- Ordens
DROP TRIGGER IF EXISTS tr_audit_ordens ON public.ordens_servico;
CREATE TRIGGER tr_audit_ordens AFTER INSERT OR UPDATE OR DELETE ON public.ordens_servico FOR EACH ROW EXECUTE FUNCTION process_audit_log();

-- Clientes
DROP TRIGGER IF EXISTS tr_audit_clientes ON public.clientes;
CREATE TRIGGER tr_audit_clientes AFTER INSERT OR UPDATE OR DELETE ON public.clientes FOR EACH ROW EXECUTE FUNCTION process_audit_log();

-- Orçamentos
DROP TRIGGER IF EXISTS tr_audit_orcamentos ON public.orcamentos;
CREATE TRIGGER tr_audit_orcamentos AFTER INSERT OR UPDATE OR DELETE ON public.orcamentos FOR EACH ROW EXECUTE FUNCTION process_audit_log();

-- Produtos
DROP TRIGGER IF EXISTS tr_audit_produtos ON public.produtos;
CREATE TRIGGER tr_audit_produtos AFTER INSERT OR UPDATE OR DELETE ON public.produtos FOR EACH ROW EXECUTE FUNCTION process_audit_log();

-- 5. Aplicar Triggers de Proteção de Tenant (Multi-Tenancy Safe)
-- Garante que ninguém grave dados em outra empresa, mesmo se o frontend enviar errado
DROP TRIGGER IF EXISTS tr_tenant_ordens ON public.ordens_servico;
CREATE TRIGGER tr_tenant_ordens BEFORE INSERT OR UPDATE ON public.ordens_servico FOR EACH ROW EXECUTE FUNCTION enforce_tenant_isolation();

DROP TRIGGER IF EXISTS tr_tenant_clientes ON public.clientes;
CREATE TRIGGER tr_tenant_clientes BEFORE INSERT OR UPDATE ON public.clientes FOR EACH ROW EXECUTE FUNCTION enforce_tenant_isolation();

DROP TRIGGER IF EXISTS tr_tenant_orcamentos ON public.orcamentos;
CREATE TRIGGER tr_tenant_orcamentos BEFORE INSERT OR UPDATE ON public.orcamentos FOR EACH ROW EXECUTE FUNCTION enforce_tenant_isolation();

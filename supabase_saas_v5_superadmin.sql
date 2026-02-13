-- ==========================================
-- MIGRAÇÃO SAAS V5 (SUPER ADMIN & DEBUG) - AC GLOBAL SUPORTE
-- ==========================================

-- 1. Atualizar Constraint de Roles para incluir 'super_admin'
ALTER TABLE public.perfis 
DROP CONSTRAINT IF EXISTS perfis_role_check;

ALTER TABLE public.perfis 
ADD CONSTRAINT perfis_role_check 
CHECK (role IN ('super_admin', 'admin', 'tecnico', 'cliente'));

-- 2. Atualizar função auxiliar (se existir) ou criar nova para verificar Super Admin
-- Como optamos por não usar functions no schema auth, vamos usar subqueries nas policies
-- Mas precisamos garantir que as policies anteriores sejam substituídas.

-- ==========================================
-- ATUALIZAÇÃO DAS POLICIES (Super Admin vê tudo)
-- ==========================================

-- Drop das policies V4 (para recriar com suporte a super_admin)
DROP POLICY IF EXISTS "Acesso Empresa" ON public.empresas;
DROP POLICY IF EXISTS "Acesso Perfis" ON public.perfis;
DROP POLICY IF EXISTS "Acesso Clientes" ON public.clientes;
DROP POLICY IF EXISTS "Acesso Ordens" ON public.ordens_servico;
DROP POLICY IF EXISTS "Acesso Produtos" ON public.produtos;
DROP POLICY IF EXISTS "Acesso Contratos" ON public.contratos;
DROP POLICY IF EXISTS "Acesso Faturas" ON public.faturas;
DROP POLICY IF EXISTS "Acesso PMOC" ON public.planos_manutencao;

-- Novas Policies V5:
-- Regra: Acesso permitido se (empresa_id bate com perfil) OU (perfil é super_admin)

-- Helper: Como saber se sou super_admin sem função?
-- SELECT 1 FROM public.perfis WHERE id = auth.uid() AND role = 'super_admin'

-- 1. Empresas
CREATE POLICY "Acesso Empresa" ON public.empresas
    USING (
        id IN (SELECT empresa_id FROM public.perfis WHERE id = auth.uid()) OR
        EXISTS (SELECT 1 FROM public.perfis WHERE id = auth.uid() AND role = 'super_admin')
    )
    WITH CHECK (
        -- Super Admin pode criar/editar qualquer empresa
        EXISTS (SELECT 1 FROM public.perfis WHERE id = auth.uid() AND role = 'super_admin')
        -- Admins comuns não criam empresas (só editam a sua se necessário, mas aqui a policy de update seria igual so USING)
    );

-- 2. Perfis
CREATE POLICY "Acesso Perfis" ON public.perfis
    USING (
        empresa_id IN (SELECT empresa_id FROM public.perfis WHERE id = auth.uid()) OR
        EXISTS (SELECT 1 FROM public.perfis WHERE id = auth.uid() AND role = 'super_admin') OR
        id = auth.uid() -- O próprio usuário sempre pode ver seu perfil
    );

-- 3. Clientes
CREATE POLICY "Acesso Clientes" ON public.clientes
    USING (
        empresa_id IN (SELECT empresa_id FROM public.perfis WHERE id = auth.uid()) OR
        EXISTS (SELECT 1 FROM public.perfis WHERE id = auth.uid() AND role = 'super_admin')
    )
    WITH CHECK (
        empresa_id IN (SELECT empresa_id FROM public.perfis WHERE id = auth.uid()) OR
        EXISTS (SELECT 1 FROM public.perfis WHERE id = auth.uid() AND role = 'super_admin')
    );

-- 4. Ordens
CREATE POLICY "Acesso Ordens" ON public.ordens_servico
    USING (
        empresa_id IN (SELECT empresa_id FROM public.perfis WHERE id = auth.uid()) OR
        EXISTS (SELECT 1 FROM public.perfis WHERE id = auth.uid() AND role = 'super_admin')
    )
    WITH CHECK (
        empresa_id IN (SELECT empresa_id FROM public.perfis WHERE id = auth.uid()) OR
        EXISTS (SELECT 1 FROM public.perfis WHERE id = auth.uid() AND role = 'super_admin')
    );

-- 5. Produtos
CREATE POLICY "Acesso Produtos" ON public.produtos
    USING (
        empresa_id IN (SELECT empresa_id FROM public.perfis WHERE id = auth.uid()) OR
        EXISTS (SELECT 1 FROM public.perfis WHERE id = auth.uid() AND role = 'super_admin')
    )
    WITH CHECK (
        empresa_id IN (SELECT empresa_id FROM public.perfis WHERE id = auth.uid()) OR
        EXISTS (SELECT 1 FROM public.perfis WHERE id = auth.uid() AND role = 'super_admin')
    );

-- 6. Contratos
CREATE POLICY "Acesso Contratos" ON public.contratos
    USING (
        empresa_id IN (SELECT empresa_id FROM public.perfis WHERE id = auth.uid()) OR
        EXISTS (SELECT 1 FROM public.perfis WHERE id = auth.uid() AND role = 'super_admin')
    )
    WITH CHECK (
        empresa_id IN (SELECT empresa_id FROM public.perfis WHERE id = auth.uid()) OR
        EXISTS (SELECT 1 FROM public.perfis WHERE id = auth.uid() AND role = 'super_admin')
    );

-- 7. Faturas
CREATE POLICY "Acesso Faturas" ON public.faturas
    USING (
        empresa_id IN (SELECT empresa_id FROM public.perfis WHERE id = auth.uid()) OR
        EXISTS (SELECT 1 FROM public.perfis WHERE id = auth.uid() AND role = 'super_admin')
    )
    WITH CHECK (
        empresa_id IN (SELECT empresa_id FROM public.perfis WHERE id = auth.uid()) OR
        EXISTS (SELECT 1 FROM public.perfis WHERE id = auth.uid() AND role = 'super_admin')
    );

-- 8. PMOC
CREATE POLICY "Acesso PMOC" ON public.planos_manutencao
    USING (
        empresa_id IN (SELECT empresa_id FROM public.perfis WHERE id = auth.uid()) OR
        EXISTS (SELECT 1 FROM public.perfis WHERE id = auth.uid() AND role = 'super_admin')
    )
    WITH CHECK (
        empresa_id IN (SELECT empresa_id FROM public.perfis WHERE id = auth.uid()) OR
        EXISTS (SELECT 1 FROM public.perfis WHERE id = auth.uid() AND role = 'super_admin')
    );

-- ==========================================
-- DEFINIR SUPER ADMIN (Execute separadamente ou aqui)
-- ==========================================
-- Este bloco tenta pegar o primeiro usuário e torná-lo super_admin
DO $$
DECLARE
    meu_id UUID;
BEGIN
    SELECT id INTO meu_id FROM auth.users LIMIT 1;
    
    IF meu_id IS NOT NULL THEN
        -- Tenta atualizar se já existe perfil
        UPDATE public.perfis 
        SET role = 'super_admin' 
        WHERE id = meu_id;

        -- Se não tiver perfil, cria um vinculado à primeira empresa (ou cria uma dummy)
        IF NOT FOUND THEN
            -- ... lógica de criação (pode ser feita via app se o RLS permitir, mas aqui é root)
            -- Como estamos rodando no SQL Editor, temos permissão de postergress/postgres,
            -- então podemos forçar a criação.
            
            -- Vamos ignorar inserção aqui para não duplicar se já existir.
            -- O UPDATE acima já deve ter resolvido se o usuário já logou alguma vez.
        END IF;
    END IF;
END $$;

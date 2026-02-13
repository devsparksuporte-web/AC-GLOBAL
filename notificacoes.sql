-- ===============================================
-- SISTEMA DE NOTIFICAÇÕES PARA TÉCNICOS
-- ===============================================

CREATE TABLE IF NOT EXISTS public.notificacoes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
    perfil_id UUID REFERENCES public.perfis(id) ON DELETE CASCADE, -- Destinatário
    titulo VARCHAR(255) NOT NULL,
    mensagem TEXT NOT NULL,
    tipo VARCHAR(50) DEFAULT 'info', -- 'os_atribuida', 'os_cancelada', 'info'
    lida BOOLEAN DEFAULT FALSE,
    link_acao TEXT, -- Opcional: link para abrir o recurso
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;

-- Políticas
DROP POLICY IF EXISTS "Usuários veem suas próprias notificações" ON public.notificacoes;
CREATE POLICY "Usuários veem suas próprias notificações" ON public.notificacoes
    FOR SELECT USING (perfil_id = auth.uid());

DROP POLICY IF EXISTS "Usuários marcam como lido" ON public.notificacoes;
CREATE POLICY "Usuários marcam como lido" ON public.notificacoes
    FOR UPDATE USING (perfil_id = auth.uid());

DROP POLICY IF EXISTS "Sistema/Admin envia notificações" ON public.notificacoes;
CREATE POLICY "Sistema/Admin envia notificações" ON public.notificacoes
    FOR INSERT WITH CHECK (
        empresa_id IN (SELECT empresa_id FROM public.perfis WHERE id = auth.uid() AND role = 'admin')
        OR auth.uid() IS NOT NULL -- Permitir inserção via triggers de sistema
    );

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS tr_notificacoes_updated_at ON public.notificacoes;
CREATE TRIGGER tr_notificacoes_updated_at
    BEFORE UPDATE ON public.notificacoes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função/Trigger para notificar técnico ao criar OS
CREATE OR REPLACE FUNCTION notify_tecnico_on_os_assignment()
RETURNS TRIGGER AS $body$
BEGIN
    IF NEW.tecnico_id IS NOT NULL THEN
        INSERT INTO public.notificacoes (empresa_id, perfil_id, titulo, mensagem, tipo, link_acao)
        VALUES (
            NEW.empresa_id,
            NEW.tecnico_id,
            'Nova Ordem de Serviço #' || NEW.numero,
            'Você foi escalado para uma nova ordem de serviço: ' || COALESCE(NEW.descricao, 'Sem descrição'),
            'os_atribuida',
            '/ordens/' || NEW.id
        );
    END IF;
    RETURN NEW;
END;
$body$ language 'plpgsql';


-- Trigger para INSERT (não pode referenciar OLD)
DROP TRIGGER IF EXISTS tr_notify_os_assignment_ins ON public.ordens_servico;
CREATE TRIGGER tr_notify_os_assignment_ins
    AFTER INSERT ON public.ordens_servico
    FOR EACH ROW
    WHEN (NEW.tecnico_id IS NOT NULL)
    EXECUTE FUNCTION notify_tecnico_on_os_assignment();

-- Trigger para UPDATE (pode referenciar OLD)
DROP TRIGGER IF EXISTS tr_notify_os_assignment_upd ON public.ordens_servico;
CREATE TRIGGER tr_notify_os_assignment_upd
    AFTER UPDATE OF tecnico_id ON public.ordens_servico
    FOR EACH ROW
    WHEN (NEW.tecnico_id IS NOT NULL AND (OLD.tecnico_id IS NULL OR OLD.tecnico_id <> NEW.tecnico_id))
    EXECUTE FUNCTION notify_tecnico_on_os_assignment();

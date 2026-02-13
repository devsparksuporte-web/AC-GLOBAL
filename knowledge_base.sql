-- ==========================================
-- MÓDULO: BASE DE CONHECIMENTO & CROWDSOURCING
-- ==========================================

-- 1. Tabela de Artigos (Problemas/Tópicos)
CREATE TABLE IF NOT EXISTS public.artigos_conhecimento (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
    autor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    titulo TEXT NOT NULL,
    descricao TEXT NOT NULL,
    categoria TEXT, -- Ex: 'Ar Condicionado', 'Elétrica', 'Instalação'
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela de Soluções
CREATE TABLE IF NOT EXISTS public.solucoes_conhecimento (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    artigo_id UUID REFERENCES public.artigos_conhecimento(id) ON DELETE CASCADE,
    autor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    conteudo TEXT NOT NULL,
    votos_positivos INTEGER DEFAULT 0,
    votos_negativos INTEGER DEFAULT 0,
    utilidade_score INTEGER DEFAULT 0, -- Calculado: votos_pos - votos_neg
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Registro de Votos (Garantir um voto por usuário)
CREATE TABLE IF NOT EXISTS public.votos_solucoes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    solucao_id UUID REFERENCES public.solucoes_conhecimento(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    valor INTEGER CHECK (valor IN (1, -1)), -- 1 para upvote, -1 para downvote
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(solucao_id, usuario_id)
);

-- 4. Sistema de Pontuação (Gamificação)
CREATE TABLE IF NOT EXISTS public.pontuacao_tecnicos (
    usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    pontos_atuais INTEGER DEFAULT 0,
    pontos_totais INTEGER DEFAULT 0,
    contribuicoes_count INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- SEGURANÇA (RLS)
-- ==========================================

ALTER TABLE public.artigos_conhecimento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solucoes_conhecimento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votos_solucoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pontuacao_tecnicos ENABLE ROW LEVEL SECURITY;

-- Políticas V5 (Seguindo padrão de isolamento por empresa ou global se desejar)
-- Por padrão, manteremos global dentro da plataforma para crowdsourcing real, 
-- ou restrito por empresa se preferir privacidade total. 
-- Vamos implementar por empresa para seguir o padrão SaaS atual.

CREATE POLICY "Acesso Artigos" ON public.artigos_conhecimento
    USING (empresa_id IN (SELECT empresa_id FROM public.perfis WHERE id = auth.uid()) OR EXISTS (SELECT 1 FROM public.perfis WHERE id = auth.uid() AND role = 'super_admin'));

CREATE POLICY "Acesso Soluções" ON public.solucoes_conhecimento
    USING (artigo_id IN (SELECT id FROM public.artigos_conhecimento));

CREATE POLICY "Acesso Votos" ON public.votos_solucoes
    USING (usuario_id = auth.uid());

CREATE POLICY "Acesso Pontuação" ON public.pontuacao_tecnicos
    USING (true); -- Leaderboard pode ser visível para todos da empresa

-- ==========================================
-- TRIGGERS PARA PONTUAÇÃO
-- ==========================================

-- Função para atualizar pontos
CREATE OR REPLACE FUNCTION public.handle_knowledge_points()
RETURNS TRIGGER AS $$
BEGIN
    -- Se for nova solução: +10 pontos e incrementa contador
    IF (TG_OP = 'INSERT' AND TG_TABLE_NAME = 'solucoes_conhecimento') THEN
        INSERT INTO public.pontuacao_tecnicos (usuario_id, pontos_atuais, pontos_totais, contribuicoes_count)
        VALUES (NEW.autor_id, 10, 10, 1)
        ON CONFLICT (usuario_id) DO UPDATE SET
            pontos_atuais = pontuacao_tecnicos.pontos_atuais + 10,
            pontos_totais = pontuacao_tecnicos.pontos_totais + 10,
            contribuicoes_count = pontuacao_tecnicos.contribuicoes_count + 1;
    
    -- Se for voto: +5 pontos para o autor da solução se for Upvote
    ELSIF (TG_OP = 'INSERT' AND TG_TABLE_NAME = 'votos_solucoes' AND NEW.valor = 1) THEN
        DECLARE
            v_autor_id UUID;
        BEGIN
            SELECT autor_id INTO v_autor_id FROM public.solucoes_conhecimento WHERE id = NEW.solucao_id;
            IF v_autor_id IS NOT NULL THEN
                UPDATE public.pontuacao_tecnicos 
                SET pontos_atuais = pontos_atuais + 5, pontos_totais = pontos_totais + 5
                WHERE usuario_id = v_autor_id;
            END IF;
        END;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_pontos_solucao AFTER INSERT ON public.solucoes_conhecimento FOR EACH ROW EXECUTE FUNCTION public.handle_knowledge_points();
CREATE TRIGGER tr_pontos_voto AFTER INSERT ON public.votos_solucoes FOR EACH ROW EXECUTE FUNCTION public.handle_knowledge_points();

-- Trigger para atualizar contagem de votos na solucao
CREATE OR REPLACE FUNCTION public.update_solucao_scores()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.solucoes_conhecimento
    SET 
        votos_positivos = (SELECT count(*) FROM public.votos_solucoes WHERE solucao_id = NEW.solucao_id AND valor = 1),
        votos_negativos = (SELECT count(*) FROM public.votos_solucoes WHERE solucao_id = NEW.solucao_id AND valor = -1),
        utilidade_score = (SELECT sum(valor) FROM public.votos_solucoes WHERE solucao_id = NEW.solucao_id)
    WHERE id = NEW.solucao_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_update_score AFTER INSERT OR UPDATE ON public.votos_solucoes FOR EACH ROW EXECUTE FUNCTION public.update_solucao_scores();

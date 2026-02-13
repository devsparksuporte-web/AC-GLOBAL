-- Tabelas para Educação Continuada e Gamificação

-- 1. Cursos
CREATE TABLE IF NOT EXISTS ec_cursos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    descricao TEXT,
    capa_url TEXT,
    categoria TEXT, -- 'Segurança', 'Equipamentos', 'Técnico'
    carga_horaria INTEGER DEFAULT 0, -- em minutos
    xp_recompensa INTEGER DEFAULT 100,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Aulas/Módulos
CREATE TABLE IF NOT EXISTS ec_aulas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    curso_id UUID NOT NULL REFERENCES ec_cursos(id) ON DELETE CASCADE,
    ordem INTEGER NOT NULL,
    titulo TEXT NOT NULL,
    conteudo_tipo TEXT NOT NULL, -- 'video', 'texto', 'pdf'
    conteudo_url TEXT,
    duracao_estimada INTEGER DEFAULT 5, -- em minutos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Progresso do Técnico
CREATE TABLE IF NOT EXISTS ec_progresso_tecnico (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    perfil_id UUID NOT NULL REFERENCES perfis(id) ON DELETE CASCADE,
    aula_id UUID NOT NULL REFERENCES ec_aulas(id) ON DELETE CASCADE,
    concluido BOOLEAN DEFAULT false,
    data_conclusao TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(perfil_id, aula_id)
);

-- 4. Status de Gamificação do Técnico (Stats)
CREATE TABLE IF NOT EXISTS ec_tecnico_stats (
    perfil_id UUID PRIMARY KEY REFERENCES perfis(id) ON DELETE CASCADE,
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    xp_total INTEGER DEFAULT 0,
    nivel INTEGER DEFAULT 1,
    moedas_aprendizado INTEGER DEFAULT 0, -- para possíveis resgates/premiações
    cursos_concluidos INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Badges (Distintivos/Conquistas)
CREATE TABLE IF NOT EXISTS ec_badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    descricao TEXT,
    icone TEXT, -- Emoji ou URL
    tipo TEXT NOT NULL, -- 'curso_concluido', 'primeiro_passo', 'mestre_seguranca'
    requisito_valor INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Conquistas dos Técnicos
CREATE TABLE IF NOT EXISTS ec_conquistas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    perfil_id UUID NOT NULL REFERENCES perfis(id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES ec_badges(id) ON DELETE CASCADE,
    conquistado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(perfil_id, badge_id)
);

-- RLS
ALTER TABLE ec_cursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ec_aulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE ec_progresso_tecnico ENABLE ROW LEVEL SECURITY;
ALTER TABLE ec_tecnico_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE ec_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE ec_conquistas ENABLE ROW LEVEL SECURITY;

-- Políticas (Simplificadas: todos da empresa veem cursos/badges, progresso é individual)
DROP POLICY IF EXISTS "ec_cursos_select" ON ec_cursos;
CREATE POLICY "ec_cursos_select" ON ec_cursos FOR SELECT USING (empresa_id IN (SELECT empresa_id FROM perfis WHERE id = auth.uid()));

DROP POLICY IF EXISTS "ec_aulas_select" ON ec_aulas;
CREATE POLICY "ec_aulas_select" ON ec_aulas FOR SELECT USING (curso_id IN (SELECT id FROM ec_cursos));

DROP POLICY IF EXISTS "ec_progresso_all" ON ec_progresso_tecnico;
CREATE POLICY "ec_progresso_all" ON ec_progresso_tecnico FOR ALL USING (perfil_id = auth.uid());

DROP POLICY IF EXISTS "ec_stats_select" ON ec_tecnico_stats;
CREATE POLICY "ec_stats_select" ON ec_tecnico_stats FOR SELECT USING (empresa_id IN (SELECT empresa_id FROM perfis WHERE id = auth.uid()));

DROP POLICY IF EXISTS "ec_stats_update" ON ec_tecnico_stats;
CREATE POLICY "ec_stats_update" ON ec_tecnico_stats FOR UPDATE USING (perfil_id = auth.uid());

DROP POLICY IF EXISTS "ec_badges_select" ON ec_badges;
CREATE POLICY "ec_badges_select" ON ec_badges FOR SELECT USING (empresa_id IN (SELECT empresa_id FROM perfis WHERE id = auth.uid()));

DROP POLICY IF EXISTS "ec_conquistas_select" ON ec_conquistas;
CREATE POLICY "ec_conquistas_select" ON ec_conquistas FOR SELECT USING (perfil_id IN (SELECT id FROM perfis WHERE empresa_id IN (SELECT empresa_id FROM perfis WHERE id = auth.uid())));

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $body$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$body$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_ec_cursos_modtime ON ec_cursos;
CREATE TRIGGER update_ec_cursos_modtime BEFORE UPDATE ON ec_cursos FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_ec_progresso_modtime ON ec_progresso_tecnico;
CREATE TRIGGER update_ec_progresso_modtime BEFORE UPDATE ON ec_progresso_tecnico FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_ec_tecnico_stats_modtime ON ec_tecnico_stats;
CREATE TRIGGER update_ec_tecnico_stats_modtime BEFORE UPDATE ON ec_tecnico_stats FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

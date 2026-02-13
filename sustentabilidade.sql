-- Tabelas para Sustentabilidade e Controle de Gases

-- 1. Catálogo de Gases Refrigerantes
CREATE TABLE IF NOT EXISTS sus_gases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    nome TEXT NOT NULL, -- ex: R-410A, R-22, R-32
    gwp NUMERIC(10,2) NOT NULL, -- Global Warming Potential
    unidade TEXT DEFAULT 'kg',
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Inventário de Cilindros (Técnico/Veículo)
CREATE TABLE IF NOT EXISTS sus_cilindros (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    num_serie TEXT NOT NULL,
    gas_id UUID NOT NULL REFERENCES sus_gases(id),
    perfil_id UUID REFERENCES perfis(id), -- Técnico responsável
    capacidade_total NUMERIC(10,2) NOT NULL,
    peso_atual NUMERIC(10,2) NOT NULL,
    status TEXT DEFAULT 'em_uso', -- 'em_uso', 'vazio', 'manutencao'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Registros de Manuseio de Gás (Carga/Recuperação)
CREATE TABLE IF NOT EXISTS sus_registros_gas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    os_id UUID NOT NULL REFERENCES ordens_servico(id) ON DELETE CASCADE,
    cilindro_id UUID NOT NULL REFERENCES sus_cilindros(id),
    tipo_operacao TEXT NOT NULL, -- 'carga', 'recuperacao', 'descarte_legal'
    quantidade NUMERIC(10,3) NOT NULL,
    co2_equivalente NUMERIC(10,3), -- Calculado (GWP * quantidade)
    foto_balanca_url TEXT, -- Comprovação visual
    perfil_id UUID NOT NULL REFERENCES perfis(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Eficiência Energética pós-manutenção
CREATE TABLE IF NOT EXISTS sus_eficiencia_equipamento (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    os_id UUID NOT NULL REFERENCES ordens_servico(id) ON DELETE CASCADE,
    consumo_antes NUMERIC(10,2), -- Amperagem/Watts
    consumo_depois NUMERIC(10,2),
    melhoria_percentual NUMERIC(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Incentivos e Pontos Verdes
CREATE TABLE IF NOT EXISTS sus_tecnico_pontos_verde (
    perfil_id UUID PRIMARY KEY REFERENCES perfis(id) ON DELETE CASCADE,
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    pontos_acumulados INTEGER DEFAULT 0,
    kg_recuperados NUMERIC(10,3) DEFAULT 0,
    co2_evitado NUMERIC(10,3) DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS
ALTER TABLE sus_gases ENABLE ROW LEVEL SECURITY;
ALTER TABLE sus_cilindros ENABLE ROW LEVEL SECURITY;
ALTER TABLE sus_registros_gas ENABLE ROW LEVEL SECURITY;
ALTER TABLE sus_eficiencia_equipamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE sus_tecnico_pontos_verde ENABLE ROW LEVEL SECURITY;

-- Políticas
DROP POLICY IF EXISTS "sus_gases_select" ON sus_gases;
CREATE POLICY "sus_gases_select" ON sus_gases FOR SELECT USING (empresa_id IN (SELECT empresa_id FROM perfis WHERE id = auth.uid()));

DROP POLICY IF EXISTS "sus_cilindros_all" ON sus_cilindros;
CREATE POLICY "sus_cilindros_all" ON sus_cilindros FOR ALL USING (empresa_id IN (SELECT empresa_id FROM perfis WHERE id = auth.uid()));

DROP POLICY IF EXISTS "sus_registros_all" ON sus_registros_gas;
CREATE POLICY "sus_registros_all" ON sus_registros_gas FOR ALL USING (empresa_id IN (SELECT empresa_id FROM perfis WHERE id = auth.uid()));

DROP POLICY IF EXISTS "sus_eficiencia_all" ON sus_eficiencia_equipamento;
CREATE POLICY "sus_eficiencia_all" ON sus_eficiencia_equipamento FOR ALL USING (empresa_id IN (SELECT empresa_id FROM perfis WHERE id = auth.uid()));

DROP POLICY IF EXISTS "sus_pontos_select" ON sus_tecnico_pontos_verde;
CREATE POLICY "sus_pontos_select" ON sus_tecnico_pontos_verde FOR SELECT USING (empresa_id IN (SELECT empresa_id FROM perfis WHERE id = auth.uid()));

-- Trigger para updated_at em cilindros
DROP TRIGGER IF EXISTS update_sus_cilindros_modtime ON sus_cilindros;
CREATE TRIGGER update_sus_cilindros_modtime BEFORE UPDATE ON sus_cilindros FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_sus_tecnico_pontos_modtime ON sus_tecnico_pontos_verde;
CREATE TRIGGER update_sus_tecnico_pontos_modtime BEFORE UPDATE ON sus_tecnico_pontos_verde FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

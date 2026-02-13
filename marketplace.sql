-- Tabelas para Marketplace de Técnicos Autônomos

-- 1. Perfil de Freelancers
CREATE TABLE IF NOT EXISTS mkp_freelancers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    perfil_id UUID UNIQUE NOT NULL REFERENCES perfis(id) ON DELETE CASCADE,
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    specialties TEXT[], -- ['HVAC Central', 'Split', 'Chiller']
    regioes_atendimento TEXT[], -- ['São Paulo - SP', 'Campinas - SP']
    documento_identidade TEXT, -- RG/CPF para pagamentos
    dados_bancarios JSONB, -- { banco, agencia, conta, pix }
    avaliacao_media NUMERIC(3,2) DEFAULT 0,
    total_avaliacoes INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pendente_aprovacao', -- 'pendente_aprovacao', 'ativo', 'inativo'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Vagas de Serviço (Oportunidades para Freelancers)
CREATE TABLE IF NOT EXISTS mkp_vagas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    os_id UUID NOT NULL REFERENCES ordens_servico(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    descricao TEXT,
    valor_proposto NUMERIC(10,2) NOT NULL,
    data_prevista TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT DEFAULT 'aberta', -- 'aberta', 'preenchida', 'cancelada'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Candidaturas e Atribuição
CREATE TABLE IF NOT EXISTS mkp_participantes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vaga_id UUID NOT NULL REFERENCES mkp_vagas(id) ON DELETE CASCADE,
    freelancer_id UUID NOT NULL REFERENCES mkp_freelancers(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'candidatado', -- 'candidatado', 'selecionado', 'recusado'
    valor_combinado NUMERIC(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(vaga_id, freelancer_id)
);

-- 4. Avaliações de Serviço
CREATE TABLE IF NOT EXISTS mkp_avaliacoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    os_id UUID NOT NULL REFERENCES ordens_servico(id) ON DELETE CASCADE,
    vaga_id UUID NOT NULL REFERENCES mkp_vagas(id) ON DELETE CASCADE,
    freelancer_id UUID NOT NULL REFERENCES mkp_freelancers(id) ON DELETE CASCADE,
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    nota INTEGER CHECK (nota >= 1 AND nota <= 5),
    comentario TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Pagamentos aos Freelancers
CREATE TABLE IF NOT EXISTS mkp_pagamentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    freelancer_id UUID NOT NULL REFERENCES mkp_freelancers(id) ON DELETE CASCADE,
    os_id UUID NOT NULL REFERENCES ordens_servico(id) ON DELETE CASCADE,
    valor NUMERIC(10,2) NOT NULL,
    status TEXT DEFAULT 'pendente', -- 'pendente', 'processando', 'pago', 'rejeitado'
    data_pagamento TIMESTAMP WITH TIME ZONE,
    comprovante_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS
ALTER TABLE mkp_freelancers ENABLE ROW LEVEL SECURITY;
ALTER TABLE mkp_vagas ENABLE ROW LEVEL SECURITY;
ALTER TABLE mkp_participantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE mkp_avaliacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE mkp_pagamentos ENABLE ROW LEVEL SECURITY;

-- Políticas
DROP POLICY IF EXISTS "mkp_freelancers_select" ON mkp_freelancers;
CREATE POLICY "mkp_freelancers_select" ON mkp_freelancers FOR SELECT USING (empresa_id IN (SELECT empresa_id FROM perfis WHERE id = auth.uid()));

DROP POLICY IF EXISTS "mkp_vagas_all" ON mkp_vagas;
CREATE POLICY "mkp_vagas_all" ON mkp_vagas FOR ALL USING (empresa_id IN (SELECT empresa_id FROM perfis WHERE id = auth.uid()));

DROP POLICY IF EXISTS "mkp_participantes_all" ON mkp_participantes;
CREATE POLICY "mkp_participantes_all" ON mkp_participantes FOR ALL USING (vaga_id IN (SELECT id FROM mkp_vagas));

DROP POLICY IF EXISTS "mkp_avaliacoes_all" ON mkp_avaliacoes;
CREATE POLICY "mkp_avaliacoes_all" ON mkp_avaliacoes FOR ALL USING (empresa_id IN (SELECT empresa_id FROM perfis WHERE id = auth.uid()));

DROP POLICY IF EXISTS "mkp_pagamentos_all" ON mkp_pagamentos;
CREATE POLICY "mkp_pagamentos_all" ON mkp_pagamentos FOR ALL USING (empresa_id IN (SELECT empresa_id FROM perfis WHERE id = auth.uid()));

-- Automização de Avaliação Média (Trigger)
CREATE OR REPLACE FUNCTION update_freelancer_rating()
RETURNS TRIGGER AS $body$
BEGIN
    UPDATE mkp_freelancers
    SET 
        avaliacao_media = (SELECT AVG(nota) FROM mkp_avaliacoes WHERE freelancer_id = NEW.freelancer_id),
        total_avaliacoes = (SELECT COUNT(*) FROM mkp_avaliacoes WHERE freelancer_id = NEW.freelancer_id),
        updated_at = now()
    WHERE id = NEW.freelancer_id;
    RETURN NEW;
END;
$body$ language 'plpgsql';

DROP TRIGGER IF EXISTS trg_update_rating ON mkp_avaliacoes;
CREATE TRIGGER trg_update_rating AFTER INSERT OR UPDATE ON mkp_avaliacoes
FOR EACH ROW EXECUTE PROCEDURE update_freelancer_rating();

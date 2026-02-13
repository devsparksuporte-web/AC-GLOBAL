-- Tabelas para Fornecedores e Pedidos de Compra

-- Tabela de Fornecedores
CREATE TABLE IF NOT EXISTS fornecedores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    email TEXT,
    telefone TEXT,
    cnpj TEXT,
    endereco TEXT,
    cidade TEXT,
    estado TEXT,
    cep TEXT,
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Pedidos de Compra
CREATE TABLE IF NOT EXISTS pedidos_compra (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    fornecedor_id UUID NOT NULL REFERENCES fornecedores(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pendente', -- pendente, enviado, recebido, cancelado
    valor_total DECIMAL(10,2) DEFAULT 0,
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Itens do Pedido de Compra
CREATE TABLE IF NOT EXISTS itens_pedido_compra (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    pedido_id UUID NOT NULL REFERENCES pedidos_compra(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    quantidade DECIMAL(10,2) NOT NULL,
    preco_unitario DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) GENERATED ALWAYS AS (quantidade * preco_unitario) STORED,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos_compra ENABLE ROW LEVEL SECURITY;
ALTER TABLE itens_pedido_compra ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para Fornecedores
CREATE POLICY "Fornecedores podem ser vistos pela mesma empresa" ON fornecedores
    FOR SELECT USING (empresa_id = (SELECT empresa_id FROM perfis WHERE id = auth.uid()));

CREATE POLICY "Fornecedores podem ser inseridos pela mesma empresa" ON fornecedores
    FOR INSERT WITH CHECK (empresa_id = (SELECT empresa_id FROM perfis WHERE id = auth.uid()));

CREATE POLICY "Fornecedores podem ser atualizados pela mesma empresa" ON fornecedores
    FOR UPDATE USING (empresa_id = (SELECT empresa_id FROM perfis WHERE id = auth.uid()));

CREATE POLICY "Fornecedores podem ser deletados pela mesma empresa" ON fornecedores
    FOR DELETE USING (empresa_id = (SELECT empresa_id FROM perfis WHERE id = auth.uid()));

-- Políticas de RLS para Pedidos de Compra
CREATE POLICY "Pedidos podem ser vistos pela mesma empresa" ON pedidos_compra
    FOR SELECT USING (empresa_id = (SELECT empresa_id FROM perfis WHERE id = auth.uid()));

CREATE POLICY "Pedidos podem ser inseridos pela mesma empresa" ON pedidos_compra
    FOR INSERT WITH CHECK (empresa_id = (SELECT empresa_id FROM perfis WHERE id = auth.uid()));

CREATE POLICY "Pedidos podem ser atualizados pela mesma empresa" ON pedidos_compra
    FOR UPDATE USING (empresa_id = (SELECT empresa_id FROM perfis WHERE id = auth.uid()));

CREATE POLICY "Pedidos podem ser deletados pela mesma empresa" ON pedidos_compra
    FOR DELETE USING (empresa_id = (SELECT empresa_id FROM perfis WHERE id = auth.uid()));

-- Políticas de RLS para Itens do Pedido
CREATE POLICY "Itens do pedido podem ser vistos pela mesma empresa" ON itens_pedido_compra
    FOR SELECT USING (empresa_id = (SELECT empresa_id FROM perfis WHERE id = auth.uid()));

CREATE POLICY "Itens do pedido podem ser inseridos pela mesma empresa" ON itens_pedido_compra
    FOR INSERT WITH CHECK (empresa_id = (SELECT empresa_id FROM perfis WHERE id = auth.uid()));

CREATE POLICY "Itens do pedido podem ser deletados pela mesma empresa" ON itens_pedido_compra
    FOR DELETE USING (empresa_id = (SELECT empresa_id FROM perfis WHERE id = auth.uid()));

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_fornecedores_updated_at BEFORE UPDATE ON fornecedores FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_pedidos_compra_updated_at BEFORE UPDATE ON pedidos_compra FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

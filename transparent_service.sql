-- ===============================================
-- TRANSPARENT SERVICE EXPERIENCE (Rastreamento, Timeline, Fotos)
-- ===============================================

-- 1. Extender Perfis com Geolocalização
ALTER TABLE public.perfis 
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS ultima_localizacao TIMESTAMPTZ;

-- 2. Extender Ordens de Serviço
ALTER TABLE public.ordens_servico
ADD COLUMN IF NOT EXISTS public_id UUID DEFAULT gen_random_uuid() UNIQUE,
ADD COLUMN IF NOT EXISTS rastreamento_ativo BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS tecnico_id UUID REFERENCES public.perfis(id);

-- 3. Tabela de Eventos do Serviço (Timeline)
CREATE TABLE IF NOT EXISTS public.eventos_servico (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ordem_id UUID REFERENCES public.ordens_servico(id) ON DELETE CASCADE,
    empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL, -- 'chegada', 'diagnostico', 'inicio', 'concluido', 'pausa', 'foto_adicionada'
    descricao TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabela de Galeria de Fotos
CREATE TABLE IF NOT EXISTS public.fotos_servico (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ordem_id UUID REFERENCES public.ordens_servico(id) ON DELETE CASCADE,
    empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    tipo VARCHAR(50) NOT NULL, -- 'antes', 'diagnostico', 'progresso', 'depois', 'problema'
    legenda TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Habilitar RLS e Políticas
ALTER TABLE public.eventos_servico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fotos_servico ENABLE ROW LEVEL SECURITY;

-- Limpar Políticas Antigas (para permitir re-execução)
DROP POLICY IF EXISTS "Acesso Público OS" ON public.ordens_servico;
DROP POLICY IF EXISTS "Acesso Público Cliente Tracking" ON public.clientes;
DROP POLICY IF EXISTS "Gestão Eventos" ON public.eventos_servico;
DROP POLICY IF EXISTS "Acesso Público Eventos" ON public.eventos_servico;
DROP POLICY IF EXISTS "Gestão Fotos" ON public.fotos_servico;
DROP POLICY IF EXISTS "Acesso Público Fotos" ON public.fotos_servico;
DROP POLICY IF EXISTS "Acesso Público Localização Técnico" ON public.perfis;

-- Políticas para Ordens de Serviço (Adicionando acesso público)
CREATE POLICY "Acesso Público OS" ON public.ordens_servico
    FOR SELECT
    TO anon
    USING (true);

-- Políticas para Clientes
CREATE POLICY "Acesso Público Cliente Tracking" ON public.clientes
    FOR SELECT
    TO anon
    USING (id IN (SELECT cliente_id FROM public.ordens_servico));

-- Políticas para Eventos
CREATE POLICY "Gestão Eventos" ON public.eventos_servico
    FOR ALL
    TO authenticated
    USING (empresa_id IN (SELECT empresa_id FROM public.perfis WHERE id = auth.uid()));

CREATE POLICY "Acesso Público Eventos" ON public.eventos_servico
    FOR SELECT
    TO anon
    USING (true);

-- Políticas para Fotos
CREATE POLICY "Gestão Fotos" ON public.fotos_servico
    FOR ALL
    TO authenticated
    USING (empresa_id IN (SELECT empresa_id FROM public.perfis WHERE id = auth.uid()));

CREATE POLICY "Acesso Público Fotos" ON public.fotos_servico
    FOR SELECT
    TO anon
    USING (true);

-- Políticas para Perfis
CREATE POLICY "Acesso Público Localização Técnico" ON public.perfis
    FOR SELECT
    TO anon
    USING (true);

-- 6. Bucket de Storage e Políticas de Acesso
-- Nota: Buckets podem ser criados via Dashboard ou via insert abaixo (requer admin)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('servicos', 'servicos', true), ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Limpar Políticas de Storage Antigas
DROP POLICY IF EXISTS "Acesso Público Fotos Storage" ON storage.objects;
DROP POLICY IF EXISTS "Upload Fotos Tecnico" ON storage.objects;
DROP POLICY IF EXISTS "Acesso Público Avatars" ON storage.objects;
DROP POLICY IF EXISTS "Upload Avatars Usuario" ON storage.objects;
DROP POLICY IF EXISTS "Update Avatars Usuario" ON storage.objects;

-- Políticas para bucket 'servicos'
CREATE POLICY "Acesso Público Fotos Storage" ON storage.objects 
    FOR SELECT USING (bucket_id = 'servicos');

CREATE POLICY "Upload Fotos Tecnico" ON storage.objects 
    FOR INSERT 
    TO authenticated 
    WITH CHECK (bucket_id = 'servicos');

-- Políticas para bucket 'avatars'
CREATE POLICY "Acesso Público Avatars" ON storage.objects 
    FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Upload Avatars Usuario" ON storage.objects 
    FOR INSERT 
    TO authenticated 
    WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Update Avatars Usuario" ON storage.objects 
    FOR UPDATE 
    TO authenticated 
    USING (bucket_id = 'avatars');

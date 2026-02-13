-- Forçar usuário específico como Super Admin
UPDATE public.perfis 
SET role = 'super_admin' 
WHERE id = '3ca55a15-f95c-4d74-b5ab-1b1e75136417';

-- Se não existir perfil, cria (caso raro onde a trigger de auth falhou ou não existe)
INSERT INTO public.perfis (id, empresa_id, nome, role)
SELECT 
    '3ca55a15-f95c-4d74-b5ab-1b1e75136417', 
    (SELECT id FROM public.empresas LIMIT 1), -- Pega a primeira empresa
    'Super Admin', 
    'super_admin'
WHERE NOT EXISTS (SELECT 1 FROM public.perfis WHERE id = '3ca55a15-f95c-4d74-b5ab-1b1e75136417');

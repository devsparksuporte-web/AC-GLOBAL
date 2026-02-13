-- CORREÇÃO v4: Suporte correto para Super Admin (sem empresa) e Admin
-- Garante que 'gen_salt' seja encontrado no schema extensions

create extension if not exists pgcrypto;

create or replace function update_user_password(user_id uuid, new_password text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_role text;
  v_empresa_id uuid;
begin
  -- 1. Identificar quem está chamando a função
  select role, empresa_id 
  into v_role, v_empresa_id
  from public.perfis
  where id = auth.uid();

  -- 2. Verificar permissões
  if v_role not in ('admin', 'super_admin') or v_role is null then
    raise exception 'Acesso negado. Permissão insuficiente.';
  end if;

  -- 3. Atualizar a senha (auth.users)
  update auth.users
  set encrypted_password = crypt(new_password, gen_salt('bf'))
  where id = user_id;

  -- 4. Registrar Auditoria
  -- Se for super_admin sem empresa, v_empresa_id pode ser null (ok se a tabela permitir ou tiver triggers)
  insert into public.logs_auditoria (
    empresa_id, 
    user_id, 
    acao, 
    tabela, 
    registro_id, 
    dados_antigos, 
    dados_novos
  )
  values (
    v_empresa_id, -- Pode ser NULL para Super Admin Global
    auth.uid(),
    'UPDATE',
    'auth.users',
    user_id,
    jsonb_build_object('field', 'password'),
    jsonb_build_object('status', 'changed')
  );
end;
$$;

-- CORREÇÃO v5: Solução Completa
-- 1. Garante que o email seja marcado como CONFIRMADO (evita erro 400 no login)
-- 2. Atualiza a senha
-- 3. Verifica se o usuário realmente existe (evita falha silenciosa)

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
  v_rows_updated int;
begin
  -- 1. Identificar quem está chamando a função e garantir permissão
  select role, empresa_id 
  into v_role, v_empresa_id
  from public.perfis
  where id = auth.uid();

  if v_role not in ('admin', 'super_admin') or v_role is null then
    raise exception 'Acesso negado. Permissão insuficiente.';
  end if;

  -- 2. Atualizar a senha E confirmar o email na tabela auth.users
  update auth.users
  set 
    encrypted_password = crypt(new_password, gen_salt('bf', 10)), -- Custo 10 (padrão seguro)
    email_confirmed_at = coalesce(email_confirmed_at, now()),     -- Confirma o email se ainda não estiver confirmado
    updated_at = now()
  where id = user_id;

  get diagnostics v_rows_updated = row_count;

  if v_rows_updated = 0 then
    raise exception 'Usuário não encontrado no banco de autenticação (ID: %).', user_id;
  end if;

  -- 3. Registrar Auditoria
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
    v_empresa_id,
    auth.uid(),
    'UPDATE',
    'auth.users',
    user_id,
    jsonb_build_object('field', 'password'),
    jsonb_build_object('status', 'changed', 'confirmed', true)
  );
end;
$$;

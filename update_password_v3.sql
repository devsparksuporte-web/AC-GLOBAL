-- CORREÇÃO FINAL: Ajuste nos nomes das colunas de auditoria
-- logs_auditoria usa 'user_id' e exige 'registro_id'

create extension if not exists pgcrypto;

create or replace function update_user_password(user_id uuid, new_password text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  admin_empresa_id uuid;
begin
  -- Verifica se o usuário que chamou a função é admin ou super_admin e pega a empresa
  select empresa_id into admin_empresa_id
  from public.perfis
  where id = auth.uid()
  and role in ('admin', 'super_admin');

  if admin_empresa_id is null then
    raise exception 'Acesso negado. Apenas administradores podem alterar senhas.';
  end if;

  -- Atualiza a senha na tabela auth.users
  update auth.users
  set encrypted_password = crypt(new_password, gen_salt('bf'))
  where id = user_id;

  -- Registra no log de auditoria com as colunas corretas
  insert into public.logs_auditoria (
    empresa_id, 
    user_id, 
    acao, 
    tabela, 
    registro_id, -- Coluna obrigatória que estava faltando
    dados_antigos, 
    dados_novos
  )
  values (
    admin_empresa_id,
    auth.uid(),
    'UPDATE',
    'auth.users',
    user_id, -- O ID do usuário que teve a senha alterada
    jsonb_build_object('field', 'password'),
    jsonb_build_object('status', 'changed')
  );
end;
$$;

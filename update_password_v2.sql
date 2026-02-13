-- CORREÇÃO: Função RPC para atualizar senha
-- Adicionamos 'extensions' no search_path para garantir que o pgcrypto seja encontrado

create extension if not exists pgcrypto;

create or replace function update_user_password(user_id uuid, new_password text)
returns void
language plpgsql
security definer
-- IMPORTANTE: Adicionamos 'extensions' aqui pois o Supabase costuma instalar lá
set search_path = public, extensions
as $$
begin
  -- Verifica se o usuário que chamou a função é admin ou super_admin
  if not exists (
    select 1 from public.perfis
    where id = auth.uid()
    and role in ('admin', 'super_admin')
  ) then
    raise exception 'Acesso negado. Apenas administradores podem alterar senhas.';
  end if;

  -- Atualiza a senha na tabela auth.users
  update auth.users
  set encrypted_password = crypt(new_password, gen_salt('bf'))
  where id = user_id;

  -- Registra no log de auditoria
  insert into public.logs_auditoria (empresa_id, perfil_id, acao, tabela, dados_antigos, dados_novos)
  values (
    (select empresa_id from public.perfis where id = auth.uid()),
    auth.uid(),
    'UPDATE',
    'auth.users',
    jsonb_build_object('user_id', user_id, 'field', 'password'),
    jsonb_build_object('status', 'changed')
  );
end;
$$;

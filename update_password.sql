-- Função RPC para atualizar senha de usuário (Apenas Admin/Super Admin)
-- Esta função deve ser executada no SQL Editor do Supabase

-- Habilita a extensão pgcrypto se ainda não estiver habilitada
create extension if not exists pgcrypto;

create or replace function update_user_password(user_id uuid, new_password text)
returns void
language plpgsql
security definer -- Executa com privilégios do criador (postgres) para acessar auth.users
set search_path = public -- Previne search_path injection
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

  -- Registra no log de auditoria (opcional, mas recomendado)
  insert into public.logs_auditoria (empresa_id, perfil_id, acao, tabela, dados_antigos, dados_novos)
  values (
    (select empresa_id from public.perfis where id = auth.uid()), -- Empresa do admin
    auth.uid(), -- ID do admin
    'UPDATE',
    'auth.users',
    jsonb_build_object('user_id', user_id, 'field', 'password'),
    jsonb_build_object('status', 'changed')
  );

end;
$$;

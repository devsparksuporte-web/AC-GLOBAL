-- FIX: Criar perfil para usuário Super Admin se não existir
-- ID do usuário reportado no erro: c2b14aaa-3af6-4760-9c21-00a3ca84812f

do $$
begin
  if not exists (select 1 from public.perfis where id = 'c2b14aaa-3af6-4760-9c21-00a3ca84812f') then
    insert into public.perfis (id, nome, email, role, empresa_id)
    values (
      'c2b14aaa-3af6-4760-9c21-00a3ca84812f',
      'Super Admin (Recuperado)',
      'admin@sistema.com', -- Email placeholder, será atualizado no próximo login se diferente
      'super_admin',
      null -- Super Admin não precisa de empresa
    );
  end if;
end;
$$;

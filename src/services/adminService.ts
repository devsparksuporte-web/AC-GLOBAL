import { supabase } from '../lib/supabase';
import type { Empresa, UserProfile, UserRole, AuditLog } from '../types';

export const adminService = {
    // === EMPRESAS ===

    async listarEmpresas(): Promise<Empresa[]> {
        const { data, error } = await supabase
            .from('empresas')
            .select('*')
            .order('nome');

        if (error) throw error;
        return data || [];
    },

    async criarEmpresa(empresa: Omit<Empresa, 'id' | 'created_at' | 'updated_at'>): Promise<Empresa> {
        const { data, error } = await supabase
            .from('empresas')
            .insert(empresa)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async atualizarEmpresa(id: string, empresa: Partial<Empresa>): Promise<Empresa> {
        const { data, error } = await supabase
            .from('empresas')
            .update(empresa)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async excluirEmpresa(id: string): Promise<void> {
        const { error } = await supabase
            .from('empresas')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // === USUÁRIOS ===

    async listarUsuarios(): Promise<UserProfile[]> {
        const { data, error } = await supabase
            .from('perfis')
            .select('*, empresa:empresas(nome)')
            .order('nome');

        if (error) throw error;
        return data || [];
    },

    async listarUsuariosPorEmpresa(empresaId: string): Promise<UserProfile[]> {
        const { data, error } = await supabase
            .from('perfis')
            .select('*, empresa:empresas(nome)')
            .eq('empresa_id', empresaId)
            .order('nome');

        if (error) throw error;
        return data || [];
    },

    async atualizarPerfilUsuario(id: string, dados: { role?: UserRole; empresa_id?: string; nome?: string; telefone?: string | null; password?: string }): Promise<UserProfile> {
        // 1. Atualizar dados do perfil (public)
        const { data, error } = await supabase
            .from('perfis')
            .update({
                role: dados.role,
                empresa_id: dados.empresa_id,
                nome: dados.nome,
                telefone: dados.telefone
            })
            .eq('id', id)
            .select('*, empresa:empresas(nome)')
            .single();

        if (error) throw error;

        // 2. Se houver senha, atualizar via RPC (auth)
        if (dados.password && dados.password.trim() !== '') {
            const { error: rpcError } = await supabase.rpc('update_user_password', {
                user_id: id,
                new_password: dados.password
            });

            if (rpcError) {
                console.error('Erro ao atualizar senha:', rpcError);
                throw new Error('Perfil atualizado, mas erro ao alterar senha: ' + rpcError.message);
            }
        }

        return data;
    },

    // Função para criar um novo usuário (Auth + Perfil)
    async criarUsuarioComAcesso(dados: { email: string; password?: string; nome: string; empresa_id: string; role: UserRole; telefone?: string }): Promise<UserProfile> {
        // 1. Criar o usuário no Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: dados.email,
            password: dados.password || 'Mudar@123',
            options: {
                data: {
                    nome: dados.nome,
                    role: dados.role
                }
            }
        });

        if (authError) {
            if (authError.message.includes('User already registered')) {
                throw new Error('Este e-mail já está cadastrado no sistema. Se o perfil não aparecer na lista, verifique se ele pertence a outra empresa ou entre em contato com o suporte.');
            }
            throw authError;
        }
        if (!authData.user) throw new Error('Não foi possível criar o usuário no Auth.');

        // 2. Criar o perfil
        const { data: profileData, error: profileError } = await supabase
            .from('perfis')
            .upsert({
                id: authData.user.id,
                empresa_id: dados.empresa_id,
                nome: dados.nome,
                email: dados.email,
                role: dados.role,
                telefone: dados.telefone
            })
            .select('*, empresa:empresas(nome)')
            .single();

        if (profileError) throw profileError;
        return profileData;
    },

    async excluirPerfil(id: string): Promise<void> {
        const { error } = await supabase
            .from('perfis')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // === AUDITORIA ===

    async listarAuditoria(): Promise<AuditLog[]> {
        const { data, error } = await supabase
            .from('logs_auditoria')
            .select(`
                *,
                perfil:perfis(nome),
                empresa:empresas(nome)
            `)
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) throw error;
        return data || [];
    }
};

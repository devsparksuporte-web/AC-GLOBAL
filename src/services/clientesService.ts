import { supabase } from '../lib/supabase';
import type { Cliente, ClienteInput } from '../types';

export const clientesService = {
    // Listar todos os clientes
    async listar(): Promise<Cliente[]> {
        const { data, error } = await supabase
            .from('clientes')
            .select('*')
            .eq('ativo', true)
            .order('nome');

        if (error) throw error;
        return data || [];
    },

    // Buscar cliente por ID
    async buscarPorId(id: string): Promise<Cliente | null> {
        const { data, error } = await supabase
            .from('clientes')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    // Criar novo cliente
    async criar(cliente: ClienteInput): Promise<Cliente> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        const { data: perfil } = await supabase
            .from('perfis')
            .select('empresa_id, role')
            .eq('id', user.id)
            .single();

        if (!perfil) throw new Error('Perfil não encontrado');

        // Se for super admin e forneceu uma empresa, usa a fornecida
        // Caso contrário, usa a empresa do perfil
        let empresaIdParaCadastro = perfil.empresa_id;

        if (perfil.role === 'super_admin' && cliente.empresa_id) {
            empresaIdParaCadastro = cliente.empresa_id;
        }

        if (!empresaIdParaCadastro) throw new Error('Empresa não definida para o cadastro');

        // Remove empresa_id do objeto cliente para não duplicar, pois vamos passar explicitamente
        const { empresa_id, ...dadosCliente } = cliente;

        const { data, error } = await supabase
            .from('clientes')
            .insert([{ ...dadosCliente, empresa_id: empresaIdParaCadastro }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Atualizar cliente
    async atualizar(id: string, cliente: Partial<ClienteInput>): Promise<Cliente> {
        const { data, error } = await supabase
            .from('clientes')
            .update(cliente)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Excluir cliente
    async excluir(id: string): Promise<void> {
        const { error } = await supabase
            .from('clientes')
            .update({ ativo: false })
            .eq('id', id);

        if (error) throw error;
    },

    // Buscar clientes por termo
    async buscar(termo: string): Promise<Cliente[]> {
        const { data, error } = await supabase
            .from('clientes')
            .select('*')
            .eq('ativo', true)
            .or(`nome.ilike.%${termo}%,telefone.ilike.%${termo}%,email.ilike.%${termo}%`)
            .order('nome');

        if (error) throw error;
        return data || [];
    },

    // Contar total de clientes
    async contar(): Promise<number> {
        const { count, error } = await supabase
            .from('clientes')
            .select('*', { count: 'exact', head: true })
            .eq('ativo', true);

        if (error) throw error;
        return count || 0;
    }
};

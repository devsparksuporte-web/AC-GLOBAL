import { supabase } from '../lib/supabase';
import type { Produto, ProdutoInput } from '../types';

export const produtosService = {
    // Listar todos os produtos
    async listar(): Promise<Produto[]> {
        const { data, error } = await supabase
            .from('produtos')
            .select('*')
            .order('nome');

        if (error) throw error;
        return data || [];
    },

    // Buscar produto por ID
    async buscarPorId(id: string): Promise<Produto | null> {
        const { data, error } = await supabase
            .from('produtos')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    // Criar novo produto
    async criar(produto: ProdutoInput): Promise<Produto> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        const { data: perfil } = await supabase
            .from('perfis')
            .select('empresa_id')
            .eq('id', user.id)
            .single();

        if (!perfil?.empresa_id) throw new Error('Empresa não encontrada para o usuário');

        const { data, error } = await supabase
            .from('produtos')
            .insert([{ ...produto, empresa_id: perfil.empresa_id }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Atualizar produto
    async atualizar(id: string, produto: Partial<ProdutoInput>): Promise<Produto> {
        const { data, error } = await supabase
            .from('produtos')
            .update(produto)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Excluir produto
    async excluir(id: string): Promise<void> {
        const { error } = await supabase
            .from('produtos')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // Buscar produtos com estoque baixo
    async buscarEstoqueBaixo(): Promise<Produto[]> {
        // Nota: Comparação de colunas não é direta no filtro simples, 
        // então vamos buscar todos e filtrar no client-side ou usar rpc
        // Por simplicidade e volume baixo, faremos no client-side por enquanto
        const { data, error } = await supabase
            .from('produtos')
            .select('*')
            .order('quantidade');

        if (error) throw error;

        return (data || []).filter(p => p.quantidade <= p.minimo);
    },

    // Contar total
    async contar(): Promise<number> {
        const { count, error } = await supabase
            .from('produtos')
            .select('*', { count: 'exact', head: true });

        if (error) throw error;
        return count || 0;
    }
};

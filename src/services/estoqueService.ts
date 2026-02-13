import { supabase } from '../lib/supabase';
import type { EstoqueItem, MovimentacaoEstoque } from '../types';

export const estoqueService = {
    async listar(): Promise<EstoqueItem[]> {
        const { data, error } = await supabase
            .from('estoque')
            .select('*')
            .order('nome', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    async criar(item: Omit<EstoqueItem, 'id' | 'created_at' | 'updated_at' | 'empresa_id'>): Promise<EstoqueItem> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        const { data: perfil } = await supabase
            .from('perfis')
            .select('empresa_id')
            .eq('id', user.id)
            .single();

        if (!perfil?.empresa_id) throw new Error('Perfil ou empresa não encontrados');

        const { data, error } = await supabase
            .from('estoque')
            .insert([{ ...item, empresa_id: perfil.empresa_id }])
            .select()
            .single();

        if (error) {
            console.error('Erro ao criar item no estoque:', error);
            throw error;
        }
        return data;
    },

    async atualizar(id: string, item: Partial<EstoqueItem>): Promise<EstoqueItem> {
        // Sanitização: não permitir atualizar campos protegidos
        const { id: _, created_at, updated_at, empresa_id, ...dadosParaAtualizar } = item as any;

        const { data, error } = await supabase
            .from('estoque')
            .update(dadosParaAtualizar)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Erro ao atualizar item no estoque:', error);
            throw error;
        }
        return data;
    },

    async excluir(id: string): Promise<void> {
        const { error } = await supabase
            .from('estoque')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async registrarMovimentacao(mov: Omit<MovimentacaoEstoque, 'id' | 'created_at' | 'empresa_id' | 'usuario_id'>): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        const { data: perfil } = await supabase
            .from('perfis')
            .select('empresa_id')
            .eq('id', user.id)
            .single();

        // 1. Registrar a movimentação
        const { error: movError } = await supabase
            .from('movimentacao_estoque')
            .insert([{
                ...mov,
                empresa_id: perfil?.empresa_id,
                usuario_id: user.id
            }]);

        if (movError) throw movError;

        // 2. Atualizar o saldo no estoque
        const { data: item } = await supabase
            .from('estoque')
            .select('quantidade')
            .eq('id', mov.item_id)
            .single();

        if (item) {
            const novaQuantidade = mov.tipo === 'entrada'
                ? Number(item.quantidade) + Number(mov.quantidade)
                : Number(item.quantidade) - Number(mov.quantidade);

            await supabase
                .from('estoque')
                .update({ quantidade: novaQuantidade })
                .eq('id', mov.item_id);
        }
    }
};

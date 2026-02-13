import { supabase } from '../lib/supabase';
import type { Fornecedor, PedidoCompra, ItemPedidoCompra } from '../types';

export const fornecedoresService = {
    // === GESTÃO DE FORNECEDORES ===

    async listar(): Promise<Fornecedor[]> {
        const { data, error } = await supabase
            .from('fornecedores')
            .select('*')
            .order('nome', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    async buscarPorId(id: string): Promise<Fornecedor | null> {
        const { data, error } = await supabase
            .from('fornecedores')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    async criar(fornecedor: Omit<Fornecedor, 'id' | 'created_at' | 'updated_at' | 'empresa_id'>): Promise<Fornecedor> {
        const { data: { user } } = await supabase.auth.getUser();
        const { data: perfil } = await supabase.from('perfis').select('empresa_id').eq('id', user?.id).single();

        if (!perfil?.empresa_id) throw new Error('Empresa não encontrada');

        const { data, error } = await supabase
            .from('fornecedores')
            .insert([{ ...fornecedor, empresa_id: perfil.empresa_id }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async atualizar(id: string, fornecedor: Partial<Fornecedor>): Promise<Fornecedor> {
        const { data, error } = await supabase
            .from('fornecedores')
            .update(fornecedor)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async excluir(id: string): Promise<void> {
        const { error } = await supabase
            .from('fornecedores')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // === GESTÃO DE PEDIDOS DE COMPRA ===

    async listarPedidos(fornecedorId?: string): Promise<PedidoCompra[]> {
        let query = supabase
            .from('pedidos_compra')
            .select(`
                *,
                fornecedor:fornecedores(id, nome, telefone, email)
            `)
            .order('created_at', { ascending: false });

        if (fornecedorId) {
            query = query.eq('fornecedor_id', fornecedorId);
        }

        const { data, error } = await query;

        if (error) throw error;
        return data || [];
    },

    async buscarPedidoPorId(id: string): Promise<PedidoCompra | null> {
        const { data, error } = await supabase
            .from('pedidos_compra')
            .select(`
                *,
                fornecedor:fornecedores(*)
            `)
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    async criarPedido(pedido: Omit<PedidoCompra, 'id' | 'created_at' | 'updated_at' | 'empresa_id' | 'fornecedor'>): Promise<PedidoCompra> {
        const { data: { user } } = await supabase.auth.getUser();
        const { data: perfil } = await supabase.from('perfis').select('empresa_id').eq('id', user?.id).single();

        if (!perfil?.empresa_id) throw new Error('Empresa não encontrada');

        const { data, error } = await supabase
            .from('pedidos_compra')
            .insert([{ ...pedido, empresa_id: perfil.empresa_id }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async atualizarPedido(id: string, pedido: Partial<PedidoCompra>): Promise<PedidoCompra> {
        const { data, error } = await supabase
            .from('pedidos_compra')
            .update(pedido)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async excluirPedido(id: string): Promise<void> {
        const { error } = await supabase
            .from('pedidos_compra')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // === ITENS DO PEDIDO ===

    async listarItensPedido(pedidoId: string): Promise<ItemPedidoCompra[]> {
        const { data, error } = await supabase
            .from('itens_pedido_compra')
            .select('*')
            .eq('pedido_id', pedidoId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    async adicionarItemPedido(item: Omit<ItemPedidoCompra, 'id' | 'created_at' | 'empresa_id' | 'total'>): Promise<ItemPedidoCompra> {
        const { data: { user } } = await supabase.auth.getUser();
        const { data: perfil } = await supabase.from('perfis').select('empresa_id').eq('id', user?.id).single();

        const { data, error } = await supabase
            .from('itens_pedido_compra')
            .insert([{ ...item, empresa_id: perfil?.empresa_id }])
            .select()
            .single();

        if (error) throw error;

        // Atualizar o valor_total do pedido
        await this.recalcularTotalPedido(item.pedido_id);

        return data;
    },

    async removerItemPedido(id: string, pedidoId: string): Promise<void> {
        const { error } = await supabase
            .from('itens_pedido_compra')
            .delete()
            .eq('id', id);

        if (error) throw error;

        // Atualizar o valor_total do pedido
        await this.recalcularTotalPedido(pedidoId);
    },

    async recalcularTotalPedido(pedidoId: string): Promise<void> {
        const { data: itens, error: errorItens } = await supabase
            .from('itens_pedido_compra')
            .select('quantidade, preco_unitario')
            .eq('pedido_id', pedidoId);

        if (errorItens) throw errorItens;

        const total = (itens || []).reduce((acc, item) => acc + (item.quantidade * item.preco_unitario), 0);

        const { error: errorUpdate } = await supabase
            .from('pedidos_compra')
            .update({ valor_total: total })
            .eq('id', pedidoId);

        if (errorUpdate) throw errorUpdate;
    }
};

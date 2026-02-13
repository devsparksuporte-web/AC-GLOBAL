import { supabase } from '../lib/supabase';
import type { GarantiaEquipamento, ManualTecnico, Cotacao, ItemCotacao, RespostaCotacao, PedidoFornecedor } from '../types';

export const integracaoService = {
    // === GARANTIAS ===
    async listarGarantias(empresaId: string): Promise<GarantiaEquipamento[]> {
        const { data, error } = await supabase
            .from('garantias_equipamentos')
            .select('*')
            .eq('empresa_id', empresaId)
            .order('data_vencimento_garantia', { ascending: true });
        if (error) throw error;
        return data || [];
    },

    async criarGarantia(garantia: Partial<GarantiaEquipamento>): Promise<GarantiaEquipamento> {
        const { data, error } = await supabase
            .from('garantias_equipamentos')
            .insert(garantia)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    // === MANUAIS ===
    async listarManuais(empresaId: string): Promise<ManualTecnico[]> {
        const { data, error } = await supabase
            .from('manuais_tecnicos')
            .select('*')
            .eq('empresa_id', empresaId)
            .order('fabricante', { ascending: true });
        if (error) throw error;
        return data || [];
    },

    async criarManual(manual: Partial<ManualTecnico>): Promise<ManualTecnico> {
        const { data, error } = await supabase
            .from('manuais_tecnicos')
            .insert(manual)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    // === COTAÇÕES ===
    async listarCotacoes(empresaId: string): Promise<Cotacao[]> {
        const { data, error } = await supabase
            .from('cotacoes')
            .select('*, solicitante:perfis!solicitante_id(nome), itens:itens_cotacao(*, respostas:respostas_cotacao(*))')
            .eq('empresa_id', empresaId)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
    },

    async criarCotacao(cotacao: Partial<Cotacao>, itens: Partial<ItemCotacao>[]): Promise<Cotacao> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        const { data, error } = await supabase
            .from('cotacoes')
            .insert({ ...cotacao, solicitante_id: user.id })
            .select()
            .single();
        if (error) throw error;

        if (itens.length > 0) {
            const itensComId = itens.map(i => ({ ...i, cotacao_id: data.id }));
            await supabase.from('itens_cotacao').insert(itensComId);
        }
        return data;
    },

    async adicionarRespostaCotacao(resposta: Partial<RespostaCotacao>): Promise<RespostaCotacao> {
        const { data, error } = await supabase
            .from('respostas_cotacao')
            .insert(resposta)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async atualizarStatusCotacao(id: string, status: string): Promise<void> {
        const { error } = await supabase.from('cotacoes').update({ status }).eq('id', id);
        if (error) throw error;
    },

    // === PEDIDOS ===
    async listarPedidos(empresaId: string): Promise<PedidoFornecedor[]> {
        const { data, error } = await supabase
            .from('pedidos_fornecedor')
            .select('*')
            .eq('empresa_id', empresaId)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
    },

    async criarPedido(pedido: Partial<PedidoFornecedor>): Promise<PedidoFornecedor> {
        const { data, error } = await supabase
            .from('pedidos_fornecedor')
            .insert(pedido)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async atualizarPedido(id: string, dados: Partial<PedidoFornecedor>): Promise<PedidoFornecedor> {
        const { data, error } = await supabase
            .from('pedidos_fornecedor')
            .update(dados)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    }
};

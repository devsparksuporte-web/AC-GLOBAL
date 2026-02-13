import { supabase } from '../lib/supabase';
import type { Fatura } from '../types';

export const faturamentoService = {
    async listarFaturas(empresaId: string): Promise<Fatura[]> {
        const { data, error } = await supabase
            .from('faturas')
            .select(`
                *,
                cliente:clientes(nome),
                contrato:contratos(nome),
                ordem_servico:ordens_servico(numero)
            `)
            .eq('empresa_id', empresaId)
            .order('data_vencimento', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    async criarFatura(fatura: Omit<Fatura, 'id' | 'created_at' | 'updated_at' | 'cliente' | 'contrato' | 'ordem_servico'>): Promise<Fatura> {
        const { data, error } = await supabase
            .from('faturas')
            .insert(fatura)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async atualizarStatusFatura(id: string, status: Fatura['status'], dataPagamento?: string): Promise<Fatura> {
        const { data, error } = await supabase
            .from('faturas')
            .update({
                status,
                data_pagamento: dataPagamento || (status === 'pago' ? new Date().toISOString() : null)
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async excluirFatura(id: string): Promise<void> {
        const { error } = await supabase
            .from('faturas')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};

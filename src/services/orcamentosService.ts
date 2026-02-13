import { supabase } from '../lib/supabase';
import type { Orcamento, OrcamentoInput, ItemOrcamento } from '../types';

export const orcamentosService = {
    // Listar todos os orçamentos com dados do cliente
    async listar(): Promise<Orcamento[]> {
        const { data, error } = await supabase
            .from('orcamentos')
            .select(`
                *,
                cliente:clientes(id, nome, telefone, email)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    // Buscar orçamento por ID
    async buscarPorId(id: string): Promise<Orcamento | null> {
        const { data, error } = await supabase
            .from('orcamentos')
            .select(`
                *,
                cliente:clientes(*)
            `)
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    // Criar novo orçamento
    async criar(orcamento: OrcamentoInput): Promise<Orcamento> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        const { data: perfil } = await supabase
            .from('perfis')
            .select('empresa_id')
            .eq('id', user.id)
            .single();

        if (!perfil?.empresa_id) throw new Error('Empresa não encontrada para o usuário');

        const { data, error } = await supabase
            .from('orcamentos')
            .insert([{ ...orcamento, empresa_id: perfil.empresa_id }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Atualizar orçamento
    async atualizar(id: string, orcamento: Partial<OrcamentoInput>): Promise<Orcamento> {
        const { data, error } = await supabase
            .from('orcamentos')
            .update(orcamento)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Excluir orçamento
    async excluir(id: string): Promise<void> {
        const { error } = await supabase
            .from('orcamentos')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // --- Gestão de Itens do Orçamento ---

    async listarItens(orcamentoId: string): Promise<ItemOrcamento[]> {
        const { data, error } = await supabase
            .from('itens_orcamento')
            .select('*')
            .eq('orcamento_id', orcamentoId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    async adicionarItem(item: Omit<ItemOrcamento, 'id' | 'created_at' | 'empresa_id' | 'total'>): Promise<ItemOrcamento> {
        const { data: { user } } = await supabase.auth.getUser();
        const { data: perfil } = await supabase.from('perfis').select('empresa_id').eq('id', user?.id).single();

        const { data, error } = await supabase
            .from('itens_orcamento')
            .insert([{ ...item, empresa_id: perfil?.empresa_id }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async removerItem(id: string): Promise<void> {
        const { error } = await supabase
            .from('itens_orcamento')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};

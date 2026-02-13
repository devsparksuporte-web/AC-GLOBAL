import { supabase } from '../lib/supabase';
import type { Equipamento, ServicoPreco, OrdemServico } from '../types';

export const clientePortalService = {
    // 1. DASHBOARD E EQUIPAMENTOS

    async getMeusEquipamentos(): Promise<Equipamento[]> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Cliente não autenticado');

        // Buscar perfil para pegar cliente_id
        const { data: perfil } = await supabase
            .from('perfis')
            .select('cliente_id')
            .eq('id', user.id)
            .single();

        if (!perfil?.cliente_id) return [];

        const { data, error } = await supabase
            .from('equipamentos')
            .select('*')
            .eq('cliente_id', perfil.cliente_id)
            .order('nome');

        if (error) throw error;
        return data || [];
    },

    async getHistoricoServicos(): Promise<OrdemServico[]> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Cliente não autenticado');

        // RLS garante que ele veja apenas as dele se o cliente_id estiver no perfil
        const { data, error } = await supabase
            .from('ordens_servico')
            .select('*, cliente:clientes(*)')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    // 2. ORÇAMENTO AUTOMÁTICO E AGENDAMENTO

    async listarServicosDisponiveis(): Promise<ServicoPreco[]> {
        const { data, error } = await supabase
            .from('servicos_precos')
            .select('*')
            .eq('ativo', true)
            .order('nome');

        if (error) throw error;
        return data || [];
    },

    async agendarServico(dados: {
        equipamento_id: string;
        servico_id: string;
        data_agendamento: string;
        observacoes?: string;
    }) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        // Buscar perfil para pegar cliente_id e empresa_id
        const { data: perfil } = await supabase
            .from('perfis')
            .select('cliente_id, empresa_id')
            .eq('id', user.id)
            .single();

        if (!perfil?.cliente_id) throw new Error('Perfil de cliente não configurado corretamente');

        // Buscar preço do serviço
        const { data: servico } = await supabase
            .from('servicos_precos')
            .select('*')
            .eq('id', dados.servico_id)
            .single();

        // Buscar nome do equipamento
        const { data: equipamento } = await supabase
            .from('equipamentos')
            .select('nome')
            .eq('id', dados.equipamento_id)
            .single();

        // Criar Orçamento (que aparecerá para o Admin)
        const { data, error } = await supabase
            .from('orcamentos')
            .insert([{
                empresa_id: perfil.empresa_id,
                cliente_id: perfil.cliente_id,
                descricao: `${servico?.nome || 'Serviço'} - ${equipamento?.nome || 'Equipamento'}`,
                equipamento: equipamento?.nome,
                valor: servico?.preco_base || 0,
                data_inicio: dados.data_agendamento,
                status: 'pendente',
                observacoes: dados.observacoes
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    }
};

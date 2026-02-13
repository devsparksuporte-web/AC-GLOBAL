import { supabase } from '../lib/supabase';
import type { Freelancer, VagaServico, AvaliacaoMkp, PagamentoFreelancer } from '../types';

export const marketplaceService = {
    // FREELANCERS
    async listarFreelancers(empresaId: string): Promise<Freelancer[]> {
        const { data, error } = await supabase
            .from('mkp_freelancers')
            .select('*, perfil:perfis(*)')
            .eq('empresa_id', empresaId);

        if (error) throw error;
        return data;
    },

    async cadastrarFreelancer(freelancer: Partial<Freelancer>): Promise<Freelancer> {
        const { data, error } = await supabase
            .from('mkp_freelancers')
            .insert(freelancer)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // VAGAS E CANDIDATURAS
    async listarVagas(empresaId: string): Promise<VagaServico[]> {
        const { data, error } = await supabase
            .from('mkp_vagas')
            .select('*, os:ordens_servico(*)')
            .eq('empresa_id', empresaId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    async criarVaga(vaga: Partial<VagaServico>): Promise<VagaServico> {
        const { data, error } = await supabase
            .from('mkp_vagas')
            .insert(vaga)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async candidatar(vagaId: string, freelancerId: string): Promise<void> {
        const { error } = await supabase
            .from('mkp_participantes')
            .insert({ vaga_id: vagaId, freelancer_id: freelancerId });

        if (error) throw error;
    },

    // AVALIAÇÕES
    async avaliarServico(avaliacao: Partial<AvaliacaoMkp>): Promise<void> {
        const { error } = await supabase
            .from('mkp_avaliacoes')
            .insert(avaliacao);

        if (error) throw error;

        // Ao avaliar, também podemos disparar a criação do registro de pagamento
        await this.prepararPagamento(avaliacao.os_id!, avaliacao.freelancer_id!, avaliacao.empresa_id!);
    },

    // PAGAMENTOS
    async prepararPagamento(osId: string, freelancerId: string, empresaId: string): Promise<void> {
        // Obter valor combinado da candidatura
        const { data: participacao } = await supabase
            .from('mkp_participantes')
            .select('valor_combinado')
            .eq('freelancer_id', freelancerId)
            .eq('status', 'selecionado')
            .single();

        if (participacao) {
            await supabase.from('mkp_pagamentos').insert({
                empresa_id: empresaId,
                freelancer_id: freelancerId,
                os_id: osId,
                valor: participacao.valor_combinado,
                status: 'pendente'
            });
        }
    },

    async listarPagamentos(empresaId: string): Promise<PagamentoFreelancer[]> {
        const { data, error } = await supabase
            .from('mkp_pagamentos')
            .select('*, freelancer:mkp_freelancers(*, perfil:perfis(*))')
            .eq('empresa_id', empresaId);

        if (error) throw error;
        return data;
    },

    async atualizarStatusPagamento(id: string, status: string, comprovanteUrl?: string): Promise<void> {
        const update: any = { status };
        if (comprovanteUrl) {
            update.comprovante_url = comprovanteUrl;
            update.data_pagamento = new Date().toISOString();
        }

        const { error } = await supabase
            .from('mkp_pagamentos')
            .update(update)
            .eq('id', id);

        if (error) throw error;
    }
};

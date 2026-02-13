import { supabase } from '../lib/supabase';
import type {
    ProgramaFidelidade,
    PontosCliente,
    TransacaoPontos,
    Indicacao,
    DescontoPreventiva,
    Resgate
} from '../types';

export const fidelidadeService = {
    // === CONFIGURAÇÃO DO PROGRAMA ===
    async obterPrograma(empresaId: string): Promise<ProgramaFidelidade | null> {
        const { data, error } = await supabase
            .from('programas_fidelidade')
            .select('*')
            .eq('empresa_id', empresaId)
            .maybeSingle();

        if (error) throw error;
        return data;
    },

    async salvarPrograma(programa: Partial<ProgramaFidelidade>): Promise<ProgramaFidelidade> {
        const { data, error } = await supabase
            .from('programas_fidelidade')
            .upsert(programa)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // === PONTOS DOS CLIENTES ===
    async listarPontosClientes(empresaId: string): Promise<PontosCliente[]> {
        const { data, error } = await supabase
            .from('pontos_cliente')
            .select('*, cliente:clientes(nome)')
            .eq('empresa_id', empresaId)
            .order('pontos_atuais', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async creditarPontos(transacao: Partial<TransacaoPontos>): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        // 1. Criar a transação
        const { error: txError } = await supabase
            .from('transacoes_pontos')
            .insert({ ...transacao, criado_por: user.id });

        if (txError) throw txError;

        // 2. Atualizar o saldo (Upsert em pontos_cliente)
        // Nota: Em um ambiente de produção real, isso deveria ser uma Function SQL/RPC 
        // para garantir atomicidade, mas seguindo o padrão simples do projeto:

        const { data: saldoAtual } = await supabase
            .from('pontos_cliente')
            .select('*')
            .eq('cliente_id', transacao.cliente_id)
            .eq('empresa_id', transacao.empresa_id)
            .maybeSingle();

        if (saldoAtual) {
            const novosPontos = (saldoAtual.pontos_atuais || 0) + (transacao.pontos || 0);
            const novosTotais = (saldoAtual.pontos_totais_acumulados || 0) + (transacao.pontos! > 0 ? transacao.pontos! : 0);

            await supabase
                .from('pontos_cliente')
                .update({
                    pontos_atuais: novosPontos,
                    pontos_totais_acumulados: novosTotais
                })
                .eq('id', saldoAtual.id);
        } else {
            await supabase
                .from('pontos_cliente')
                .insert({
                    empresa_id: transacao.empresa_id,
                    cliente_id: transacao.cliente_id,
                    pontos_atuais: transacao.pontos,
                    pontos_totais_acumulados: transacao.pontos! > 0 ? transacao.pontos : 0
                });
        }
    },

    // === INDICAÇÕES ===
    async listarIndicacoes(empresaId: string): Promise<Indicacao[]> {
        const { data, error } = await supabase
            .from('indicacoes')
            .select('*, indicador:clientes(nome)')
            .eq('empresa_id', empresaId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async criarIndicacao(indicacao: Partial<Indicacao>): Promise<Indicacao> {
        const { data, error } = await supabase
            .from('indicacoes')
            .insert(indicacao)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async atualizarStatusIndicacao(id: string, status: string): Promise<void> {
        const { error } = await supabase
            .from('indicacoes')
            .update({ status })
            .eq('id', id);

        if (error) throw error;
    },

    // === DESCONTOS PREVENTIVA ===
    async listarDescontos(empresaId: string): Promise<DescontoPreventiva[]> {
        const { data, error } = await supabase
            .from('descontos_preventiva')
            .select('*')
            .eq('empresa_id', empresaId)
            .order('min_manutencoes', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    async salvarDesconto(desconto: Partial<DescontoPreventiva>): Promise<DescontoPreventiva> {
        const { data, error } = await supabase
            .from('descontos_preventiva')
            .upsert(desconto)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async excluirDesconto(id: string): Promise<void> {
        const { error } = await supabase
            .from('descontos_preventiva')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // === RESGATES ===
    async listarResgates(empresaId: string): Promise<Resgate[]> {
        const { data, error } = await supabase
            .from('resgates')
            .select('*, cliente:clientes(nome)')
            .eq('empresa_id', empresaId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async criarResgate(resgate: Partial<Resgate>): Promise<Resgate> {
        const { data, error } = await supabase
            .from('resgates')
            .insert(resgate)
            .select()
            .single();

        if (error) throw error;

        // Descontar os pontos do saldo do cliente
        await this.creditarPontos({
            empresa_id: resgate.empresa_id,
            cliente_id: resgate.cliente_id,
            pontos: -(resgate.pontos_utilizados || 0),
            tipo: 'resgate',
            referencia_id: data.id,
            descricao: `Resgate de ${resgate.tipo_resgate}`
        });

        return data;
    }
};

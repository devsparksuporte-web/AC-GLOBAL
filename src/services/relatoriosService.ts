import { supabase } from '../lib/supabase';
import type { TipoOrdem } from '../types';

export interface RelatorioFaturamento {
    mes: string;
    valor: number;
}

export interface RelatorioServicos {
    tipo: TipoOrdem;
    quantidade: number;
    valor: number;
}

export interface RelatorioCliente {
    nome: string;
    total_ordens: number;
    valor_total: number;
}

export const relatoriosService = {
    // Faturamento dos últimos 6 meses
    async faturamentoSemestral(): Promise<RelatorioFaturamento[]> {
        const hoje = new Date();
        const seisMesesAtras = new Date(hoje.getFullYear(), hoje.getMonth() - 5, 1);

        const { data, error } = await supabase
            .from('ordens_servico')
            .select('valor, data_conclusao')
            .eq('status', 'concluida')
            .gte('data_conclusao', seisMesesAtras.toISOString());

        if (error) throw error;

        // Agrupar por mês
        const faturamento: Record<string, number> = {};
        const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

        // Inicializar últimos 6 meses com 0
        for (let i = 0; i < 6; i++) {
            const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
            const key = `${meses[d.getMonth()]}/${d.getFullYear().toString().substr(2)}`;
            faturamento[key] = 0;
        }

        data?.forEach(ordem => {
            if (!ordem.data_conclusao || !ordem.valor) return;
            const d = new Date(ordem.data_conclusao);
            const key = `${meses[d.getMonth()]}/${d.getFullYear().toString().substr(2)}`;
            if (faturamento[key] !== undefined) {
                faturamento[key] += ordem.valor;
            }
        });

        return Object.entries(faturamento)
            .map(([mes, valor]) => ({ mes, valor }))
            .reverse();
    },

    // Serviços por tipo
    async servicosPorTipo(): Promise<RelatorioServicos[]> {
        const { data, error } = await supabase
            .from('ordens_servico')
            .select('tipo, valor')
            .eq('status', 'concluida');

        if (error) throw error;

        const agrupado: Record<string, { quantidade: number; valor: number }> = {};

        data?.forEach(ordem => {
            const tipo = ordem.tipo as TipoOrdem;
            if (!agrupado[tipo]) {
                agrupado[tipo] = { quantidade: 0, valor: 0 };
            }
            agrupado[tipo].quantidade++;
            agrupado[tipo].valor += ordem.valor || 0;
        });

        return Object.entries(agrupado).map(([tipo, dados]) => ({
            tipo: tipo as TipoOrdem,
            quantidade: dados.quantidade,
            valor: dados.valor
        })).sort((a, b) => b.valor - a.valor);
    },

    // Top 5 Clientes
    async topClientes(): Promise<RelatorioCliente[]> {
        const { data, error } = await supabase
            .from('ordens_servico')
            .select(`
                valor,
                cliente:clientes(nome)
            `)
            .eq('status', 'concluida');

        if (error) throw error;

        const clientes: Record<string, { nome: string; total_ordens: number; valor_total: number }> = {};

        data?.forEach(ordem => {
            // @ts-ignore - Supabase join type
            const nome = ordem.cliente?.nome || 'Cliente Desconhecido';
            const valor = ordem.valor || 0;

            if (!clientes[nome]) {
                clientes[nome] = { nome, total_ordens: 0, valor_total: 0 };
            }
            clientes[nome].total_ordens++;
            clientes[nome].valor_total += valor;
        });

        return Object.values(clientes)
            .sort((a, b) => b.valor_total - a.valor_total)
            .slice(0, 5);
    },

    // Resumo Geral
    async resumoGeral(): Promise<{ faturamentoTotal: number; ordensConcluidas: number; ticketMedio: number }> {
        const { data, error } = await supabase
            .from('ordens_servico')
            .select('valor')
            .eq('status', 'concluida');

        if (error) throw error;

        const ordensConcluidas = data?.length || 0;
        const faturamentoTotal = data?.reduce((acc, curr) => acc + (curr.valor || 0), 0) || 0;
        const ticketMedio = ordensConcluidas > 0 ? faturamentoTotal / ordensConcluidas : 0;

        return { faturamentoTotal, ordensConcluidas, ticketMedio };
    }
};

import { supabase } from '../lib/supabase';

export interface PrevisaoDemanda {
    mes: string;
    historico: number;
    previsto: number;
}

export interface InsightTime {
    tecnicosAtuais: number;
    capacidadeMensal: number;
    demandaProjetada: number;
    recomendacao: 'manter' | 'contratar_leve' | 'contratar_urgente';
    mensagem: string;
}

export interface PrevisaoEstoque {
    item_id: string;
    nome: string;
    quantidade_atual: number;
    consumo_diario: number;
    dias_restantes: number;
    nivel_critico: boolean;
}

export const performanceService = {
    // 1. Previsão de Demanda (Histórico + Próximos 3 meses)
    async getDemandForecast(): Promise<PrevisaoDemanda[]> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Não autenticado');

        const { data: perfil } = await supabase
            .from('perfis')
            .select('empresa_id')
            .eq('id', user.id)
            .single();

        const hoje = new Date();
        const dozeMesesAtras = new Date(hoje.getFullYear() - 1, hoje.getMonth(), 1);

        const { data, error } = await supabase
            .from('ordens_servico')
            .select('created_at')
            .eq('empresa_id', perfil?.empresa_id)
            .gte('created_at', dozeMesesAtras.toISOString());

        if (error) throw error;

        const mesesLabels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const series: Record<string, { historico: number; previsto: number }> = {};

        // Inicializar histórico
        for (let i = 0; i < 12; i++) {
            const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
            const key = `${mesesLabels[d.getMonth()]}/${d.getFullYear().toString().substr(2)}`;
            series[key] = { historico: 0, previsto: 0 };
        }

        data?.forEach(os => {
            const d = new Date(os.created_at);
            const key = `${mesesLabels[d.getMonth()]}/${d.getFullYear().toString().substr(2)}`;
            if (series[key]) series[key].historico++;
        });

        const result = Object.entries(series)
            .map(([mes, valores]) => ({ mes, ...valores }))
            .reverse();

        // Cálculo de Previsão Simples (Média Móvel de 3 meses + Sazonalidade)
        const ultimos3Media = (result[9].historico + result[10].historico + result[11].historico) / 3;

        // Sazonalidade (HVAC: Verão brasileiro Nov-Mar)
        const getSazonalidade = (mesIndex: number) => {
            const mesesQuentes = [10, 11, 0, 1, 2]; // Nov, Dez, Jan, Fev, Mar
            return mesesQuentes.includes(mesIndex) ? 1.4 : 0.9;
        };

        const previsoes: PrevisaoDemanda[] = [];
        for (let i = 1; i <= 3; i++) {
            const d = new Date(hoje.getFullYear(), hoje.getMonth() + i, 1);
            const key = `${mesesLabels[d.getMonth()]}/${d.getFullYear().toString().substr(2)}`;
            const fator = getSazonalidade(d.getMonth());

            previsoes.push({
                mes: key,
                historico: 0,
                previsto: Math.round(ultimos3Media * fator)
            });
        }

        return [...result, ...previsoes];
    },

    // 2. Otimização de Equipe
    async getTeamOptimization(): Promise<InsightTime> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Não autenticado');

        const { data: perfil } = await supabase
            .from('perfis')
            .select('empresa_id')
            .eq('id', user.id)
            .single();

        // Contar técnicos
        const { count: tecnicosCount } = await supabase
            .from('perfis')
            .select('*', { count: 'exact', head: true })
            .eq('empresa_id', perfil?.empresa_id)
            .eq('role', 'tecnico');

        // Calcular capacidade (Baseado em 22 dias úteis * 3 OS/dia p/ técnico)
        const capPorTecnico = 66;
        const capacidadeTotal = (tecnicosCount || 1) * capPorTecnico;

        // Pegar demanda média recente (últimos 2 meses)
        const doisMesesAtras = new Date();
        doisMesesAtras.setMonth(doisMesesAtras.getMonth() - 2);

        const { count: ordensRecentes } = await supabase
            .from('ordens_servico')
            .select('*', { count: 'exact', head: true })
            .eq('empresa_id', perfil?.empresa_id)
            .gte('created_at', doisMesesAtras.toISOString());

        const demandaMensal = (ordensRecentes || 1) / 2;
        const ocupacao = demandaMensal / capacidadeTotal;

        let recomendacao: InsightTime['recomendacao'] = 'manter';
        let mensagem = 'Equipe dimensionada corretamente para a demanda atual.';

        if (ocupacao > 0.95) {
            recomendacao = 'contratar_urgente';
            mensagem = 'Sua equipe está operando no limite (95%+). Risco de atrasos e perda de qualidade.';
        } else if (ocupacao > 0.8) {
            recomendacao = 'contratar_leve';
            mensagem = 'Demanda em crescimento. Considere contratar 1 novo técnico nos próximos 30 dias.';
        }

        return {
            tecnicosAtuais: tecnicosCount || 0,
            capacidadeMensal: capacidadeTotal,
            demandaProjetada: Math.round(demandaMensal * 1.1), // Projeção com margem
            recomendacao,
            mensagem
        };
    },

    // 3. Previsão de Falta de Estoque
    async getStockPrediction(): Promise<PrevisaoEstoque[]> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Não autenticado');

        const { data: perfil } = await supabase
            .from('perfis')
            .select('empresa_id')
            .eq('id', user.id)
            .single();

        // Buscar itens do estoque
        const { data: estoque } = await supabase
            .from('estoque')
            .select('*')
            .eq('empresa_id', perfil?.empresa_id);

        if (!estoque) return [];

        // Buscar movimentações de saída dos últimos 60 dias
        const sessentaDiasAtras = new Date();
        sessentaDiasAtras.setDate(sessentaDiasAtras.getDate() - 60);

        const { data: movs } = await supabase
            .from('movimentacao_estoque')
            .select('*')
            .eq('empresa_id', perfil?.empresa_id)
            .eq('tipo', 'saida')
            .gte('created_at', sessentaDiasAtras.toISOString());

        return estoque.map(item => {
            const consumoTotal = movs?.filter(m => m.item_id === item.id)
                .reduce((acc, m) => acc + m.quantidade, 0) || 0;

            const consumoDiario = consumoTotal / 60;
            const diasRestantes = consumoDiario > 0 ? Math.floor(item.quantidade / consumoDiario) : 999;

            return {
                item_id: item.id,
                nome: item.nome,
                quantidade_atual: item.quantidade,
                consumo_diario: parseFloat(consumoDiario.toFixed(2)),
                dias_restantes: diasRestantes,
                nivel_critico: diasRestantes < 15
            };
        }).filter(i => i.consumo_diario > 0 || i.quantidade_atual < 5)
            .sort((a, b) => a.dias_restantes - b.dias_restantes);
    }
};

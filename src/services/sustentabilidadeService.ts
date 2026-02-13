import { supabase } from '../lib/supabase';
import type { GasRefrigerante, CilindroGas, RegistroGas } from '../types';

export const sustentabilidadeService = {
    // GASES E CILINDROS
    async listarGases(empresaId: string): Promise<GasRefrigerante[]> {
        const { data, error } = await supabase
            .from('sus_gases')
            .select('*')
            .eq('empresa_id', empresaId)
            .eq('ativo', true);
        if (error) throw error;
        return data;
    },

    async listarCilindros(empresaId: string, perfilId?: string): Promise<CilindroGas[]> {
        let query = supabase
            .from('sus_cilindros')
            .select('*, gas:sus_gases(*), perfil:perfis(*)')
            .eq('empresa_id', empresaId);

        if (perfilId) query = query.eq('perfil_id', perfilId);

        const { data, error } = await query;
        if (error) throw error;
        return data;
    },

    async adicionarCilindro(cilindro: Partial<CilindroGas>): Promise<CilindroGas> {
        const { data, error } = await supabase
            .from('sus_cilindros')
            .insert(cilindro)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    // REGISTROS DE MANUSEIO
    async registrarUsoGas(registro: Partial<RegistroGas>): Promise<void> {
        // 1. Obter GWP do gás para calcular impacto
        const { data: cilindro } = await supabase
            .from('sus_cilindros')
            .select('*, gas:sus_gases(gwp)')
            .eq('id', registro.cilindro_id)
            .single();

        if (!cilindro) throw new Error('Cilindro não encontrado');

        const gwp = (cilindro.gas as any).gwp || 0;
        const co2Evitado = registro.tipo_operacao === 'recuperacao' ? (registro.quantidade! * gwp) : 0;

        const novoRegistro = {
            ...registro,
            co2_equivalente: registro.quantidade! * gwp
        };

        const { error: rError } = await supabase.from('sus_registros_gas').insert(novoRegistro);
        if (rError) throw rError;

        // 2. Atualizar peso do cilindro
        const novoPeso = registro.tipo_operacao === 'carga'
            ? cilindro.peso_atual - registro.quantidade!
            : cilindro.peso_atual + registro.quantidade!;

        await supabase.from('sus_cilindros').update({ peso_atual: novoPeso }).eq('id', cilindro.id);

        // 3. Atribuir pontos verdes se for recuperação
        if (registro.tipo_operacao === 'recuperacao') {
            await this.adicionarPontosVerdes(registro.perfil_id!, registro.empresa_id!, co2Evitado, registro.quantidade!);
        }
    },

    async adicionarPontosVerdes(perfilId: string, empresaId: string, co2: number, kg: number): Promise<void> {
        const { data: stats, error } = await supabase
            .from('sus_tecnico_pontos_verde')
            .select('*')
            .eq('perfil_id', perfilId)
            .single();

        const pontosNovos = Math.floor(co2 / 10); // 1 ponto por cada 10kg de CO2 evitado

        if (error && error.code === 'PGRST116') {
            await supabase.from('sus_tecnico_pontos_verde').insert({
                perfil_id: perfilId,
                empresa_id: empresaId,
                pontos_acumulados: pontosNovos,
                kg_recuperados: kg,
                co2_evitado: co2
            });
        } else {
            await supabase.from('sus_tecnico_pontos_verde').update({
                pontos_acumulados: stats.pontos_acumulados + pontosNovos,
                kg_recuperados: stats.kg_recuperados + kg,
                co2_evitado: stats.co2_evitado + co2
            }).eq('perfil_id', perfilId);
        }
    },

    // IMPACTO E RELATÓRIOS
    async obterImpactoEmpresa(empresaId: string): Promise<{ totalCO2: number, totalKg: number }> {
        const { data, error } = await supabase
            .from('sus_registros_gas')
            .select('co2_equivalente, quantidade')
            .eq('empresa_id', empresaId)
            .eq('tipo_operacao', 'recuperacao');

        if (error) throw error;

        return data.reduce((acc, curr) => ({
            totalCO2: acc.totalCO2 + (curr.co2_equivalente || 0),
            totalKg: acc.totalKg + (curr.quantidade || 0)
        }), { totalCO2: 0, totalKg: 0 });
    }
};

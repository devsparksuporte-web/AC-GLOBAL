import { supabase } from '../lib/supabase';
import type { PlanoManutencao } from '../types';

export const preventivaService = {
    async listarPlanos(empresaId: string): Promise<PlanoManutencao[]> {
        const { data, error } = await supabase
            .from('planos_manutencao')
            .select('*, cliente:clientes(nome)')
            .eq('empresa_id', empresaId)
            .order('titulo');

        if (error) throw error;
        return data || [];
    },

    async criarPlano(plano: Omit<PlanoManutencao, 'id' | 'created_at' | 'updated_at' | 'cliente' | 'ativo'>): Promise<PlanoManutencao> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        const { data, error } = await supabase
            .from('planos_manutencao')
            .insert({
                ...plano,
                ativo: true,
                criado_por: user.id
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async atualizarPlano(id: string, plano: Partial<PlanoManutencao>): Promise<PlanoManutencao> {
        const { data, error } = await supabase
            .from('planos_manutencao')
            .update(plano)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async excluirPlano(id: string): Promise<void> {
        const { error } = await supabase
            .from('planos_manutencao')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};

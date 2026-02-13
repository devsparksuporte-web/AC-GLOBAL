import { supabase } from '../lib/supabase';
import type { ArtigoConhecimento, SolucaoConhecimento, PontuacaoTecnico } from '../types';

export const conhecimentoService = {
    // === ARTIGOS ===
    async listarArtigos(): Promise<ArtigoConhecimento[]> {
        const { data, error } = await supabase
            .from('artigos_conhecimento')
            .select('*, autor:perfis!autor_id(nome)')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async buscarArtigos(query: string): Promise<ArtigoConhecimento[]> {
        const { data, error } = await supabase
            .from('artigos_conhecimento')
            .select('*, autor:perfis!autor_id(nome)')
            .or(`titulo.ilike.%${query}%,descricao.ilike.%${query}%`)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async criarArtigo(artigo: Partial<ArtigoConhecimento>): Promise<ArtigoConhecimento> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        // Buscar empresa_id do perfil
        const { data: perfil } = await supabase
            .from('perfis')
            .select('empresa_id')
            .eq('id', user.id)
            .single();

        const { data, error } = await supabase
            .from('artigos_conhecimento')
            .insert({
                ...artigo,
                autor_id: user.id,
                empresa_id: perfil?.empresa_id
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // === SOLUÇÕES ===
    async listarSolucoes(artigoId: string): Promise<SolucaoConhecimento[]> {
        const { data: { user } } = await supabase.auth.getUser();

        const { data, error } = await supabase
            .from('solucoes_conhecimento')
            .select('*, autor:perfis!autor_id(nome)')
            .eq('artigo_id', artigoId)
            .order('utilidade_score', { ascending: false });

        if (error) throw error;

        // Se logado, buscar votos do usuário para marcar o que ele já votou
        if (user && data) {
            const { data: votos } = await supabase
                .from('votos_solucoes')
                .select('solucao_id, valor')
                .eq('usuario_id', user.id)
                .in('solucao_id', data.map(s => s.id));

            if (votos) {
                return data.map(s => ({
                    ...s,
                    voto_usuario: votos.find(v => v.solucao_id === s.id)?.valor
                }));
            }
        }

        return data || [];
    },

    async criarSolucao(solucao: Partial<SolucaoConhecimento>): Promise<SolucaoConhecimento> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        const { data, error } = await supabase
            .from('solucoes_conhecimento')
            .insert({
                ...solucao,
                autor_id: user.id
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // === VOTAÇÃO ===
    async votar(solucaoId: string, valor: 1 | -1): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        // Upsert no voto (reativa o trigger tr_update_score)
        const { error } = await supabase
            .from('votos_solucoes')
            .upsert({
                solucao_id: solucaoId,
                usuario_id: user.id,
                valor: valor
            });

        if (error) throw error;
    },

    // === RANKING / PONTUAÇÃO ===
    async listarRanking(): Promise<PontuacaoTecnico[]> {
        const { data, error } = await supabase
            .from('pontuacao_tecnicos')
            .select('*, usuario:perfis!usuario_id(nome)')
            .order('pontos_totais', { ascending: false })
            .limit(10);

        if (error) throw error;
        return data || [];
    },

    async buscarMinhaPontuacao(): Promise<PontuacaoTecnico | null> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data, error } = await supabase
            .from('pontuacao_tecnicos')
            .select('*')
            .eq('usuario_id', user.id)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data;
    }
};

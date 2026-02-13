import { supabase } from '../lib/supabase';
import type { Curso, Aula, ProgressoTecnico, TecnicoStats, ConquistaTecnico } from '../types';

export const educacaoService = {
    // CURSOS
    async listarCursos(empresaId: string): Promise<Curso[]> {
        const { data, error } = await supabase
            .from('ec_cursos')
            .select('*')
            .eq('empresa_id', empresaId)
            .eq('ativo', true)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    async obterCurso(id: string): Promise<Curso & { aulas: Aula[] }> {
        const { data: curso, error: cError } = await supabase
            .from('ec_cursos')
            .select('*')
            .eq('id', id)
            .single();

        if (cError) throw cError;

        const { data: aulas, error: aError } = await supabase
            .from('ec_aulas')
            .select('*')
            .eq('curso_id', id)
            .order('ordem', { ascending: true });

        if (aError) throw aError;

        return { ...curso, aulas };
    },

    // PROGRESSO
    async registrarProgresso(perfilId: string, aulaId: string): Promise<void> {
        const { error } = await supabase
            .from('ec_progresso_tecnico')
            .upsert({
                perfil_id: perfilId,
                aula_id: aulaId,
                concluido: true,
                data_conclusao: new Date().toISOString()
            }, { onConflict: 'perfil_id,aula_id' });

        if (error) throw error;

        // Verificar se curso foi concluído para dar XP
        await this.atualizarStatsAposAula(perfilId, aulaId);
    },

    async obterProgressoUsuario(perfilId: string): Promise<ProgressoTecnico[]> {
        const { data, error } = await supabase
            .from('ec_progresso_tecnico')
            .select('*')
            .eq('perfil_id', perfilId);

        if (error) throw error;
        return data;
    },

    // GAMIFICAÇÃO / STATS
    async obterStatsTecnico(perfilId: string, empresaId: string): Promise<TecnicoStats> {
        const { data, error } = await supabase
            .from('ec_tecnico_stats')
            .select('*')
            .eq('perfil_id', perfilId)
            .single();

        if (error && error.code === 'PGRST116') {
            // Criar stats se não existir
            const novoStats = {
                perfil_id: perfilId,
                empresa_id: empresaId,
                xp_total: 0,
                nivel: 1,
                moedas_aprendizado: 0,
                cursos_concluidos: 0
            };
            const { data: d, error: e } = await supabase.from('ec_tecnico_stats').insert(novoStats).select().single();
            if (e) throw e;
            return d;
        }

        if (error) throw error;
        return data;
    },

    async atualizarStatsAposAula(perfilId: string, aulaId: string): Promise<void> {
        // Obter XP da aula/curso
        const { data: aula } = await supabase.from('ec_aulas').select('curso_id').eq('id', aulaId).single();
        if (!aula) return;

        const { data: curso } = await supabase.from('ec_cursos').select('xp_recompensa, id').eq('id', aula.curso_id).single();
        if (!curso) return;

        // Verificar total de aulas concluídas do curso
        const { data: todasAulas } = await supabase.from('ec_aulas').select('id').eq('curso_id', curso.id);
        const { count: concluidas } = await supabase
            .from('ec_progresso_tecnico')
            .select('*', { count: 'exact', head: true })
            .eq('perfil_id', perfilId)
            .in('aula_id', todasAulas?.map(a => a.id) || []);

        if (concluidas === todasAulas?.length) {
            // Curso concluído! Dar XP
            const stats = await this.obterStatsTecnico(perfilId, ''); // empresaId ignorado no fetch
            const novoXP = stats.xp_total + curso.xp_recompensa;
            const novoNivel = Math.floor(novoXP / 1000) + 1; // 1000 XP por nível

            await supabase
                .from('ec_tecnico_stats')
                .update({
                    xp_total: novoXP,
                    nivel: novoNivel,
                    cursos_concluidos: stats.cursos_concluidos + 1,
                    moedas_aprendizado: stats.moedas_aprendizado + (curso.xp_recompensa / 2)
                })
                .eq('perfil_id', perfilId);

            // Verificar Badges (ex: Mestre de um curso)
            await this.checarEAtribuirBadges(perfilId, stats.empresa_id);
        }
    },

    async checarEAtribuirBadges(perfilId: string, empresaId: string): Promise<void> {
        // Exemplo simples: Badge por terminar primeiro curso
        const stats = await this.obterStatsTecnico(perfilId, empresaId);
        if (stats.cursos_concluidos >= 1) {
            const { data: badge } = await supabase
                .from('ec_badges')
                .select('id')
                .eq('empresa_id', empresaId)
                .eq('tipo', 'primeiro_curso')
                .single();

            if (badge) {
                await supabase.from('ec_conquistas').upsert({ perfil_id: perfilId, badge_id: badge.id }, { onConflict: 'perfil_id,badge_id' });
            }
        }
    },

    async listarConquistas(perfilId: string): Promise<ConquistaTecnico[]> {
        const { data, error } = await supabase
            .from('ec_conquistas')
            .select('*, badge:ec_badges(*)')
            .eq('perfil_id', perfilId);

        if (error) throw error;
        return data;
    },

    // ADMIN: MÉTODOS PARA CRIAR CONTEÚDO
    async salvarCurso(curso: Partial<Curso>): Promise<Curso> {
        const { data, error } = await supabase
            .from('ec_cursos')
            .upsert(curso)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async salvarAula(aula: Partial<Aula>): Promise<Aula> {
        const { data, error } = await supabase
            .from('ec_aulas')
            .upsert(aula)
            .select()
            .single();
        if (error) throw error;
        return data;
    }
};

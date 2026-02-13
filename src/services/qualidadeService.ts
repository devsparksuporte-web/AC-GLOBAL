import { supabase } from '../lib/supabase';
import type { ChecklistQualidade, ItemChecklist, RespostaChecklist, Auditoria, IndicadorQualidade } from '../types';

export const qualidadeService = {
    // === CHECKLISTS ===
    async listarChecklists(empresaId: string): Promise<ChecklistQualidade[]> {
        const { data, error } = await supabase
            .from('checklists_qualidade')
            .select('*, itens:itens_checklist(*, order:ordem)')
            .eq('empresa_id', empresaId)
            .eq('ativo', true)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async criarChecklist(checklist: Partial<ChecklistQualidade>, itens: Partial<ItemChecklist>[]): Promise<ChecklistQualidade> {
        // 1. Criar o checklist
        const { data, error } = await supabase
            .from('checklists_qualidade')
            .insert({
                empresa_id: checklist.empresa_id,
                titulo: checklist.titulo,
                descricao: checklist.descricao
            })
            .select()
            .single();

        if (error) throw error;

        // 2. Criar os itens
        if (itens.length > 0) {
            const itensComId = itens.map((item, idx) => ({
                checklist_id: data.id,
                pergunta: item.pergunta,
                tipo: item.tipo || 'sim_nao',
                ordem: idx,
                obrigatorio: item.obrigatorio !== false
            }));

            const { error: itensError } = await supabase
                .from('itens_checklist')
                .insert(itensComId);

            if (itensError) throw itensError;
        }

        return data;
    },

    async excluirChecklist(id: string): Promise<void> {
        const { error } = await supabase
            .from('checklists_qualidade')
            .update({ ativo: false })
            .eq('id', id);

        if (error) throw error;
    },

    // === RESPOSTAS ===
    async listarRespostas(empresaId: string): Promise<RespostaChecklist[]> {
        const { data, error } = await supabase
            .from('respostas_checklist')
            .select('*, checklist:checklists_qualidade(titulo), tecnico:perfis!tecnico_id(nome)')
            .eq('empresa_id', empresaId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async enviarRespostas(resposta: Partial<RespostaChecklist>): Promise<RespostaChecklist> {
        const { data, error } = await supabase
            .from('respostas_checklist')
            .insert(resposta)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // === AUDITORIAS ===
    async listarAuditorias(empresaId: string): Promise<Auditoria[]> {
        const { data, error } = await supabase
            .from('auditorias')
            .select('*, auditor:perfis!auditor_id(nome)')
            .eq('empresa_id', empresaId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async criarAuditoria(auditoria: Partial<Auditoria>): Promise<Auditoria> {
        const { data, error } = await supabase
            .from('auditorias')
            .insert(auditoria)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async atualizarAuditoria(id: string, dados: Partial<Auditoria>): Promise<Auditoria> {
        const { data, error } = await supabase
            .from('auditorias')
            .update(dados)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // === INDICADORES ===
    async buscarIndicadores(empresaId: string): Promise<IndicadorQualidade[]> {
        const { data, error } = await supabase
            .from('indicadores_qualidade')
            .select('*')
            .eq('empresa_id', empresaId)
            .order('periodo', { ascending: false })
            .limit(12); // Últimos 12 meses

        if (error) throw error;
        return data || [];
    },

    async calcularIndicadoresAtuais(empresaId: string): Promise<IndicadorQualidade> {
        const periodo = new Date().toISOString().slice(0, 7); // YYYY-MM

        // Buscar dados do período
        const [respostasRes, auditoriasRes] = await Promise.all([
            supabase.from('respostas_checklist').select('nota_geral').eq('empresa_id', empresaId),
            supabase.from('auditorias').select('status').eq('empresa_id', empresaId)
        ]);

        const respostas = respostasRes.data || [];
        const auditorias = auditoriasRes.data || [];

        const totalServicos = respostas.length;
        const mediaSatisfacao = totalServicos > 0
            ? respostas.reduce((sum, r) => sum + (r.nota_geral || 0), 0) / totalServicos
            : 0;
        const totalAuditorias = auditorias.length;
        const aprovacoes = auditorias.filter(a => a.status === 'aprovado').length;
        const taxaAprovacao = totalAuditorias > 0 ? (aprovacoes / totalAuditorias) * 100 : 0;

        const indicador: IndicadorQualidade = {
            id: '',
            empresa_id: empresaId,
            periodo,
            total_servicos: totalServicos,
            total_retrabalho: 0,
            taxa_retrabalho: 0,
            media_satisfacao: Math.round(mediaSatisfacao * 10) / 10,
            tempo_medio_resolucao: 0,
            total_auditorias: totalAuditorias,
            aprovacoes_auditoria: aprovacoes,
            taxa_aprovacao: Math.round(taxaAprovacao * 10) / 10,
            updated_at: new Date().toISOString()
        };

        return indicador;
    }
};

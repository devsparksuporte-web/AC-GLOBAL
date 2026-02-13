import { supabase } from '../lib/supabase';
import type {
    Certificacao,
    TecnicoCertificacao,
    TipoRisco,
    ChecklistSeguranca,
    OSSeguranca
} from '../types';

export const conformidadeService = {
    // === CERTIFICAÇÕES ===
    async listarCertificacoes(empresaId: string): Promise<Certificacao[]> {
        const { data, error } = await supabase
            .from('certificacoes')
            .select('*')
            .eq('empresa_id', empresaId)
            .order('nome');

        if (error) throw error;
        return data || [];
    },

    async salvarCertificacao(certificacao: Partial<Certificacao>): Promise<Certificacao> {
        const { data, error } = await supabase
            .from('certificacoes')
            .upsert(certificacao)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // === CERTIFICAÇÕES DOS TÉCNICOS ===
    async listarCertificacoesTecnico(perfilId: string): Promise<TecnicoCertificacao[]> {
        const { data, error } = await supabase
            .from('tecnico_certificacoes')
            .select('*, certificacao:certificacoes(*)')
            .eq('perfil_id', perfilId);

        if (error) throw error;
        return data || [];
    },

    async salvarCertificacaoTecnico(cert: Partial<TecnicoCertificacao>): Promise<TecnicoCertificacao> {
        const { data, error } = await supabase
            .from('tecnico_certificacoes')
            .upsert(cert)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // === TIPOS DE RISCO ===
    async listarTiposRisco(empresaId: string): Promise<TipoRisco[]> {
        const { data, error } = await supabase
            .from('tipos_risco')
            .select('*')
            .eq('empresa_id', empresaId)
            .order('nome');

        if (error) throw error;
        return data || [];
    },

    async salvarTipoRisco(risco: Partial<TipoRisco>): Promise<TipoRisco> {
        const { data, error } = await supabase
            .from('tipos_risco')
            .upsert(risco)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // === CHECKLISTS DE SEGURANÇA ===
    async listarChecklists(empresaId: string): Promise<ChecklistSeguranca[]> {
        const { data, error } = await supabase
            .from('checklists_seguranca')
            .select('*, tipo_risco:tipos_risco(nome)')
            .eq('empresa_id', empresaId);

        if (error) throw error;
        return data || [];
    },

    async salvarChecklist(checklist: Partial<ChecklistSeguranca>): Promise<ChecklistSeguranca> {
        const { data, error } = await supabase
            .from('checklists_seguranca')
            .upsert(checklist)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // === LÓGICA DE VALIDAÇÃO ===
    async validarTecnicoParaRisco(perfilId: string, tipoRiscoId: string): Promise<{ valido: boolean; pendencias: string[] }> {
        // 1. Obter o risco e suas exigências
        const { data: risco, error: rError } = await supabase
            .from('tipos_risco')
            .select('*')
            .eq('id', tipoRiscoId)
            .single();

        if (rError || !risco) throw new Error('Tipo de risco não encontrado');

        if (!risco.certificacoes_requeridas || risco.certificacoes_requeridas.length === 0) {
            return { valido: true, pendencias: [] };
        }

        // 2. Obter certificações ATIVAS do técnico
        const hoje = new Date().toISOString().split('T')[0];
        const { data: certificacoes, error: cError } = await supabase
            .from('tecnico_certificacoes')
            .select('certificacao_id, data_vencimento')
            .eq('perfil_id', perfilId)
            .eq('status', 'ativo')
            .gte('data_vencimento', hoje);

        if (cError) throw cError;

        const idsCertificacoesTecnico = new Set(certificacoes.map(c => c.certificacao_id));
        const pendencias: string[] = [];

        // 3. Comparar
        // Precisamos dos nomes das certificações para a mensagem de erro
        const { data: nomesCert } = await supabase
            .from('certificacoes')
            .select('id, nome')
            .in('id', risco.certificacoes_requeridas);

        risco.certificacoes_requeridas.forEach((reqId: string) => {
            if (!idsCertificacoesTecnico.has(reqId)) {
                const nome = nomesCert?.find(n => n.id === reqId)?.nome || reqId;
                pendencias.push(nome);
            }
        });

        return {
            valido: pendencias.length === 0,
            pendencias
        };
    },

    // === REGISTROS DE SEGURANÇA NA OS ===
    async registrarSegurancaOS(registro: Partial<OSSeguranca>): Promise<OSSeguranca> {
        const { data, error } = await supabase
            .from('os_seguranca')
            .insert(registro)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async buscarSegurancaOS(osId: string): Promise<OSSeguranca | null> {
        const { data, error } = await supabase
            .from('os_seguranca')
            .select('*')
            .eq('os_id', osId)
            .maybeSingle();

        if (error) throw error;
        return data;
    }
};

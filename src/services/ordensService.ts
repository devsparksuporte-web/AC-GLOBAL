import { supabase } from '../lib/supabase';
import type { OrdemServico, OrdemServicoInput } from '../types';
import { conformidadeService } from './conformidadeService';

export const ordensService = {
    // Listar todas as ordens com dados do cliente
    async listar(): Promise<OrdemServico[]> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Não autenticado');

        const { data: perfil } = await supabase
            .from('perfis')
            .select('empresa_id, role')
            .eq('id', user.id)
            .single();

        let query = supabase
            .from('ordens_servico')
            .select(`
        *,
        cliente:clientes(id, nome, telefone, email)
      `);

        // Se não for super admin, filtra pela empresa
        if (perfil?.role !== 'super_admin') {
            if (!perfil?.empresa_id) return [];
            query = query.eq('empresa_id', perfil.empresa_id);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    // Buscar ordem por ID
    async buscarPorId(id: string): Promise<OrdemServico | null> {
        const { data, error } = await supabase
            .from('ordens_servico')
            .select(`
        *,
        cliente:clientes(*)
      `)
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    // Buscar ordem por Public ID (para rastreio público)
    async buscarPorPublicId(publicId: string): Promise<any | null> {
        const { data, error } = await supabase
            .from('ordens_servico')
            .select(`
                *,
                cliente:clientes(id, nome, endereco, cidade, estado),
                tecnico:perfis!tecnico_id(id, nome)
            `)
            .eq('public_id', publicId)
            .single();

        if (error) {
            console.error('Erro ao buscar ordem pública:', error);
            return null;
        }
        return data;
    },

    // Criar nova ordem
    async criar(ordem: OrdemServicoInput): Promise<OrdemServico> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        const { data: perfil } = await supabase
            .from('perfis')
            .select('empresa_id, role')
            .eq('id', user.id)
            .single();

        if (!perfil?.empresa_id) throw new Error('Empresa não encontrada para o usuário');
        if (perfil.role !== 'admin' && (perfil as any).role !== 'super_admin') {
            throw new Error('Apenas administradores podem criar ordens de serviço');
        }

        const { data, error } = await supabase
            .from('ordens_servico')
            .insert([{
                ...ordem,
                empresa_id: perfil.empresa_id,
                // O tecnico_id agora vem do formulário, se não vier, pode ficar nulo ou conforme regra
                tecnico_id: ordem.tecnico_id || null
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Atualizar ordem
    async atualizar(id: string, ordem: Partial<OrdemServicoInput>): Promise<OrdemServico> {
        // Se estiver atribuindo um técnico, verificar certificações se houver risco
        if (ordem.tecnico_id) {
            const osAtual = await this.buscarPorId(id);
            const riscoId = ordem.tipo_risco_id || osAtual?.tipo_risco_id;

            if (riscoId) {
                const { valido, pendencias } = await conformidadeService.validarTecnicoParaRisco(ordem.tecnico_id, riscoId);
                if (!valido) {
                    throw new Error(`Técnico não possui as certificações necessárias: ${pendencias.join(', ')}`);
                }
            }
        }

        const { data, error } = await supabase
            .from('ordens_servico')
            .update(ordem)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Excluir ordem
    async excluir(id: string): Promise<void> {
        const { error } = await supabase
            .from('ordens_servico')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // Listar por status
    async listarPorStatus(status: string): Promise<OrdemServico[]> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Não autenticado');

        const { data: perfil } = await supabase
            .from('perfis')
            .select('empresa_id, role')
            .eq('id', user.id)
            .single();

        let query = supabase
            .from('ordens_servico')
            .select(`
        *,
        cliente:clientes(id, nome, telefone)
      `)
            .eq('status', status);

        if (perfil?.role !== 'super_admin') {
            if (!perfil?.empresa_id) return [];
            query = query.eq('empresa_id', perfil.empresa_id);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    // Listar recentes
    async listarRecentes(limit: number = 5): Promise<OrdemServico[]> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Não autenticado');

        const { data: perfil } = await supabase
            .from('perfis')
            .select('empresa_id, role')
            .eq('id', user.id)
            .single();

        let query = supabase
            .from('ordens_servico')
            .select(`
                *,
                cliente:clientes(id, nome, endereco, cidade)
            `);

        if (perfil?.role !== 'super_admin') {
            if (!perfil?.empresa_id) return [];
            query = query.eq('empresa_id', perfil.empresa_id);
        }

        const { data, error } = await query
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data || [];
    },

    // Estatísticas para dashboard
    async estatisticas(): Promise<{ abertas: number; emAndamento: number; hoje: number; concluidas: number; canceladas: number }> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Não autenticado');

        const { data: perfil } = await supabase
            .from('perfis')
            .select('empresa_id, role')
            .eq('id', user.id)
            .single();

        const hoje = new Date().toISOString().split('T')[0];

        // Helper para construir queries
        const buildQuery = (status?: string, dateFilter?: boolean) => {
            let q = supabase.from('ordens_servico').select('*', { count: 'exact', head: true });

            if (perfil?.role !== 'super_admin') {
                if (!perfil?.empresa_id) return { count: 0 }; // Short-circuit safe
                q = q.eq('empresa_id', perfil.empresa_id);
            }

            if (status) q = q.eq('status', status);
            if (dateFilter) q = q.gte('data_agendamento', hoje).lt('data_agendamento', hoje + 'T23:59:59');

            return q;
        };

        // Se usuario normal sem empresa, retorna zeros
        if (perfil?.role !== 'super_admin' && !perfil?.empresa_id) {
            return { abertas: 0, emAndamento: 0, hoje: 0, concluidas: 0, canceladas: 0 };
        }

        const [abertas, emAndamento, hoje_count, concluidas, canceladas] = await Promise.all([
            buildQuery('aberta'),
            buildQuery('em_andamento'),
            buildQuery(undefined, true),
            buildQuery('concluida'),
            buildQuery('cancelada'),
        ]);

        return {
            abertas: abertas.count || 0,
            emAndamento: emAndamento.count || 0,
            hoje: hoje_count.count || 0,
            concluidas: concluidas.count || 0,
            canceladas: canceladas.count || 0,
        };
    },

    // Contar total
    async contar(): Promise<number> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Não autenticado');

        const { data: perfil } = await supabase
            .from('perfis')
            .select('empresa_id, role')
            .eq('id', user.id)
            .single();

        let query = supabase.from('ordens_servico').select('*', { count: 'exact', head: true });

        if (perfil?.role !== 'super_admin') {
            if (!perfil?.empresa_id) return 0;
            query = query.eq('empresa_id', perfil.empresa_id);
        }

        const { count, error } = await query;

        if (error) throw error;
        return count || 0;
    },

    async aceitarOrdem(id: string, tipo: 'imediato' | 'agendado' = 'imediato'): Promise<void> {
        const { error } = await supabase
            .from('ordens_servico')
            .update({
                status: 'em_andamento',
                rastreamento_ativo: tipo === 'imediato'
            })
            .eq('id', id);

        if (error) throw error;

        // Simulação de notificação para o cliente
        console.log(`NOTIFICAÇÃO CLIENTE: Técnico aceitou o serviço (${tipo}).`);
    },

    getWhatsAppTechLink(ordem: OrdemServico, telefone: string, companyName: string): string {
        const link = `${window.location.origin}/ordens/${ordem.id}`;
        const texto = `Olá! Você recebeu uma nova Ordem de Serviço da empresa ${companyName}.

📌 Equipamento: ${ordem.equipamento || 'N/A'}
🛠 Serviço: ${ordem.tipo.charAt(0).toUpperCase() + ordem.tipo.slice(1)}
📝 Descrição: ${ordem.descricao || 'N/A'}

🔗 Acesse aqui:
${link}`;
        return `https://wa.me/${telefone.replace(/\D/g, '')}?text=${encodeURIComponent(texto)}`;
    },

    getWhatsAppClientLink(ordem: OrdemServico, telefone: string, tipo: 'caminho' | 'agendado'): string {
        const link = `${window.location.origin}/track/${ordem.public_id}`;
        let texto = '';
        if (tipo === 'caminho') {
            texto = `Olá! Seu técnico aceitou o chamado e já está a caminho. Acompanhe em tempo real: ${link}`;
        } else {
            const dataStr = ordem.data_agendamento ? new Date(ordem.data_agendamento).toLocaleDateString('pt-BR') : 'em breve';
            texto = `Olá! Seu chamado foi agendado para o dia ${dataStr}. Você receberá um link de rastreio quando o técnico iniciar o deslocamento.`;
        }
        return `https://wa.me/${telefone.replace(/\D/g, '')}?text=${encodeURIComponent(texto)}`;
    }
};

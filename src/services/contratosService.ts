import { supabase } from '../lib/supabase';
import type { Contrato } from '../types';

export type ContratoInput = Omit<Contrato, 'id' | 'created_at' | 'updated_at' | 'cliente' | 'empresa_id'>;

export const contratosService = {
    // Listar todos os contratos (RLS filtra por empresa automaticamente)
    async listar(): Promise<Contrato[]> {
        const { data, error } = await supabase
            .from('contratos')
            .select(`
        *,
        cliente:clientes(id, nome)
      `)
            .order('nome');

        if (error) throw error;
        return data || [];
    },

    // Buscar contrato por ID
    async buscarPorId(id: string): Promise<Contrato | null> {
        const { data, error } = await supabase
            .from('contratos')
            .select(`
        *,
        cliente:clientes(id, nome)
      `)
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    // Criar novo contrato
    async criar(contrato: ContratoInput): Promise<Contrato> {
        // Pegar usuário atual para garantir empresa_id (embora RLS possa forçar, é bom mandar ou deixar o default do banco se configurado)
        // No nosso caso, o RLS valida, mas o insert precisa do campo se não tiver default. 
        // Vamos assumir que o backend ou uma trigger preenche, ou pegamos do contexto. 
        // Melhor: O RLS "WITH CHECK" obriga o envio do ID correto ou usa default se tiver função.
        // Como configuramos policies, vamos buscar o user primeiro para injetar empresa_id se necessário, 
        // mas o ideal é que a aplicação passe ou o banco deduza.
        // Pelo script SQL, empresa_id é NOT NULL. Vamos pegar da sessão na página e passar no input, 
        // ou deixar a trigger (que não criamos) resolver.
        // Vamos simplificar: O service recebe os dados. A página vai injetar o empresa_id do contexto Auth.

        // Ajuste: O tipo ContratoInput não tem empresa_id na definição acima (Omit).
        // Vou precisar adicionar empresa_id na chamada do supabase.

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        // Buscar empresa_id do perfil
        const { data: perfil } = await supabase
            .from('perfis')
            .select('empresa_id')
            .eq('id', user.id)
            .single();

        if (!perfil?.empresa_id) throw new Error('Empresa não encontrada');

        const { data, error } = await supabase
            .from('contratos')
            .insert([{ ...contrato, empresa_id: perfil.empresa_id }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Atualizar contrato
    async atualizar(id: string, contrato: Partial<ContratoInput>): Promise<Contrato> {
        const { data, error } = await supabase
            .from('contratos')
            .update(contrato)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Excluir contrato
    async excluir(id: string): Promise<void> {
        const { error } = await supabase
            .from('contratos')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};

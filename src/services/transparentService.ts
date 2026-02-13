import { supabase } from '../lib/supabase';
import type { EventoServico, FotoServico } from '../types';

export const transparentService = {
    // === GEOLOCALIZAÇÃO DO TÉCNICO ===

    async atualizarLocalizacao(latitude: number, longitude: number): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
            .from('perfis')
            .update({
                latitude,
                longitude,
                ultima_localizacao: new Date().toISOString()
            })
            .eq('id', user.id);

        if (error) console.error('Erro ao atualizar localização:', error);
    },

    // === EVENTOS DA TIMELINE ===

    async registrarEvento(evento: Omit<EventoServico, 'id' | 'created_at'>): Promise<EventoServico> {
        const { data, error } = await supabase
            .from('eventos_servico')
            .insert([evento])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async listarEventos(ordemId: string): Promise<EventoServico[]> {
        const { data, error } = await supabase
            .from('eventos_servico')
            .select('*')
            .eq('ordem_id', ordemId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    // === GALERIA DE FOTOS ===

    async uploadFoto(ordemId: string, file: File, tipo: FotoServico['tipo'], legenda?: string): Promise<FotoServico> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Não autenticado');

        // 1. Upload para o Storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${ordemId}/${Math.random()}.${fileExt}`;
        const filePath = `fotos/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('servicos')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        // 2. Obter URL pública
        const { data: { publicUrl } } = supabase.storage
            .from('servicos')
            .getPublicUrl(filePath);

        // 3. Registrar no banco
        const { data: perfil } = await supabase
            .from('perfis')
            .select('empresa_id')
            .eq('id', user.id)
            .single();

        const { data, error } = await supabase
            .from('fotos_servico')
            .insert([{
                ordem_id: ordemId,
                empresa_id: perfil?.empresa_id,
                url: publicUrl,
                tipo,
                legenda
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async listarFotos(ordemId: string): Promise<FotoServico[]> {
        const { data, error } = await supabase
            .from('fotos_servico')
            .select('*')
            .eq('ordem_id', ordemId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    // === ASSINATURA REAL-TIME (Canais) ===

    inscreverRastreamento(tecnicoId: string, callback: (payload: any) => void) {
        return supabase
            .channel(`tracking-${tecnicoId}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'perfis',
                filter: `id=eq.${tecnicoId}`
            }, callback)
            .subscribe();
    },

    async uploadAvatar(file: File): Promise<string> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Não autenticado');

        const fileExt = file.name.split('.').pop();
        const filePath = `${user.id}/${Math.random()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, file, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);

        // Atualizar perfil com a nova URL (opcional se for via auth metadata, mas bom ter no profile)
        await supabase
            .from('perfis')
            .update({ avatar_url: publicUrl })
            .eq('id', user.id);

        await supabase.auth.updateUser({
            data: { avatar_url: publicUrl }
        });

        return publicUrl;
    },

    async uploadAssinatura(ordemId: string, dataUrl: string): Promise<string> {
        // Converter dataUrl para Blob
        const res = await fetch(dataUrl);
        const blob = await res.blob();

        const fileName = `${ordemId}/assinatura_${Date.now()}.png`;
        const filePath = `fotos/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('servicos')
            .upload(filePath, blob, { contentType: 'image/png' });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from('servicos')
            .getPublicUrl(filePath);

        return publicUrl;
    }
};

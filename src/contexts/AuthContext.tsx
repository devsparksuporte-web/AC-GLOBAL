console.log('AuthContext.tsx: Module loading...');
import { createContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';
import type { UserProfile } from '../types';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    userProfile: UserProfile | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
    signOut: () => Promise<void>;
    isSuperAdmin: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    console.log('AuthProvider: Rendering started');
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const isSuperAdmin = userProfile?.role === 'super_admin';

    useEffect(() => {
        console.log('AuthProvider: Initializing...');
        const timeoutId = setTimeout(() => {
            if (loading) {
                console.warn('AuthProvider: Loading timeout reached, forcing state to false.');
                setLoading(false);
            }
        }, 5000);

        // Função para carregar o perfil do usuário
        const loadProfile = async (userId: string) => {
            console.log('AuthProvider: [loadProfile] Starting for userId:', userId);
            try {
                // Timeout de 10 segundos para a query
                const queryPromise = supabase
                    .from('perfis')
                    .select('*, empresa:empresas(*)')
                    .eq('id', userId)
                    .single();

                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Query timeout')), 10000)
                );

                console.log('AuthProvider: [loadProfile] Executing Supabase query...');
                const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;

                if (error) {
                    console.error('AuthProvider: [loadProfile] Query returned error:', error);
                    return null;
                }
                console.log('AuthProvider: [loadProfile] Query successful, profile name:', data?.nome);
                return data as UserProfile;
            } catch (err) {
                console.error('AuthProvider: [loadProfile] Unexpected error or timeout:', err);
                return null;
            }
        };

        // Verificar sessão atual
        console.log('AuthProvider: Checking session...');
        supabase.auth.getSession().then(async ({ data: { session } }) => {
            console.log('AuthProvider: Session response received:', session ? 'User logged in' : 'No session');
            setSession(session);
            setUser(session?.user ?? null);

            if (session?.user) {
                const profile = await loadProfile(session.user.id);

                // Verificação de Bloqueio de Empresa (exceto para super_admin)
                if (profile && profile.empresa && profile.empresa.ativo === false && profile.role !== 'super_admin') {
                    console.error('AuthProvider: Acesso Negado na inicialização - Empresa Bloqueada');
                    alert('Sua empresa está suspensa. Entre em contato com o administrador.');
                    await supabase.auth.signOut();
                    setUserProfile(null);
                    setSession(null);
                    setUser(null);
                } else {
                    setUserProfile(profile);
                }
            }
        }).catch(err => {
            console.error('AuthProvider: Erro fatal ao obter sessão:', err);
        }).finally(() => {
            console.log('AuthProvider: Setting loading to false');
            setLoading(false);
            clearTimeout(timeoutId);
        });

        // Escutar mudanças de autenticação
        console.log('AuthProvider: Setting up onAuthStateChange...');
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log('AuthProvider: Auth state changed:', event, session ? 'User logged in' : 'No session');
                setSession(session);
                setUser(session?.user ?? null);

                if (session?.user) {
                    const profile = await loadProfile(session.user.id);

                    // Verificação de Bloqueio de Empresa
                    if (profile && profile.empresa && profile.empresa.ativo === false && profile.role !== 'super_admin') {
                        console.error('AuthProvider: Acesso Negado - Empresa Bloqueada');
                        alert('Sua empresa está bloqueada no sistema. Entre em contato com o suporte.');
                        await supabase.auth.signOut();
                        setUserProfile(null);
                        setLoading(false);
                        return;
                    }

                    setUserProfile(profile);
                } else {
                    setUserProfile(null);
                }

                console.log('AuthProvider: Setting loading to false (from onAuthStateChange)');
                setLoading(false);
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    const signIn = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        return { error: error as Error | null };
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setUserProfile(null);
    };

    return (
        <AuthContext.Provider value={{ user, session, userProfile, loading, signIn, signOut, isSuperAdmin }}>
            {children}
        </AuthContext.Provider>
    );
}


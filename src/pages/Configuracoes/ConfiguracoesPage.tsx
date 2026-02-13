import { useState, useEffect, useRef, type FormEvent } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { transparentService } from '../../services/transparentService';
import './Configuracoes.css';

// Icons
const UserIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
    </svg>
);

const LockIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>
);

const BellIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
    </svg>
);



export function ConfiguracoesPage() {
    const { user, userProfile } = useAuth();
    const [activeTab, setActiveTab] = useState<'perfil' | 'seguranca' | 'preferencias'>('perfil');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const navRef = useRef<HTMLDivElement>(null);

    // Auto-scroll para a aba ativa no mobile
    useEffect(() => {
        if (navRef.current) {
            const activeTabElement = navRef.current.querySelector('.nav-item.active');
            if (activeTabElement) {
                activeTabElement.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
            }
        }
    }, [activeTab]);

    // Profile State
    const [nome, setNome] = useState(userProfile?.nome || '');
    const [avatarUrl, setAvatarUrl] = useState(user?.user_metadata?.avatar_url || '');
    const [email] = useState(userProfile?.email || '');
    const [lat, setLat] = useState(userProfile?.latitude?.toString() || '');
    const [lon, setLon] = useState(userProfile?.longitude?.toString() || '');

    // Password State
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Preferences State
    const [darkMode, setDarkMode] = useState(false);
    const [emailNotif, setEmailNotif] = useState(true);

    const handleUpdateProfile = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const { error } = await supabase
                .from('perfis')
                .update({
                    nome: nome,
                    latitude: lat ? parseFloat(lat) : null,
                    longitude: lon ? parseFloat(lon) : null
                })
                .eq('id', user?.id);

            if (error) throw error;
            setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
        } catch (error) {
            setMessage({ type: 'error', text: 'Erro ao atualizar perfil.' });
        } finally {
            setLoading(false);
        }
    };

    const handleUploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;

        setLoading(true);
        setMessage(null);
        try {
            const url = await transparentService.uploadAvatar(e.target.files[0]);
            setAvatarUrl(url);
            setMessage({ type: 'success', text: 'Foto de perfil atualizada!' });
        } catch (err) {
            console.error('Erro no upload do avatar:', err);
            setMessage({ type: 'error', text: 'Erro ao fazer upload da foto.' });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePassword = async (e: FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setMessage({ type: 'error', text: 'As senhas não conferem.' });
            return;
        }

        setLoading(true);
        setMessage(null);

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) throw error;
            setMessage({ type: 'success', text: 'Senha alterada com sucesso!' });
            setPassword('');
            setConfirmPassword('');
        } catch (error) {
            setMessage({ type: 'error', text: 'Erro ao alterar senha.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="config-page">
            <div className="config-header">
                <h1 className="config-title">Configurações</h1>
            </div>

            <div className="config-container">
                <aside className="config-sidebar">
                    <nav className="config-nav horizontal-tabs-container hide-scrollbar" ref={navRef}>
                        <button
                            className={`nav-item ${activeTab === 'perfil' ? 'active' : ''}`}
                            onClick={() => setActiveTab('perfil')}
                        >
                            <UserIcon /> Meu Perfil
                        </button>
                        <button
                            className={`nav-item ${activeTab === 'seguranca' ? 'active' : ''}`}
                            onClick={() => setActiveTab('seguranca')}
                        >
                            <LockIcon /> Segurança
                        </button>
                        <button
                            className={`nav-item ${activeTab === 'preferencias' ? 'active' : ''}`}
                            onClick={() => setActiveTab('preferencias')}
                        >
                            <BellIcon /> Preferências
                        </button>
                    </nav>
                </aside>

                <main className="config-content">
                    {message && (
                        <div className={`message-banner ${message.type}`} style={{
                            padding: '1rem',
                            borderRadius: '0.5rem',
                            marginBottom: '1rem',
                            backgroundColor: message.type === 'success' ? '#dcfce7' : '#fee2e2',
                            color: message.type === 'success' ? '#166534' : '#991b1b',
                            border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}`
                        }}>
                            {message.text}
                        </div>
                    )}

                    {activeTab === 'perfil' && (
                        <div className="tab-content">
                            <h2 className="section-title">Meu Perfil</h2>

                            <div className="profile-avatar-section">
                                <div className="avatar-preview">
                                    {avatarUrl ? (
                                        <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                                    ) : (
                                        nome ? nome.charAt(0).toUpperCase() : <UserIcon />
                                    )}
                                </div>
                                <div className="avatar-actions">
                                    <div className="upload-btn-wrapper" style={{ position: 'relative', overflow: 'hidden' }}>
                                        <button className="btn-secondary" disabled={loading}>
                                            {loading ? 'Subindo...' : 'Alterar Foto'}
                                        </button>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            style={{ position: 'absolute', opacity: 0, inset: 0, cursor: 'pointer' }}
                                            onChange={handleUploadAvatar}
                                            disabled={loading}
                                        />
                                    </div>
                                    <span style={{ fontSize: '0.8rem', color: '#666' }}>JPG ou PNG. Max 1MB.</span>
                                </div>
                            </div>

                            <form onSubmit={handleUpdateProfile}>
                                <div className="form-section">
                                    <div className="form-group">
                                        <label className="form-label">Nome Completo</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={nome}
                                            onChange={e => setNome(e.target.value)}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Email</label>
                                        <input
                                            type="email"
                                            className="form-input"
                                            value={email}
                                            disabled
                                            style={{ background: '#f3f4f6', cursor: 'not-allowed' }}
                                        />
                                    </div>
                                </div>

                                <div className="form-section">
                                    <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', marginTop: '1.5rem' }}>Localização</h3>
                                    <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                        <div className="form-group">
                                            <label className="form-label">Latitude</label>
                                            <input
                                                type="number"
                                                step="any"
                                                className="form-input"
                                                value={lat}
                                                onChange={e => setLat(e.target.value)}
                                                placeholder="-23.5505"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Longitude</label>
                                            <input
                                                type="number"
                                                step="any"
                                                className="form-input"
                                                value={lon}
                                                onChange={e => setLon(e.target.value)}
                                                placeholder="-46.6333"
                                            />
                                        </div>
                                    </div>
                                    <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '-0.5rem', marginBottom: '1.5rem' }}>
                                        Coordenadas usadas para as previsões climáticas e alertas de onda de calor.
                                    </p>
                                </div>
                                <button type="submit" className="btn-primary" disabled={loading}>
                                    {loading ? 'Salvando...' : 'Salvar Alterações'}
                                </button>
                            </form>
                        </div>
                    )}

                    {activeTab === 'seguranca' && (
                        <div className="tab-content">
                            <h2 className="section-title">Segurança</h2>

                            <form onSubmit={handleUpdatePassword}>
                                <div className="form-section">
                                    <div className="form-group">
                                        <label className="form-label">Nova Senha</label>
                                        <input
                                            type="password"
                                            className="form-input"
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            placeholder="Mínimo 6 caracteres"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Confirmar Nova Senha</label>
                                        <input
                                            type="password"
                                            className="form-input"
                                            value={confirmPassword}
                                            onChange={e => setConfirmPassword(e.target.value)}
                                            placeholder="Confirme sua nova senha"
                                        />
                                    </div>
                                </div>
                                <button type="submit" className="btn-primary" disabled={loading || !password}>
                                    {loading ? 'Alterando...' : 'Alterar Senha'}
                                </button>
                            </form>
                        </div>
                    )}

                    {activeTab === 'preferencias' && (
                        <div className="tab-content">
                            <h2 className="section-title">Preferências do Sistema</h2>

                            <div className="settings-list">
                                <div className="setting-item">
                                    <div className="setting-info">
                                        <div className="setting-title">Modo Escuro</div>
                                        <div className="setting-description">Alternar entre tema claro e escuro</div>
                                    </div>
                                    <div
                                        className={`toggle-switch ${darkMode ? 'active' : ''}`}
                                        onClick={() => setDarkMode(!darkMode)}
                                    >
                                        <div className="toggle-thumb"></div>
                                    </div>
                                </div>

                                <div className="setting-item">
                                    <div className="setting-info">
                                        <div className="setting-title">Notificações por Email</div>
                                        <div className="setting-description">Receber atualizações sobre ordens de serviço</div>
                                    </div>
                                    <div
                                        className={`toggle-switch ${emailNotif ? 'active' : ''}`}
                                        onClick={() => setEmailNotif(!emailNotif)}
                                    >
                                        <div className="toggle-thumb"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

export default ConfiguracoesPage;

import { useState, useEffect, useRef } from 'react';
import { marketplaceService } from '../../services/marketplaceService';
import { adminService } from '../../services/adminService';
import { useAuth } from '../../hooks/useAuth';
import type { Freelancer, VagaServico, PagamentoFreelancer, UserProfile } from '../../types';
import './Marketplace.css';

export function MarketplacePage() {
    const { userProfile } = useAuth();
    const [freelancers, setFreelancers] = useState<Freelancer[]>([]);
    const [vagas, setVagas] = useState<VagaServico[]>([]);
    const [pagamentos, setPagamentos] = useState<PagamentoFreelancer[]>([]);
    const [usuariosDisponiveis, setUsuariosDisponiveis] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'network' | 'jobs' | 'payments'>('network');
    const [showModalInvite, setShowModalInvite] = useState(false);

    const tabsRef = useRef<HTMLDivElement>(null);

    // Auto-scroll para a aba ativa no mobile
    useEffect(() => {
        if (tabsRef.current) {
            const activeTabElement = tabsRef.current.querySelector('.tab-btn.active');
            if (activeTabElement) {
                activeTabElement.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
            }
        }
    }, [activeTab]);

    const empresaId = userProfile?.empresa_id || '';

    const carregarDados = async () => {
        if (!empresaId) return;
        setLoading(true);
        try {
            const [fList, vList, pList, uList] = await Promise.all([
                marketplaceService.listarFreelancers(empresaId),
                marketplaceService.listarVagas(empresaId),
                marketplaceService.listarPagamentos(empresaId),
                adminService.listarUsuariosPorEmpresa(empresaId)
            ]);
            setFreelancers(fList);
            setVagas(vList);
            setPagamentos(pList);
            // Filtrar usuários que ainda não são freelancers nesta empresa
            const idsFreelancers = fList.map(f => f.perfil_id);
            setUsuariosDisponiveis(uList.filter(u => !idsFreelancers.includes(u.id)));
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    useEffect(() => { carregarDados(); }, [empresaId]);

    if (loading) return <div className="marketplace-page"><div className="loading-spinner">Conectando ao Marketplace...</div></div>;

    return (
        <div className="marketplace-page">
            <header className="page-header">
                <h1 className="page-title">Marketplace de Técnicos</h1>
                <p className="page-subtitle">Gerencie sua rede de técnicos parceiros e freelancers.</p>
            </header>

            <div className="tabs-container horizontal-tabs-container hide-scrollbar" ref={tabsRef}>
                <button
                    onClick={() => setActiveTab('network')}
                    className={`tab-btn ${activeTab === 'network' ? 'active' : ''}`}
                >
                    Rede de Técnicos ({freelancers.length})
                </button>
                <button
                    onClick={() => setActiveTab('jobs')}
                    className={`tab-btn ${activeTab === 'jobs' ? 'active' : ''}`}
                >
                    Vagas em Aberto ({vagas.filter(v => v.status === 'aberta').length})
                </button>
                <button
                    onClick={() => setActiveTab('payments')}
                    className={`tab-btn ${activeTab === 'payments' ? 'active' : ''}`}
                >
                    Pagamentos
                </button>
            </div>

            {activeTab === 'network' && (
                <div className="network-section">
                    <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3>Técnicos Parceiros</h3>
                        <button
                            className="btn-primary"
                            onClick={() => setShowModalInvite(true)}
                        >
                            + Convidar Técnico
                        </button>
                    </div>
                    <div className="freelancer-grid">
                        {freelancers.length === 0 ? (
                            <div className="empty-state">Nenhum técnico autônomo cadastrado.</div>
                        ) : freelancers.map(f => (
                            <div key={f.id} className="freelancer-card">
                                <div className="freelancer-header">
                                    <div className="freelancer-avatar">{f.perfil?.nome?.charAt(0) || 'FT'}</div>
                                    <div className="freelancer-info">
                                        <h4>{f.perfil?.nome || 'Freelancer'}</h4>
                                        <div className="freelancer-rating">
                                            <span>⭐ {f.avaliacao_media.toFixed(1)}</span>
                                            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>({f.total_avaliacoes} avaliações)</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="specialties-tags">
                                    {f.specialties.map(s => <span key={s} className="tag">{s}</span>)}
                                </div>
                                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                    📍 {f.regioes_atendimento.join(', ')}
                                </div>
                                <div className="card-actions" style={{ marginTop: '1rem' }}>
                                    <button className="btn-outline" style={{ width: '100%', fontSize: '0.85rem' }}>Ver Perfil Completo</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'jobs' && (
                <div className="jobs-section">
                    <h3>Oportunidades Publicadas</h3>
                    <div className="jobs-list">
                        {vagas.length === 0 ? (
                            <div className="empty-state">Nenhuma vaga publicada no momento.</div>
                        ) : vagas.map(v => (
                            <div key={v.id} className="job-card">
                                <div className="job-details">
                                    <h5>{v.titulo}</h5>
                                    <div className="job-meta">
                                        <span>📅 {new Date(v.data_prevista).toLocaleDateString()}</span>
                                        <span>🛠️ {v.os?.descricao?.substring(0, 20) || 'Manutenção'}...</span>
                                        <span>📋 OS #{v.os_id.substring(0, 8)}</span>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div className="job-value">R$ {v.valor_proposto.toFixed(2)}</div>
                                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{v.status.toUpperCase()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'payments' && (
                <div className="payments-section">
                    <h3>Controle de Repasses</h3>
                    <div className="leaderboard-table" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1.5rem' }}>
                        <div className="leaderboard-row header" style={{ gridTemplateColumns: '1fr 1fr 120px 150px' }}>
                            <div>Técnico</div>
                            <div>Serviço / OS</div>
                            <div>Valor</div>
                            <div>Status</div>
                        </div>
                        {pagamentos.length === 0 ? (
                            <div className="empty-state">Nenhum pagamento registrado.</div>
                        ) : pagamentos.map(p => (
                            <div key={p.id} className="leaderboard-row" style={{ gridTemplateColumns: '1fr 1fr 120px 150px' }}>
                                <div>{(p as any).freelancer?.perfil?.nome}</div>
                                <div>OS #{p.os_id.substring(0, 8)}</div>
                                <div style={{ fontWeight: 700 }}>R$ {p.valor.toFixed(2)}</div>
                                <div>
                                    <span className={`payment-badge ${p.status}`}>{p.status}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {showModalInvite && (
                <ModalConvidarTecnico
                    usuarios={usuariosDisponiveis}
                    empresaId={empresaId}
                    onClose={() => setShowModalInvite(false)}
                    onSuccess={() => {
                        setShowModalInvite(false);
                        carregarDados();
                    }}
                />
            )}
        </div>
    );
}

function ModalConvidarTecnico({ usuarios, empresaId, onClose, onSuccess }: any) {
    const [formData, setFormData] = useState({
        perfil_id: '',
        specialties: '',
        regioes_atendimento: ''
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await marketplaceService.cadastrarFreelancer({
                perfil_id: formData.perfil_id,
                empresa_id: empresaId,
                specialties: formData.specialties.split(',').map(s => s.trim()),
                regioes_atendimento: formData.regioes_atendimento.split(',').map(r => r.trim()),
                status: 'ativo',
                avaliacao_media: 5.0,
                total_avaliacoes: 0
            });
            onSuccess();
        } catch (err) {
            alert('Erro ao convidar técnico');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div className="modal-content" style={{ background: 'white', padding: '2rem', borderRadius: '24px', width: '100%', maxWidth: '500px' }}>
                <h3>Convidar Técnico para Rede</h3>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                    <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label>Selecionar Usuário da Empresa</label>
                        <select
                            required
                            className="form-control"
                            value={formData.perfil_id}
                            onChange={e => setFormData({ ...formData, perfil_id: e.target.value })}
                        >
                            <option value="">Selecione um usuário</option>
                            {usuarios.map((u: any) => <option key={u.id} value={u.id}>{u.nome} ({u.role})</option>)}
                        </select>
                    </div>
                    <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label>Especialidades (separadas por vírgula)</label>
                        <input
                            required
                            placeholder="Ex: Split, Chiller, VRF"
                            className="form-control"
                            value={formData.specialties}
                            onChange={e => setFormData({ ...formData, specialties: e.target.value })}
                        />
                    </div>
                    <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label>Regiões de Atendimento</label>
                        <input
                            required
                            placeholder="Ex: Centro, Zona Sul, Grande SP"
                            className="form-control"
                            value={formData.regioes_atendimento}
                            onChange={e => setFormData({ ...formData, regioes_atendimento: e.target.value })}
                        />
                    </div>

                    <div className="modal-actions" style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                        <button type="button" className="btn-outline" onClick={onClose} style={{ flex: 1 }}>Cancelar</button>
                        <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 1 }}>
                            {loading ? 'Processando...' : 'Confirmar Convite'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default MarketplacePage;

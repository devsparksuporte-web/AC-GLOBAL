import { useState, useEffect } from 'react';
import { sustentabilidadeService } from '../../services/sustentabilidadeService';
import { adminService } from '../../services/adminService';
import { useAuth } from '../../hooks/useAuth';
import type { CilindroGas, TecnicoPontosVerde, GasRefrigerante, UserProfile } from '../../types';
import './Sustentabilidade.css';

export function SustentabilidadePage() {
    const { userProfile } = useAuth();
    const [impacto, setImpacto] = useState<{ totalCO2: number, totalKg: number }>({ totalCO2: 0, totalKg: 0 });
    const [cilindros, setCilindros] = useState<CilindroGas[]>([]);
    const [gases, setGases] = useState<GasRefrigerante[]>([]);
    const [tecnicos, setTecnicos] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [ranking, _setRanking] = useState<TecnicoPontosVerde[]>([]);
    const [showModalNovo, setShowModalNovo] = useState(false);

    const empresaId = userProfile?.empresa_id || '';

    const carregarDados = async () => {
        if (!empresaId) return;
        setLoading(true);
        try {
            const [imp, cyls, gList, tList] = await Promise.all([
                sustentabilidadeService.obterImpactoEmpresa(empresaId),
                sustentabilidadeService.listarCilindros(empresaId),
                sustentabilidadeService.listarGases(empresaId),
                adminService.listarUsuariosPorEmpresa(empresaId)
            ]);
            setImpacto(imp);
            setCilindros(cyls);
            setGases(gList);
            setTecnicos(tList.filter(u => u.role === 'tecnico' || u.role === 'admin'));

            // Mock ranking for visualization if empty
            if (ranking.length === 0) {
                // _setRanking([...]) - Fetch actual leaderboard in next step
            }
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    useEffect(() => { carregarDados(); }, [empresaId]);

    if (loading) return <div className="sustentabilidade-page"><div className="loading-spinner">Calculando Impacto Ambiental...</div></div>;

    const equivalencias = {
        arvores: Math.floor(impacto.totalCO2 / 20), // 1 árvore neutraliza ~20kg CO2/ano
        carros: (impacto.totalCO2 / 1.5).toFixed(1), // ~150g CO2/km -> ~1.5kg por 10km
    };

    return (
        <div className="sustentabilidade-page">
            <header className="page-header">
                <h1 className="page-title">Impacto Ambiental e Sustentabilidade</h1>
                <p className="page-subtitle">Rastreamento de gases refrigerantes e eficiência energética.</p>
            </header>

            <div className="impact-dashboard">
                <div className="impact-card green-theme">
                    <div className="impact-icon">🌍</div>
                    <div className="impact-label">CO₂ Evitado</div>
                    <div className="impact-value">{impacto.totalCO2.toFixed(1)} <span style={{ fontSize: '1rem' }}>kg</span></div>
                    <div className="impact-desc">Emissões evitadas através da recuperação correta de gases.</div>
                </div>

                <div className="impact-card">
                    <div className="impact-icon">🌳</div>
                    <div className="impact-label">Equivalente a</div>
                    <div className="impact-value">{equivalencias.arvores}</div>
                    <div className="impact-desc">Árvores plantadas para absorver a mesma quantidade de CO₂ em um ano.</div>
                </div>

                <div className="impact-card">
                    <div className="impact-icon">♻️</div>
                    <div className="impact-label">Gás Recuperado</div>
                    <div className="impact-value">{impacto.totalKg.toFixed(2)} <span style={{ fontSize: '1rem' }}>kg</span></div>
                    <div className="impact-desc">Total de fluido refrigerante que não foi para a atmosfera.</div>
                </div>
            </div>

            <section className="inventory-section">
                <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3>Inventário de Gases</h3>
                    <button
                        className="btn-primary"
                        style={{ fontSize: '0.85rem' }}
                        onClick={() => setShowModalNovo(true)}
                    >
                        + Novo Cilindro
                    </button>
                </div>

                <div className="inventory-grid">
                    {cilindros.length === 0 ? (
                        <div className="empty-state">Nenhum cilindro de gás registrado.</div>
                    ) : cilindros.map(c => (
                        <div key={c.id} className="cylinder-card">
                            <div className="cylinder-header">
                                <span className="cylinder-badge">{c.gas?.nome || 'Gás'}</span>
                                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>#{c.num_serie}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                <span>Capacidade: {c.capacidade_total}kg</span>
                                <span style={{ fontWeight: '700' }}>{c.peso_atual}kg</span>
                            </div>
                            <div className="gas-level-container">
                                <div className={`gas-level-fill ${(c.peso_atual / c.capacidade_total) < 0.2 ? 'low' : ''}`}
                                    style={{ width: `${(c.peso_atual / c.capacidade_total) * 100}%` }}></div>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                Responsável: {c.perfil?.nome || 'Não atribuído'}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section className="leaderboard-section">
                <h3>Líderes de Sustentabilidade 🌿</h3>
                <div className="leaderboard-table">
                    <div className="leaderboard-row header">
                        <div>Rank</div>
                        <div>Técnico</div>
                        <div>Gás Recuperado</div>
                        <div>Pontos Verdes</div>
                    </div>
                    {/* Mock data for visualization */}
                    <div className="leaderboard-row">
                        <div className="rank rank-1">#1</div>
                        <div>João Técnico Silva</div>
                        <div>12.4 kg</div>
                        <div style={{ color: '#10b981', fontWeight: 700 }}>245 pts</div>
                    </div>
                    <div className="leaderboard-row">
                        <div className="rank rank-2">#2</div>
                        <div>Maria Fernandes</div>
                        <div>8.1 kg</div>
                        <div style={{ color: '#10b981', fontWeight: 700 }}>160 pts</div>
                    </div>
                </div>
            </section>

            <section className="incentives-section" style={{ marginTop: '4rem' }}>
                <h3>Práticas Sustentáveis e Incentivos</h3>
                <div className="incentives-grid">
                    <div className="incentive-card">
                        <div style={{ fontSize: '2rem' }}>⚡</div>
                        <span className="incentive-val">+50 Pontos</span>
                        <p style={{ fontSize: '0.85rem' }}>Limpeza química que reduz consumo em {'>'}15%.</p>
                    </div>
                    <div className="incentive-card">
                        <div style={{ fontSize: '2rem' }}>📦</div>
                        <span className="incentive-val">+100 Pontos</span>
                        <p style={{ fontSize: '0.85rem' }}>Destinação de 100% dos resíduos para reciclagem.</p>
                    </div>
                </div>
            </section>

            {showModalNovo && (
                <ModalNovoCilindro
                    gases={gases}
                    tecnicos={tecnicos}
                    empresaId={empresaId}
                    onClose={() => setShowModalNovo(false)}
                    onSuccess={() => {
                        setShowModalNovo(false);
                        carregarDados();
                    }}
                />
            )}
        </div>
    );
}

function ModalNovoCilindro({ gases, tecnicos, empresaId, onClose, onSuccess }: any) {
    const [formData, setFormData] = useState({
        num_serie: '',
        gas_id: '',
        perfil_id: '',
        capacidade_total: '',
        peso_atual: ''
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await sustentabilidadeService.adicionarCilindro({
                ...formData,
                empresa_id: empresaId,
                capacidade_total: parseFloat(formData.capacidade_total),
                peso_atual: parseFloat(formData.peso_atual)
            } as any);
            onSuccess();
        } catch (err) {
            alert('Erro ao cadastrar cilindro');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div className="modal-content" style={{ background: 'white', padding: '2rem', borderRadius: '24px', width: '100%', maxWidth: '500px' }}>
                <h3>Cadastrar Novo Cilindro</h3>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                    <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label>Número de Série</label>
                        <input
                            required
                            className="form-control"
                            value={formData.num_serie}
                            onChange={e => setFormData({ ...formData, num_serie: e.target.value })}
                        />
                    </div>
                    <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label>Tipo de Gás</label>
                        <select
                            required
                            className="form-control"
                            value={formData.gas_id}
                            onChange={e => setFormData({ ...formData, gas_id: e.target.value })}
                        >
                            <option value="">Selecione o Gás</option>
                            {gases.map((g: any) => <option key={g.id} value={g.id}>{g.nome} (GWP: {g.gwp})</option>)}
                        </select>
                    </div>
                    <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label>Técnico Responsável</label>
                        <select
                            className="form-control"
                            value={formData.perfil_id}
                            onChange={e => setFormData({ ...formData, perfil_id: e.target.value })}
                        >
                            <option value="">Não atribuído</option>
                            {tecnicos.map((t: any) => <option key={t.id} value={t.id}>{t.nome}</option>)}
                        </select>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <label>Capacidade Total (kg)</label>
                            <input
                                required
                                type="number"
                                step="0.01"
                                className="form-control"
                                value={formData.capacidade_total}
                                onChange={e => setFormData({ ...formData, capacidade_total: e.target.value })}
                            />
                        </div>
                        <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <label>Peso Atual (kg)</label>
                            <input
                                required
                                type="number"
                                step="0.01"
                                className="form-control"
                                value={formData.peso_atual}
                                onChange={e => setFormData({ ...formData, peso_atual: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="modal-actions" style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                        <button type="button" className="btn-outline" onClick={onClose} style={{ flex: 1 }}>Cancelar</button>
                        <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 1 }}>
                            {loading ? 'Salvando...' : 'Cadastrar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default SustentabilidadePage;

import { useState, useEffect, type FormEvent } from 'react';
import { fidelidadeService } from '../../services/fidelidadeService';
import { clientesService } from '../../services/clientesService';
import { useAuth } from '../../hooks/useAuth';
import type {
    Cliente,
    ProgramaFidelidade,
    PontosCliente,
    Indicacao,
    DescontoPreventiva
} from '../../types';
import '../Clientes/Clientes.css';
import './Fidelidade.css';

// Icons
const PlusIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
);
const SettingsIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
    </svg>
);
// ========== PONTOS MODAL ==========
function CreditarPontosModal({ empresaId, onClose, onSave }: { empresaId: string; onClose: () => void; onSave: () => void }) {
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [clienteId, setClienteId] = useState('');
    const [pontos, setPontos] = useState(0);
    const [descricao, setDescricao] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        clientesService.listar().then(setClientes);
    }, []);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!clienteId || pontos <= 0) { setError('Selecione um cliente e informe os pontos.'); return; }
        setLoading(true); setError('');
        try {
            await fidelidadeService.creditarPontos({
                empresa_id: empresaId,
                cliente_id: clienteId,
                pontos,
                tipo: 'bonus',
                descricao
            });
            onSave();
        } catch { setError('Erro ao creditar pontos.'); } finally { setLoading(false); }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header"><h2 className="modal-title">Creditar Pontos Bonus</h2><button className="modal-close" onClick={onClose}>✕</button></div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {error && <div className="error-message">{error}</div>}
                        <div className="form-group">
                            <label className="form-label">Cliente *</label>
                            <select className="form-select" value={clienteId} onChange={e => setClienteId(e.target.value)} required>
                                <option value="">Selecione um cliente</option>
                                {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Quantidade de Pontos *</label>
                            <input className="form-input" type="number" min={1} value={pontos} onChange={e => setPontos(Number(e.target.value))} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Motivo / Descrição</label>
                            <input className="form-input" value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Ex: Bônus de aniversário" />
                        </div>
                    </div>
                    <div className="modal-footer"><button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button><button type="submit" className="btn-primary" disabled={loading}>Creditar</button></div>
                </form>
            </div>
        </div>
    );
}

// ========== CONFIGURAÇÃO MODAL ==========
function ConfigFidelidadeModal({ programa, onSave, onClose }: { programa: ProgramaFidelidade | null, onSave: (p: Partial<ProgramaFidelidade>) => void, onClose: () => void }) {
    const [form, setForm] = useState(programa || { pontos_por_real: 1, valor_ponto_resgate: 0.05, pontos_minimos_resgate: 100, pontos_por_indicacao: 500, ativo: true });

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header"><h2 className="modal-title">Configurar Programa</h2><button className="modal-close" onClick={onClose}>✕</button></div>
                <div className="modal-body">
                    <div className="form-row">
                        <div className="form-group"><label className="form-label">Pontos por R$ 1,00</label><input className="form-input" type="number" step="0.1" value={form.pontos_por_real} onChange={e => setForm({ ...form, pontos_por_real: Number(e.target.value) })} /></div>
                        <div className="form-group"><label className="form-label">Valor do Ponto (R$)</label><input className="form-input" type="number" step="0.001" value={form.valor_ponto_resgate} onChange={e => setForm({ ...form, valor_ponto_resgate: Number(e.target.value) })} /></div>
                    </div>
                    <div className="form-row">
                        <div className="form-group"><label className="form-label">Mínimo p/ Resgate</label><input className="form-input" type="number" value={form.pontos_minimos_resgate} onChange={e => setForm({ ...form, pontos_minimos_resgate: Number(e.target.value) })} /></div>
                        <div className="form-group"><label className="form-label">Pontos por Indicação</label><input className="form-input" type="number" value={form.pontos_por_indicacao} onChange={e => setForm({ ...form, pontos_por_indicacao: Number(e.target.value) })} /></div>
                    </div>
                    <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.75rem' }}>
                        <input type="checkbox" id="ativo" checked={form.ativo} onChange={e => setForm({ ...form, ativo: e.target.checked })} />
                        <label htmlFor="ativo" className="form-label" style={{ marginBottom: 0 }}>Programa Ativo</label>
                    </div>
                </div>
                <div className="modal-footer"><button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button><button type="button" className="btn-primary" onClick={() => onSave(form)}>Salvar Configurações</button></div>
            </div>
        </div>
    );
}

// ========== REGRA DESCONTO MODAL ==========
function RegraDescontoModal({ empresaId, onClose, onSave }: { empresaId: string; onClose: () => void; onSave: () => void }) {
    const [minManutencoes, setMinManutencoes] = useState(5);
    const [percentual, setPercentual] = useState(10);
    const [descricao, setDescricao] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await fidelidadeService.salvarDesconto({
                empresa_id: empresaId,
                min_manutencoes: minManutencoes,
                percentual_desconto: percentual,
                descricao
            });
            onSave();
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header"><h2 className="modal-title">Nova Regra de Desconto</h2><button className="modal-close" onClick={onClose}>✕</button></div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-group">
                            <label className="form-label">Mínimo de Manutenções</label>
                            <input className="form-input" type="number" value={minManutencoes} onChange={e => setMinManutencoes(Number(e.target.value))} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Percentual de Desconto (%)</label>
                            <input className="form-input" type="number" value={percentual} onChange={e => setPercentual(Number(e.target.value))} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Descrição</label>
                            <input className="form-input" value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Ex: Cliente Fiel Silver" />
                        </div>
                    </div>
                    <div className="modal-footer"><button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button><button type="submit" className="btn-primary" disabled={loading}>Salvar Regra</button></div>
                </form>
            </div>
        </div>
    );
}

// ========== MAIN PAGE ==========
export function FidelidadePage() {
    const { userProfile } = useAuth();
    const [activeTab, setActiveTab] = useState<'pontos' | 'indicacoes' | 'descontos'>('pontos');
    const [programa, setPrograma] = useState<ProgramaFidelidade | null>(null);
    const [pontos, setPontos] = useState<PontosCliente[]>([]);
    const [indicacoes, setIndicacoes] = useState<Indicacao[]>([]);
    const [descontos, setDescontos] = useState<DescontoPreventiva[]>([]);
    const [loading, setLoading] = useState(true);

    const [showConfigModal, setShowConfigModal] = useState(false);
    const [showCreditoModal, setShowCreditoModal] = useState(false);
    const [showRegraModal, setShowRegraModal] = useState(false);

    const empresaId = userProfile?.empresa_id || '';

    const carregarDados = async () => {
        if (!empresaId) return;
        setLoading(true);
        try {
            const [p, pts, ind, desc] = await Promise.all([
                fidelidadeService.obterPrograma(empresaId),
                fidelidadeService.listarPontosClientes(empresaId),
                fidelidadeService.listarIndicacoes(empresaId),
                fidelidadeService.listarDescontos(empresaId)
            ]);
            setPrograma(p);
            setPontos(pts);
            setIndicacoes(ind);
            setDescontos(desc);
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    useEffect(() => { carregarDados(); }, [empresaId]);

    const handleSaveConfig = async (config: Partial<ProgramaFidelidade>) => {
        try {
            await fidelidadeService.salvarPrograma({ ...config, empresa_id: empresaId });
            setShowConfigModal(false);
            carregarDados();
        } catch (err) { console.error(err); }
    };

    const handleRecompensarIndicacao = async (ind: Indicacao) => {
        if (!programa) return;
        try {
            await fidelidadeService.creditarPontos({
                empresa_id: empresaId,
                cliente_id: ind.indicador_id,
                pontos: programa.pontos_por_indicacao,
                tipo: 'indicacao',
                referencia_id: ind.id,
                descricao: `Recompensa por indicar ${ind.nome_indicado}`
            });
            await fidelidadeService.atualizarStatusIndicacao(ind.id, 'recompensada');
            carregarDados();
        } catch (err) { console.error(err); }
    };

    if (loading) return <div className="fidelidade-page"><div className="loading-spinner"><div className="spinner"></div></div></div>;

    return (
        <div className="fidelidade-page">
            <div className="page-header">
                <h1 className="page-title">Programa de Fidelidade</h1>
                <div className="header-actions">
                    <button className="btn-secondary" onClick={() => setShowConfigModal(true)}><SettingsIcon /> Configurar</button>
                    {activeTab === 'pontos' && <button className="btn-primary" onClick={() => setShowCreditoModal(true)}><PlusIcon /> Bonus</button>}
                </div>
            </div>

            <div className="fidelidade-tabs">
                <button className={`fidelidade-tab ${activeTab === 'pontos' ? 'active' : ''}`} onClick={() => setActiveTab('pontos')}>⭐ Pontos</button>
                <button className={`fidelidade-tab ${activeTab === 'indicacoes' ? 'active' : ''}`} onClick={() => setActiveTab('indicacoes')}>🤝 Indicações</button>
                <button className={`fidelidade-tab ${activeTab === 'descontos' ? 'active' : ''}`} onClick={() => setActiveTab('descontos')}>🔧 Manutenção</button>
            </div>

            {/* ========== ABA PONTOS ========== */}
            {activeTab === 'pontos' && (
                <>
                    <div className="fidelidade-metrics">
                        <div className="fidelidade-card"><div className="fidelidade-icon">👥</div><div className="fidelidade-value blue">{pontos.length}</div><div className="fidelidade-label">Clientes Ativos</div></div>
                        <div className="fidelidade-card"><div className="fidelidade-icon">🌟</div><div className="fidelidade-value gold">{pontos.reduce((a, b) => a + b.pontos_atuais, 0)}</div><div className="fidelidade-label">Pontos Circulantes</div></div>
                        <div className="fidelidade-card"><div className="fidelidade-icon">💰</div><div className="fidelidade-value green">{programa?.pontos_por_real || 0}</div><div className="fidelidade-label">Pnt / R$</div></div>
                    </div>

                    <h3 style={{ marginBottom: '1rem', color: 'var(--color-gray-700)' }}>Ranking de Fidelidade</h3>
                    {pontos.length === 0 ? (
                        <div className="empty-state">Nenhum ponto registrado ainda.</div>
                    ) : (
                        pontos.map((p, idx) => (
                            <div key={p.id} className="ranking-card">
                                <div className="ranking-info">
                                    <div className={`ranking-position ${idx < 3 ? `top-${idx + 1}` : ''}`}>{idx + 1}</div>
                                    <div>
                                        <div style={{ fontWeight: 600 }}>{p.cliente?.nome}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Acumulou {p.pontos_totais_acumulados} pontos no total</div>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div className="fidelidade-value gold" style={{ fontSize: '1.25rem' }}>{p.pontos_atuais}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>pontos disponíveis</div>
                                </div>
                            </div>
                        ))
                    )}
                </>
            )}

            {/* ========== ABA INDICAÇÕES ========== */}
            {activeTab === 'indicacoes' && (
                <>
                    <h3 style={{ marginBottom: '1rem', color: 'var(--color-gray-700)' }}>Rastreamento de Indicações</h3>
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr><th>Indicado</th><th>Quem Indicou</th><th>Contato</th><th>Status</th><th>Ações</th></tr>
                            </thead>
                            <tbody>
                                {indicacoes.map(i => (
                                    <tr key={i.id}>
                                        <td style={{ fontWeight: 600 }}>{i.nome_indicado}</td>
                                        <td>{i.indicador?.nome}</td>
                                        <td>{i.contato_indicado}</td>
                                        <td><span className={`indicacao-status ${i.status}`}>{i.status}</span></td>
                                        <td>
                                            {i.status === 'pendente' && (
                                                <button className="btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }} onClick={() => fidelidadeService.atualizarStatusIndicacao(i.id, 'confirmada').then(carregarDados)}>Confirmar</button>
                                            )}
                                            {i.status === 'confirmada' && (
                                                <button className="btn-primary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }} onClick={() => handleRecompensarIndicacao(i)}>Recompensar</button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {/* ========== ABA DESCONTOS ========== */}
            {activeTab === 'descontos' && (
                <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ color: 'var(--color-gray-700)' }}>Benefícios por Recorrência</h3>
                        <button className="btn-primary" onClick={() => setShowRegraModal(true)}><PlusIcon /> Nova Regra</button>
                    </div>
                    <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1.5rem' }}>Defina descontos automáticos para clientes que mantém manutenção preventiva regular.</p>

                    {descontos.map(d => (
                        <div key={d.id} className="rule-card">
                            <div>
                                <div className="rule-title">{d.percentual_desconto}% de Desconto</div>
                                <div className="rule-desc">A partir de {d.min_manutencoes} manutenções concluídas</div>
                                {d.descricao && <div style={{ fontSize: '0.8rem', fontStyle: 'italic', marginTop: '0.25rem' }}>{d.descricao}</div>}
                            </div>
                            <button className="btn-secondary" style={{ color: '#dc2626' }} onClick={() => fidelidadeService.excluirDesconto(d.id).then(carregarDados)}>Excluir</button>
                        </div>
                    ))}

                    {descontos.length === 0 && (
                        <div className="empty-state" style={{ border: '2px dashed #e2e8f0', borderRadius: '12px', padding: '3rem' }}>
                            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📉</div>
                            <h4>Nenhuma regra de desconto recorrente</h4>
                            <p>Crie regras para incentivar contratos de manutenção.</p>
                        </div>
                    )}
                </>
            )}

            {/* MODAIS */}
            {showConfigModal && <ConfigFidelidadeModal programa={programa} onClose={() => setShowConfigModal(false)} onSave={handleSaveConfig} />}
            {showCreditoModal && <CreditarPontosModal empresaId={empresaId} onClose={() => setShowCreditoModal(false)} onSave={() => { setShowCreditoModal(false); carregarDados(); }} />}
            {showRegraModal && <RegraDescontoModal empresaId={empresaId} onClose={() => setShowRegraModal(false)} onSave={() => { setShowRegraModal(false); carregarDados(); }} />}
        </div>
    );
}

export default FidelidadePage;

import { useState, useEffect, type FormEvent } from 'react';
import { qualidadeService } from '../../services/qualidadeService';
import { useAuth } from '../../hooks/useAuth';
import type { ChecklistQualidade, ItemChecklist, RespostaChecklist, Auditoria, IndicadorQualidade, StatusAuditoria } from '../../types';
import '../Clientes/Clientes.css';
import './Qualidade.css';

// Icons
const PlusIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
);

const XIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);

const ClipboardCheckIcon = () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
        <path d="M9 14l2 2 4-4"></path>
    </svg>
);

// ========== CHECKLIST CREATOR MODAL ==========
interface ChecklistFormItem {
    pergunta: string;
    tipo: 'sim_nao' | 'nota' | 'texto';
    obrigatorio: boolean;
}

function ChecklistModal({ empresaId, onClose, onSave }: { empresaId: string; onClose: () => void; onSave: () => void }) {
    const [titulo, setTitulo] = useState('');
    const [descricao, setDescricao] = useState('');
    const [itens, setItens] = useState<ChecklistFormItem[]>([
        { pergunta: '', tipo: 'sim_nao', obrigatorio: true }
    ]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const addItem = () => setItens([...itens, { pergunta: '', tipo: 'sim_nao', obrigatorio: true }]);
    const removeItem = (idx: number) => setItens(itens.filter((_, i) => i !== idx));
    const updateItem = (idx: number, field: keyof ChecklistFormItem, value: string | boolean) => {
        const updated = [...itens];
        updated[idx] = { ...updated[idx], [field]: value };
        setItens(updated);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (itens.some(i => !i.pergunta.trim())) { setError('Preencha todas as perguntas.'); return; }
        setLoading(true);
        setError('');
        try {
            await qualidadeService.criarChecklist({ empresa_id: empresaId, titulo, descricao }, itens as Partial<ItemChecklist>[]);
            onSave();
        } catch { setError('Erro ao criar checklist.'); } finally { setLoading(false); }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                <div className="modal-header">
                    <h2 className="modal-title">Novo Checklist de Qualidade</h2>
                    <button className="modal-close" onClick={onClose}><XIcon /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {error && <div className="error-message">{error}</div>}
                        <div className="form-group">
                            <label className="form-label">Título *</label>
                            <input className="form-input" value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ex: Checklist Pós-Instalação" required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Descrição</label>
                            <input className="form-input" value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Breve descrição do checklist" />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                            <label className="form-label" style={{ margin: 0 }}>Itens do Checklist</label>
                            <button type="button" className="btn-secondary" onClick={addItem} style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem' }}>+ Pergunta</button>
                        </div>

                        {itens.map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <input className="form-input" style={{ flex: 1 }} value={item.pergunta} onChange={e => updateItem(idx, 'pergunta', e.target.value)} placeholder={`Pergunta ${idx + 1}`} />
                                <select className="form-select" style={{ width: '120px' }} value={item.tipo} onChange={e => updateItem(idx, 'tipo', e.target.value)}>
                                    <option value="sim_nao">Sim/Não</option>
                                    <option value="nota">Nota 1-5</option>
                                    <option value="texto">Texto</option>
                                </select>
                                {itens.length > 1 && <button type="button" className="btn-icon danger" onClick={() => removeItem(idx)} style={{ flexShrink: 0 }}>✕</button>}
                            </div>
                        ))}
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Salvando...' : 'Criar Checklist'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ========== FILL CHECKLIST MODAL ==========
function FillChecklistModal({ checklist, empresaId, onClose, onSave }: { checklist: ChecklistQualidade; empresaId: string; onClose: () => void; onSave: () => void }) {
    const { userProfile } = useAuth();
    const [respostas, setRespostas] = useState<Record<string, string | number | boolean>>({});
    const [observacoes, setObservacoes] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleResposta = (itemId: string, valor: string | number | boolean) => {
        setRespostas(prev => ({ ...prev, [itemId]: valor }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const items = checklist.itens || [];
            const respostasArr = items.map(item => ({
                item_id: item.id,
                pergunta: item.pergunta,
                tipo: item.tipo,
                resposta: respostas[item.id] ?? '',
                observacao: ''
            }));

            // Calcular nota geral (média das notas, ou % de sim)
            let notaGeral = 0;
            const notaItems = items.filter(i => i.tipo === 'nota');
            const simNaoItems = items.filter(i => i.tipo === 'sim_nao');

            if (notaItems.length > 0) {
                const somaNotas = notaItems.reduce((sum, i) => sum + (Number(respostas[i.id]) || 0), 0);
                notaGeral = somaNotas / notaItems.length;
            } else if (simNaoItems.length > 0) {
                const sims = simNaoItems.filter(i => respostas[i.id] === true).length;
                notaGeral = (sims / simNaoItems.length) * 5;
            }

            await qualidadeService.enviarRespostas({
                empresa_id: empresaId,
                checklist_id: checklist.id,
                tecnico_id: userProfile?.id,
                respostas: respostasArr,
                nota_geral: Math.round(notaGeral * 10) / 10,
                observacoes
            });
            onSave();
        } catch { setError('Erro ao enviar respostas.'); } finally { setLoading(false); }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                <div className="modal-header">
                    <h2 className="modal-title">📋 {checklist.titulo}</h2>
                    <button className="modal-close" onClick={onClose}><XIcon /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {error && <div className="error-message">{error}</div>}
                        {checklist.descricao && <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>{checklist.descricao}</p>}

                        {(checklist.itens || []).map(item => (
                            <div key={item.id} className="quality-fill-item">
                                <div className="quality-fill-question">
                                    {item.pergunta} {item.obrigatorio && <span style={{ color: '#ef4444' }}>*</span>}
                                </div>

                                {item.tipo === 'sim_nao' && (
                                    <div className="quality-fill-options">
                                        <button type="button" className={`quality-fill-option ${respostas[item.id] === true ? 'selected' : ''}`} onClick={() => handleResposta(item.id, true)}>✅ Sim</button>
                                        <button type="button" className={`quality-fill-option ${respostas[item.id] === false ? 'selected' : ''}`} onClick={() => handleResposta(item.id, false)}>❌ Não</button>
                                    </div>
                                )}

                                {item.tipo === 'nota' && (
                                    <div className="quality-stars">
                                        {[1, 2, 3, 4, 5].map(n => (
                                            <span key={n} className="quality-star" onClick={() => handleResposta(item.id, n)} style={{ color: (respostas[item.id] as number) >= n ? '#f59e0b' : '#d1d5db' }}>★</span>
                                        ))}
                                    </div>
                                )}

                                {item.tipo === 'texto' && (
                                    <textarea className="form-input" rows={2} value={(respostas[item.id] as string) || ''} onChange={e => handleResposta(item.id, e.target.value)} placeholder="Sua resposta..." />
                                )}
                            </div>
                        ))}

                        <div className="form-group" style={{ marginTop: '1rem' }}>
                            <label className="form-label">Observações Gerais</label>
                            <textarea className="form-input" rows={2} value={observacoes} onChange={e => setObservacoes(e.target.value)} placeholder="Comentários adicionais..." />
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Enviando...' : 'Enviar Checklist'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ========== AUDIT MODAL ==========
function AuditModal({ empresaId, onClose, onSave }: { empresaId: string; onClose: () => void; onSave: () => void }) {
    const { userProfile } = useAuth();
    const [nota, setNota] = useState(0);
    const [parecer, setParecer] = useState('');
    const [status, setStatus] = useState<StatusAuditoria>('aprovado');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await qualidadeService.criarAuditoria({
                empresa_id: empresaId,
                auditor_id: userProfile?.id,
                status,
                nota,
                parecer
            });
            onSave();
        } catch { setError('Erro ao registrar auditoria.'); } finally { setLoading(false); }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">Nova Auditoria</h2>
                    <button className="modal-close" onClick={onClose}><XIcon /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {error && <div className="error-message">{error}</div>}
                        <div className="form-group">
                            <label className="form-label">Nota (0-5)</label>
                            <div className="quality-stars">
                                {[1, 2, 3, 4, 5].map(n => (
                                    <span key={n} className="quality-star" onClick={() => setNota(n)} style={{ color: nota >= n ? '#f59e0b' : '#d1d5db' }}>★</span>
                                ))}
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Resultado</label>
                            <select className="form-select" value={status} onChange={e => setStatus(e.target.value as StatusAuditoria)}>
                                <option value="aprovado">✅ Aprovado</option>
                                <option value="reprovado">❌ Reprovado</option>
                                <option value="observacao">⚠️ Com Observação</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Parecer / Observações</label>
                            <textarea className="form-input" rows={3} value={parecer} onChange={e => setParecer(e.target.value)} placeholder="Descreva sua avaliação do serviço..." />
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Salvando...' : 'Registrar Auditoria'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ========== MAIN PAGE ==========
export function QualidadePage() {
    const { userProfile } = useAuth();
    const [activeTab, setActiveTab] = useState<'checklists' | 'auditorias' | 'indicadores'>('checklists');
    const [checklists, setChecklists] = useState<ChecklistQualidade[]>([]);
    const [respostas, setRespostas] = useState<RespostaChecklist[]>([]);
    const [auditorias, setAuditorias] = useState<Auditoria[]>([]);
    const [indicadores, setIndicadores] = useState<IndicadorQualidade | null>(null);
    const [loading, setLoading] = useState(true);

    // Modals
    const [showChecklistModal, setShowChecklistModal] = useState(false);
    const [fillChecklist, setFillChecklist] = useState<ChecklistQualidade | null>(null);
    const [showAuditModal, setShowAuditModal] = useState(false);

    const empresaId = userProfile?.empresa_id || '';

    const carregarDados = async () => {
        if (!empresaId) return;
        setLoading(true);
        try {
            const [ck, rsp, aud] = await Promise.all([
                qualidadeService.listarChecklists(empresaId),
                qualidadeService.listarRespostas(empresaId),
                qualidadeService.listarAuditorias(empresaId)
            ]);
            setChecklists(ck);
            setRespostas(rsp);
            setAuditorias(aud);

            const ind = await qualidadeService.calcularIndicadoresAtuais(empresaId);
            setIndicadores(ind);
        } catch (err) {
            console.error('Erro ao carregar dados de qualidade:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { carregarDados(); }, [empresaId]);

    const formatDate = (d: string) => new Date(d).toLocaleDateString('pt-BR');

    if (loading) {
        return <div className="quality-page"><div className="loading-spinner"><div className="spinner"></div></div></div>;
    }

    return (
        <div className="quality-page">
            <div className="page-header">
                <h1 className="page-title">Gestão de Qualidade</h1>
            </div>

            <div className="quality-tabs">
                <button className={`quality-tab ${activeTab === 'checklists' ? 'active' : ''}`} onClick={() => setActiveTab('checklists')}>📋 Checklists</button>
                <button className={`quality-tab ${activeTab === 'auditorias' ? 'active' : ''}`} onClick={() => setActiveTab('auditorias')}>🔍 Auditorias</button>
                <button className={`quality-tab ${activeTab === 'indicadores' ? 'active' : ''}`} onClick={() => setActiveTab('indicadores')}>📊 Indicadores</button>
            </div>

            {/* ========== CHECKLISTS TAB ========== */}
            {activeTab === 'checklists' && (
                <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ fontWeight: 700, color: 'var(--color-gray-700)' }}>Templates de Checklist</h3>
                        <button className="btn-primary" onClick={() => setShowChecklistModal(true)}><PlusIcon /> Novo Checklist</button>
                    </div>

                    {checklists.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon"><ClipboardCheckIcon /></div>
                            <h3 className="empty-title">Nenhum checklist criado</h3>
                            <p className="empty-description">Crie templates de checklist para que os técnicos preencham após cada serviço.</p>
                        </div>
                    ) : (
                        checklists.map(ck => (
                            <div key={ck.id} className="quality-checklist-card">
                                <div className="quality-checklist-title">{ck.titulo}</div>
                                {ck.descricao && <div className="quality-checklist-desc">{ck.descricao}</div>}
                                <div className="quality-checklist-items">{ck.itens?.length || 0} perguntas</div>
                                <div className="quality-checklist-actions">
                                    <button className="btn-primary" style={{ padding: '0.35rem 1rem', fontSize: '0.8rem' }} onClick={() => setFillChecklist(ck)}>Preencher</button>
                                    <button className="btn-secondary" style={{ padding: '0.35rem 1rem', fontSize: '0.8rem' }} onClick={() => qualidadeService.excluirChecklist(ck.id).then(carregarDados)}>Desativar</button>
                                </div>
                            </div>
                        ))
                    )}

                    {/* Respostas recentes */}
                    {respostas.length > 0 && (
                        <div style={{ marginTop: '2rem' }}>
                            <h3 style={{ fontWeight: 700, color: 'var(--color-gray-700)', marginBottom: '1rem' }}>Respostas Recentes</h3>
                            <div className="table-container">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Checklist</th>
                                            <th>Técnico</th>
                                            <th>Nota</th>
                                            <th>Data</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {respostas.slice(0, 10).map(r => (
                                            <tr key={r.id}>
                                                <td style={{ fontWeight: 600 }}>{r.checklist?.titulo || '-'}</td>
                                                <td>{r.tecnico?.nome || '-'}</td>
                                                <td>
                                                    <span style={{
                                                        fontWeight: 700,
                                                        color: r.nota_geral >= 4 ? '#16a34a' : r.nota_geral >= 2.5 ? '#d97706' : '#dc2626'
                                                    }}>
                                                        {r.nota_geral.toFixed(1)} / 5.0
                                                    </span>
                                                </td>
                                                <td>{formatDate(r.created_at)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* ========== AUDITORIAS TAB ========== */}
            {activeTab === 'auditorias' && (
                <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ fontWeight: 700, color: 'var(--color-gray-700)' }}>Auditorias Remotas</h3>
                        <button className="btn-primary" onClick={() => setShowAuditModal(true)}><PlusIcon /> Nova Auditoria</button>
                    </div>

                    {auditorias.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon"><ClipboardCheckIcon /></div>
                            <h3 className="empty-title">Nenhuma auditoria registrada</h3>
                            <p className="empty-description">Supervisores podem revisar serviços por amostragem para garantir a qualidade.</p>
                        </div>
                    ) : (
                        <div className="table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Data</th>
                                        <th>Auditor</th>
                                        <th>Nota</th>
                                        <th>Status</th>
                                        <th>Parecer</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {auditorias.map(a => (
                                        <tr key={a.id}>
                                            <td>{formatDate(a.created_at)}</td>
                                            <td style={{ fontWeight: 600 }}>{a.auditor?.nome || '-'}</td>
                                            <td>
                                                {a.nota ? (
                                                    <span style={{ fontWeight: 700, color: a.nota >= 4 ? '#16a34a' : a.nota >= 2.5 ? '#d97706' : '#dc2626' }}>
                                                        {a.nota.toFixed(1)}
                                                    </span>
                                                ) : '-'}
                                            </td>
                                            <td><span className={`audit-status ${a.status}`}>{a.status}</span></td>
                                            <td style={{ maxWidth: '300px', fontSize: '0.85rem', color: '#64748b' }}>{a.parecer || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}

            {/* ========== INDICADORES TAB ========== */}
            {activeTab === 'indicadores' && indicadores && (
                <>
                    <div className="quality-metrics">
                        <div className="quality-metric-card">
                            <div className="quality-metric-icon">📊</div>
                            <div className="quality-metric-value blue">{indicadores.total_servicos}</div>
                            <div className="quality-metric-label">Serviços Avaliados</div>
                        </div>
                        <div className="quality-metric-card">
                            <div className="quality-metric-icon">⭐</div>
                            <div className={`quality-metric-value ${indicadores.media_satisfacao >= 4 ? 'green' : indicadores.media_satisfacao >= 2.5 ? 'yellow' : 'red'}`}>{indicadores.media_satisfacao.toFixed(1)}</div>
                            <div className="quality-metric-label">Satisfação Média</div>
                        </div>
                        <div className="quality-metric-card">
                            <div className="quality-metric-icon">🔄</div>
                            <div className={`quality-metric-value ${indicadores.taxa_retrabalho <= 5 ? 'green' : indicadores.taxa_retrabalho <= 15 ? 'yellow' : 'red'}`}>{indicadores.taxa_retrabalho.toFixed(1)}%</div>
                            <div className="quality-metric-label">Taxa de Retrabalho</div>
                        </div>
                        <div className="quality-metric-card">
                            <div className="quality-metric-icon">✅</div>
                            <div className={`quality-metric-value ${indicadores.taxa_aprovacao >= 80 ? 'green' : indicadores.taxa_aprovacao >= 50 ? 'yellow' : 'red'}`}>{indicadores.taxa_aprovacao.toFixed(1)}%</div>
                            <div className="quality-metric-label">Aprovação em Auditoria</div>
                        </div>
                        <div className="quality-metric-card">
                            <div className="quality-metric-icon">🔍</div>
                            <div className="quality-metric-value blue">{indicadores.total_auditorias}</div>
                            <div className="quality-metric-label">Total de Auditorias</div>
                        </div>
                        <div className="quality-metric-card">
                            <div className="quality-metric-icon">⏱️</div>
                            <div className="quality-metric-value blue">{indicadores.tempo_medio_resolucao.toFixed(1)}h</div>
                            <div className="quality-metric-label">Tempo Médio Resolução</div>
                        </div>
                    </div>

                    <div style={{ background: 'white', borderRadius: 'var(--radius-xl)', padding: '1.5rem', border: '1px solid var(--color-gray-100)', boxShadow: 'var(--shadow-sm)' }}>
                        <h3 style={{ fontWeight: 700, color: 'var(--color-gray-700)', marginBottom: '1rem' }}>📈 Análise do Período: {indicadores.periodo}</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div>
                                <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.5rem' }}>Serviços avaliados vs Auditorias</p>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'baseline' }}>
                                    <span style={{ fontSize: '2rem', fontWeight: 800, color: '#2563eb' }}>{indicadores.total_servicos}</span>
                                    <span style={{ color: '#94a3b8' }}>serviços /</span>
                                    <span style={{ fontSize: '2rem', fontWeight: 800, color: '#7c3aed' }}>{indicadores.total_auditorias}</span>
                                    <span style={{ color: '#94a3b8' }}>auditorias</span>
                                </div>
                            </div>
                            <div>
                                <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.5rem' }}>Aprovações em Auditoria</p>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'baseline' }}>
                                    <span style={{ fontSize: '2rem', fontWeight: 800, color: '#16a34a' }}>{indicadores.aprovacoes_auditoria}</span>
                                    <span style={{ color: '#94a3b8' }}>de {indicadores.total_auditorias} ({indicadores.taxa_aprovacao.toFixed(0)}%)</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* ========== MODAIS ========== */}
            {showChecklistModal && <ChecklistModal empresaId={empresaId} onClose={() => setShowChecklistModal(false)} onSave={() => { setShowChecklistModal(false); carregarDados(); }} />}
            {fillChecklist && <FillChecklistModal checklist={fillChecklist} empresaId={empresaId} onClose={() => setFillChecklist(null)} onSave={() => { setFillChecklist(null); carregarDados(); }} />}
            {showAuditModal && <AuditModal empresaId={empresaId} onClose={() => setShowAuditModal(false)} onSave={() => { setShowAuditModal(false); carregarDados(); }} />}
        </div>
    );
}

export default QualidadePage;

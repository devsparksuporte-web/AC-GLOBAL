import { useState, useEffect, type FormEvent } from 'react';
import { integracaoService } from '../../services/integracaoService';
import { useAuth } from '../../hooks/useAuth';
import type { GarantiaEquipamento, Cotacao, ItemCotacao, PedidoFornecedor, StatusPedidoFornecedor } from '../../types';
import '../Clientes/Clientes.css';
import './Integracao.css';

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
const EmptyBoxIcon = () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
        <line x1="12" y1="22.08" x2="12" y2="12"></line>
    </svg>
);

// ========== GARANTIA MODAL ==========
function GarantiaModal({ empresaId, onClose, onSave }: { empresaId: string; onClose: () => void; onSave: () => void }) {
    const [form, setForm] = useState({ fabricante: '', modelo: '', numero_serie: '', data_compra: '', data_vencimento_garantia: '', tipo_garantia: 'padrao' as 'padrao' | 'estendida' | 'contratual', observacoes: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true); setError('');
        try {
            await integracaoService.criarGarantia({ ...form, empresa_id: empresaId, status: 'ativa' });
            onSave();
        } catch { setError('Erro ao registrar garantia.'); } finally { setLoading(false); }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header"><h2 className="modal-title">Nova Garantia</h2><button className="modal-close" onClick={onClose}><XIcon /></button></div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {error && <div className="error-message">{error}</div>}
                        <div className="form-row">
                            <div className="form-group"><label className="form-label">Fabricante *</label><input className="form-input" value={form.fabricante} onChange={e => setForm({ ...form, fabricante: e.target.value })} required /></div>
                            <div className="form-group"><label className="form-label">Modelo *</label><input className="form-input" value={form.modelo} onChange={e => setForm({ ...form, modelo: e.target.value })} required /></div>
                        </div>
                        <div className="form-group"><label className="form-label">Nº Série</label><input className="form-input" value={form.numero_serie} onChange={e => setForm({ ...form, numero_serie: e.target.value })} /></div>
                        <div className="form-row">
                            <div className="form-group"><label className="form-label">Data da Compra</label><input className="form-input" type="date" value={form.data_compra} onChange={e => setForm({ ...form, data_compra: e.target.value })} /></div>
                            <div className="form-group"><label className="form-label">Vencimento Garantia *</label><input className="form-input" type="date" value={form.data_vencimento_garantia} onChange={e => setForm({ ...form, data_vencimento_garantia: e.target.value })} required /></div>
                        </div>
                        <div className="form-group"><label className="form-label">Tipo</label>
                            <select className="form-select" value={form.tipo_garantia} onChange={e => setForm({ ...form, tipo_garantia: e.target.value as 'padrao' | 'estendida' | 'contratual' })}>
                                <option value="padrao">Padrão</option><option value="estendida">Estendida</option><option value="contratual">Contratual</option>
                            </select>
                        </div>
                        <div className="form-group"><label className="form-label">Observações</label><textarea className="form-input" rows={2} value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} /></div>
                    </div>
                    <div className="modal-footer"><button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button><button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Salvando...' : 'Registrar'}</button></div>
                </form>
            </div>
        </div>
    );
}

// ========== COTAÇÃO MODAL ==========
function CotacaoModal({ empresaId, onClose, onSave }: { empresaId: string; onClose: () => void; onSave: () => void }) {
    const [titulo, setTitulo] = useState('');
    const [descricao, setDescricao] = useState('');
    const [dataLimite, setDataLimite] = useState('');
    const [itens, setItens] = useState([{ descricao_peca: '', quantidade: 1, unidade: 'un' }]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const addItem = () => setItens([...itens, { descricao_peca: '', quantidade: 1, unidade: 'un' }]);
    const removeItem = (i: number) => setItens(itens.filter((_, idx) => idx !== i));

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (itens.some(i => !i.descricao_peca.trim())) { setError('Preencha todas as peças.'); return; }
        setLoading(true); setError('');
        try {
            await integracaoService.criarCotacao(
                { empresa_id: empresaId, titulo, descricao, data_limite: dataLimite || undefined } as Partial<Cotacao>,
                itens as Partial<ItemCotacao>[]
            );
            onSave();
        } catch { setError('Erro ao criar cotação.'); } finally { setLoading(false); }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                <div className="modal-header"><h2 className="modal-title">Nova Cotação</h2><button className="modal-close" onClick={onClose}><XIcon /></button></div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {error && <div className="error-message">{error}</div>}
                        <div className="form-group"><label className="form-label">Título *</label><input className="form-input" value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ex: Compressor 12000 BTU" required /></div>
                        <div className="form-group"><label className="form-label">Descrição</label><textarea className="form-input" rows={2} value={descricao} onChange={e => setDescricao(e.target.value)} /></div>
                        <div className="form-group"><label className="form-label">Data Limite</label><input className="form-input" type="date" value={dataLimite} onChange={e => setDataLimite(e.target.value)} /></div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <label className="form-label" style={{ margin: 0 }}>Peças Solicitadas</label>
                            <button type="button" className="btn-secondary" onClick={addItem} style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem' }}>+ Peça</button>
                        </div>
                        {itens.map((item, idx) => (
                            <div key={idx} className="item-row">
                                <input className="form-input" value={item.descricao_peca} onChange={e => { const u = [...itens]; u[idx].descricao_peca = e.target.value; setItens(u); }} placeholder="Descrição da peça" />
                                <input className="form-input" type="number" min={1} value={item.quantidade} onChange={e => { const u = [...itens]; u[idx].quantidade = Number(e.target.value); setItens(u); }} style={{ width: '70px' }} />
                                {itens.length > 1 && <button type="button" onClick={() => removeItem(idx)} style={{ color: '#ef4444', background: 'none', fontSize: '1.1rem', cursor: 'pointer' }}>✕</button>}
                            </div>
                        ))}
                    </div>
                    <div className="modal-footer"><button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button><button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Enviando...' : 'Criar Cotação'}</button></div>
                </form>
            </div>
        </div>
    );
}

// ========== PEDIDO MODAL ==========
function PedidoModal({ empresaId, onClose, onSave }: { empresaId: string; onClose: () => void; onSave: () => void }) {
    const [form, setForm] = useState({ fornecedor_nome: '', numero_pedido: '', valor_total: 0, codigo_rastreio: '', previsao_entrega: '', observacoes: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true); setError('');
        try {
            await integracaoService.criarPedido({ ...form, empresa_id: empresaId, status: 'pendente' });
            onSave();
        } catch { setError('Erro ao criar pedido.'); } finally { setLoading(false); }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header"><h2 className="modal-title">Novo Pedido</h2><button className="modal-close" onClick={onClose}><XIcon /></button></div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {error && <div className="error-message">{error}</div>}
                        <div className="form-group"><label className="form-label">Fornecedor *</label><input className="form-input" value={form.fornecedor_nome} onChange={e => setForm({ ...form, fornecedor_nome: e.target.value })} required /></div>
                        <div className="form-row">
                            <div className="form-group"><label className="form-label">Nº Pedido</label><input className="form-input" value={form.numero_pedido} onChange={e => setForm({ ...form, numero_pedido: e.target.value })} /></div>
                            <div className="form-group"><label className="form-label">Valor Total (R$)</label><input className="form-input" type="number" step="0.01" value={form.valor_total} onChange={e => setForm({ ...form, valor_total: Number(e.target.value) })} /></div>
                        </div>
                        <div className="form-row">
                            <div className="form-group"><label className="form-label">Código Rastreio</label><input className="form-input" value={form.codigo_rastreio} onChange={e => setForm({ ...form, codigo_rastreio: e.target.value })} /></div>
                            <div className="form-group"><label className="form-label">Previsão Entrega</label><input className="form-input" type="date" value={form.previsao_entrega} onChange={e => setForm({ ...form, previsao_entrega: e.target.value })} /></div>
                        </div>
                        <div className="form-group"><label className="form-label">Observações</label><textarea className="form-input" rows={2} value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} /></div>
                    </div>
                    <div className="modal-footer"><button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button><button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Salvando...' : 'Criar Pedido'}</button></div>
                </form>
            </div>
        </div>
    );
}

// ========== TRACKING TIMELINE ==========
function TrackingTimeline({ status }: { status: StatusPedidoFornecedor }) {
    const steps: { key: StatusPedidoFornecedor; label: string }[] = [
        { key: 'pendente', label: 'Pendente' },
        { key: 'confirmado', label: 'Confirmado' },
        { key: 'em_transito', label: 'Em Trânsito' },
        { key: 'entregue', label: 'Entregue' }
    ];
    const currentIdx = steps.findIndex(s => s.key === status);

    if (status === 'cancelado') {
        return <span className="pedido-status cancelado">CANCELADO</span>;
    }

    return (
        <div className="tracking-timeline">
            {steps.map((step, idx) => (
                <div key={step.key} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                    <div className="tracking-step">
                        <div className={`tracking-dot ${idx < currentIdx ? 'completed' : idx === currentIdx ? 'current' : 'pending'}`}>
                            {idx < currentIdx ? '✓' : idx + 1}
                        </div>
                        <div className="tracking-label">{step.label}</div>
                    </div>
                    {idx < steps.length - 1 && (
                        <div className={`tracking-line ${idx < currentIdx ? 'completed' : 'pending'}`} />
                    )}
                </div>
            ))}
        </div>
    );
}

// ========== MAIN PAGE ==========
export function IntegracaoPage() {
    const { userProfile } = useAuth();
    const [activeTab, setActiveTab] = useState<'garantias' | 'cotacoes' | 'pedidos'>('garantias');
    const [garantias, setGarantias] = useState<GarantiaEquipamento[]>([]);
    const [cotacoes, setCotacoes] = useState<Cotacao[]>([]);
    const [pedidos, setPedidos] = useState<PedidoFornecedor[]>([]);
    const [loading, setLoading] = useState(true);

    const [showGarantiaModal, setShowGarantiaModal] = useState(false);
    const [showCotacaoModal, setShowCotacaoModal] = useState(false);
    const [showPedidoModal, setShowPedidoModal] = useState(false);

    const empresaId = userProfile?.empresa_id || '';

    const carregarDados = async () => {
        if (!empresaId) return;
        setLoading(true);
        try {
            const [g, c, p] = await Promise.all([
                integracaoService.listarGarantias(empresaId),
                integracaoService.listarCotacoes(empresaId),
                integracaoService.listarPedidos(empresaId)
            ]);
            setGarantias(g);
            setCotacoes(c);
            setPedidos(p);
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    useEffect(() => { carregarDados(); }, [empresaId]);

    const formatDate = (d: string) => new Date(d).toLocaleDateString('pt-BR');
    const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const diasParaVencer = (data: string) => {
        const diff = new Date(data).getTime() - new Date().getTime();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    };

    const getGarantiaClass = (g: GarantiaEquipamento) => {
        if (g.status === 'vencida') return 'expired';
        const dias = diasParaVencer(g.data_vencimento_garantia);
        if (dias <= 30) return 'expiring';
        return 'active';
    };

    const handleUpdatePedidoStatus = async (id: string, novoStatus: StatusPedidoFornecedor) => {
        try {
            const update: Partial<PedidoFornecedor> = { status: novoStatus };
            if (novoStatus === 'entregue') update.data_entrega = new Date().toISOString().split('T')[0];
            await integracaoService.atualizarPedido(id, update);
            carregarDados();
        } catch (err) { console.error(err); }
    };

    if (loading) {
        return <div className="integracao-page"><div className="loading-spinner"><div className="spinner"></div></div></div>;
    }

    return (
        <div className="integracao-page">
            <div className="page-header">
                <h1 className="page-title">Integração com Fornecedores</h1>
            </div>

            <div className="integracao-tabs">
                <button className={`integracao-tab ${activeTab === 'garantias' ? 'active' : ''}`} onClick={() => setActiveTab('garantias')}>🔧 Garantias</button>
                <button className={`integracao-tab ${activeTab === 'cotacoes' ? 'active' : ''}`} onClick={() => setActiveTab('cotacoes')}>💰 Cotações</button>
                <button className={`integracao-tab ${activeTab === 'pedidos' ? 'active' : ''}`} onClick={() => setActiveTab('pedidos')}>📦 Pedidos</button>
            </div>

            {/* ========== GARANTIAS ========== */}
            {activeTab === 'garantias' && (
                <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ fontWeight: 700, color: 'var(--color-gray-700)' }}>Garantias de Equipamentos</h3>
                        <button className="btn-primary" onClick={() => setShowGarantiaModal(true)}><PlusIcon /> Nova Garantia</button>
                    </div>

                    {garantias.length === 0 ? (
                        <div className="empty-state"><div className="empty-icon"><EmptyBoxIcon /></div><h3 className="empty-title">Nenhuma garantia registrada</h3><p className="empty-description">Registre garantias para acompanhar vencimentos e acionar fabricantes.</p></div>
                    ) : (
                        garantias.map(g => {
                            const dias = diasParaVencer(g.data_vencimento_garantia);
                            return (
                                <div key={g.id} className={`garantia-card ${getGarantiaClass(g)}`}>
                                    <div className="garantia-info">
                                        <h4>{g.fabricante} — {g.modelo}</h4>
                                        <p>
                                            {g.numero_serie && `S/N: ${g.numero_serie} · `}
                                            Vence em {formatDate(g.data_vencimento_garantia)}
                                            {dias > 0 && dias <= 30 && <span style={{ color: '#f59e0b', fontWeight: 600 }}> ({dias} dias restantes ⚠️)</span>}
                                            {dias <= 0 && <span style={{ color: '#dc2626', fontWeight: 600 }}> (vencida)</span>}
                                        </p>
                                    </div>
                                    <span className={`garantia-badge ${g.status}`}>{g.status}</span>
                                </div>
                            );
                        })
                    )}
                </>
            )}

            {/* ========== COTAÇÕES ========== */}
            {activeTab === 'cotacoes' && (
                <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ fontWeight: 700, color: 'var(--color-gray-700)' }}>Cotações de Peças</h3>
                        <button className="btn-primary" onClick={() => setShowCotacaoModal(true)}><PlusIcon /> Nova Cotação</button>
                    </div>

                    {cotacoes.length === 0 ? (
                        <div className="empty-state"><div className="empty-icon"><EmptyBoxIcon /></div><h3 className="empty-title">Nenhuma cotação</h3><p className="empty-description">Crie cotações para comparar preços e prazos entre fornecedores.</p></div>
                    ) : (
                        cotacoes.map(c => (
                            <div key={c.id} className="cotacao-card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-gray-800)', marginBottom: '0.25rem' }}>{c.titulo}</div>
                                        {c.descricao && <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{c.descricao}</div>}
                                        <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.5rem' }}>
                                            {c.itens?.length || 0} peça(s) · por {c.solicitante?.nome || '-'} · {formatDate(c.created_at)}
                                            {c.data_limite && ` · Limite: ${formatDate(c.data_limite)}`}
                                        </div>
                                    </div>
                                    <span className={`cotacao-status ${c.status}`}>{c.status.replace('_', ' ')}</span>
                                </div>

                                {/* Itens e respostas */}
                                {c.itens && c.itens.length > 0 && (
                                    <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px' }}>
                                        {c.itens.map(item => (
                                            <div key={item.id} style={{ marginBottom: '0.5rem' }}>
                                                <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{item.descricao_peca}</span>
                                                <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}> × {item.quantidade} {item.unidade}</span>
                                                {item.respostas && item.respostas.length > 0 && (
                                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.35rem', flexWrap: 'wrap' }}>
                                                        {item.respostas.map(r => (
                                                            <span key={r.id} style={{
                                                                padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem',
                                                                background: r.selecionado ? '#dcfce7' : '#f1f5f9',
                                                                border: r.selecionado ? '1px solid #22c55e' : '1px solid #e2e8f0',
                                                                fontWeight: r.selecionado ? 700 : 400
                                                            }}>
                                                                {r.fornecedor_nome}: {r.preco_unitario ? formatCurrency(r.preco_unitario) : '-'} · {r.prazo_entrega ?? '?'} dias
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </>
            )}

            {/* ========== PEDIDOS ========== */}
            {activeTab === 'pedidos' && (
                <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ fontWeight: 700, color: 'var(--color-gray-700)' }}>Rastreamento de Pedidos</h3>
                        <button className="btn-primary" onClick={() => setShowPedidoModal(true)}><PlusIcon /> Novo Pedido</button>
                    </div>

                    {pedidos.length === 0 ? (
                        <div className="empty-state"><div className="empty-icon"><EmptyBoxIcon /></div><h3 className="empty-title">Nenhum pedido</h3><p className="empty-description">Registre pedidos para acompanhar entregas em tempo real.</p></div>
                    ) : (
                        pedidos.map(p => (
                            <div key={p.id} className="pedido-card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-gray-800)' }}>{p.fornecedor_nome}</div>
                                        <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                                            {p.numero_pedido && `Pedido #${p.numero_pedido} · `}
                                            {formatCurrency(p.valor_total)}
                                            {p.codigo_rastreio && ` · Rastreio: ${p.codigo_rastreio}`}
                                        </div>
                                    </div>
                                    <span className={`pedido-status ${p.status}`}>{p.status.replace('_', ' ')}</span>
                                </div>

                                <TrackingTimeline status={p.status} />

                                <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.5rem' }}>
                                    <span>Criado: {formatDate(p.created_at)}</span>
                                    {p.previsao_entrega && <span>Previsão: {formatDate(p.previsao_entrega)}</span>}
                                    {p.data_entrega && <span style={{ color: '#16a34a' }}>Entregue: {formatDate(p.data_entrega)}</span>}
                                </div>

                                {p.status !== 'entregue' && p.status !== 'cancelado' && (
                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                                        {p.status === 'pendente' && <button className="btn-secondary" style={{ padding: '0.3rem 0.8rem', fontSize: '0.78rem' }} onClick={() => handleUpdatePedidoStatus(p.id, 'confirmado')}>✅ Confirmar</button>}
                                        {p.status === 'confirmado' && <button className="btn-secondary" style={{ padding: '0.3rem 0.8rem', fontSize: '0.78rem' }} onClick={() => handleUpdatePedidoStatus(p.id, 'em_transito')}>🚚 Em Trânsito</button>}
                                        {p.status === 'em_transito' && <button className="btn-primary" style={{ padding: '0.3rem 0.8rem', fontSize: '0.78rem' }} onClick={() => handleUpdatePedidoStatus(p.id, 'entregue')}>📦 Entregue</button>}
                                        <button className="btn-secondary" style={{ padding: '0.3rem 0.8rem', fontSize: '0.78rem', color: '#dc2626' }} onClick={() => handleUpdatePedidoStatus(p.id, 'cancelado')}>Cancelar</button>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </>
            )}

            {/* MODAIS */}
            {showGarantiaModal && <GarantiaModal empresaId={empresaId} onClose={() => setShowGarantiaModal(false)} onSave={() => { setShowGarantiaModal(false); carregarDados(); }} />}
            {showCotacaoModal && <CotacaoModal empresaId={empresaId} onClose={() => setShowCotacaoModal(false)} onSave={() => { setShowCotacaoModal(false); carregarDados(); }} />}
            {showPedidoModal && <PedidoModal empresaId={empresaId} onClose={() => setShowPedidoModal(false)} onSave={() => { setShowPedidoModal(false); carregarDados(); }} />}
        </div>
    );
}

export default IntegracaoPage;

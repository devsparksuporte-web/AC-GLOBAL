import { useState, useEffect } from 'react';
import { conformidadeService } from '../../services/conformidadeService';
import { adminService } from '../../services/adminService';
import { useAuth } from '../../hooks/useAuth';
import type {
    Certificacao,
    TipoRisco,
    ChecklistSeguranca,
    UserProfile
} from '../../types';
import './Conformidade.css';

// ========== CERTIFICACAO MODAL ==========
function CertificacaoModal({ empresaId, onClose, onSave }: { empresaId: string, onClose: () => void, onSave: () => void }) {
    const [nome, setNome] = useState('');
    const [descricao, setDescricao] = useState('');
    const [obrigatoria, setObrigatoria] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await conformidadeService.salvarCertificacao({ empresa_id: empresaId, nome, descricao, obrigatoria });
            onSave();
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header"><h2 className="modal-title">Nova Certificação / Treinamento</h2><button className="modal-close" onClick={onClose}>✕</button></div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-group"><label className="form-label">Nome (ex: NR-10)</label><input className="form-input" value={nome} onChange={e => setNome(e.target.value)} required /></div>
                        <div className="form-group"><label className="form-label">Descrição</label><textarea className="form-input" value={descricao} onChange={e => setDescricao(e.target.value)} /></div>
                        <div className="form-group" style={{ flexDirection: 'row', gap: '0.5rem' }}>
                            <input type="checkbox" checked={obrigatoria} onChange={e => setObrigatoria(e.target.checked)} id="obr" />
                            <label htmlFor="obr" className="form-label">Obrigatória para todos os técnicos</label>
                        </div>
                    </div>
                    <div className="modal-footer"><button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button><button type="submit" className="btn-primary" disabled={loading}>Salvar</button></div>
                </form>
            </div>
        </div>
    );
}

// ========== TIPO RISCO MODAL ==========
function TipoRiscoModal({ empresaId, certificacoes, onClose, onSave }: { empresaId: string, certificacoes: Certificacao[], onClose: () => void, onSave: () => void }) {
    const [nome, setNome] = useState('');
    const [descricao, setDescricao] = useState('');
    const [corAlerta, setCorAlerta] = useState<'warning' | 'danger'>('warning');
    const [selecionadas, setSelecionadas] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await conformidadeService.salvarTipoRisco({ empresa_id: empresaId, nome, descricao, cor_alerta: corAlerta, certificacoes_requeridas: selecionadas });
            onSave();
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header"><h2 className="modal-title">Configurar Perfil de Risco</h2><button className="modal-close" onClick={onClose}>✕</button></div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-group"><label className="form-label">Nome do Risco (ex: Trabalho em Altura)</label><input className="form-input" value={nome} onChange={e => setNome(e.target.value)} required /></div>
                        <div className="form-group"><label className="form-label">Descrição</label><textarea className="form-input" value={descricao} onChange={e => setDescricao(e.target.value)} /></div>
                        <div className="form-group"><label className="form-label">Severidade</label>
                            <select className="form-select" value={corAlerta} onChange={e => setCorAlerta(e.target.value as any)}>
                                <option value="warning">⚠️ Médio (Warning)</option>
                                <option value="danger">☠️ Alto (Danger)</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Certificações Exigidas</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                {certificacoes.map(c => (
                                    <div key={c.id} style={{ display: 'flex', gap: '0.5rem', fontSize: '0.85rem' }}>
                                        <input type="checkbox" checked={selecionadas.includes(c.id)} onChange={e => {
                                            if (e.target.checked) setSelecionadas([...selecionadas, c.id]);
                                            else setSelecionadas(selecionadas.filter(id => id !== c.id));
                                        }} /> {c.nome}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer"><button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button><button type="submit" className="btn-primary" disabled={loading}>Salvar Risco</button></div>
                </form>
            </div>
        </div>
    );
}

// ========== CHECKLIST MODAL ==========
function ChecklistModal({ empresaId, riscos, onClose, onSave }: { empresaId: string, riscos: TipoRisco[], onClose: () => void, onSave: () => void }) {
    const [titulo, setTitulo] = useState('');
    const [riscoId, setRiscoId] = useState('');
    const [itens, setItens] = useState<{ pergunta: string, obrigatorio: boolean }[]>([{ pergunta: '', obrigatorio: true }]);
    const [loading, setLoading] = useState(false);

    const addInternalItem = () => setItens([...itens, { pergunta: '', obrigatorio: true }]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await conformidadeService.salvarChecklist({ empresa_id: empresaId, titulo, tipo_risco_id: riscoId || undefined, itens: itens.filter(i => i.pergunta) });
            onSave();
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
                <div className="modal-header"><h2 className="modal-title">Novo Modelo de Checklist</h2><button className="modal-close" onClick={onClose}>✕</button></div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-row">
                            <div className="form-group"><label className="form-label">Título do Checklist</label><input className="form-input" value={titulo} onChange={e => setTitulo(e.target.value)} required /></div>
                            <div className="form-group"><label className="form-label">Vincular a Risco (Opcional)</label>
                                <select className="form-select" value={riscoId} onChange={e => setRiscoId(e.target.value)}>
                                    <option value="">Geral (Todos)</option>
                                    {riscos.map(r => <option key={r.id} value={r.id}>{r.nome}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Itens de Verificação</label>
                            {itens.map((it, idx) => (
                                <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    <input className="form-input" placeholder="Ex: EPIs conferidos?" value={it.pergunta} onChange={e => {
                                        const newItens = [...itens];
                                        newItens[idx].pergunta = e.target.value;
                                        setItens(newItens);
                                    }} />
                                    <button type="button" className="btn-secondary" onClick={() => setItens(itens.filter((_, i) => i !== idx))}>✕</button>
                                </div>
                            ))}
                            <button type="button" className="btn-secondary" style={{ width: '100%', marginTop: '0.5rem' }} onClick={addInternalItem}>+ Adicionar Item</button>
                        </div>
                    </div>
                    <div className="modal-footer"><button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button><button type="submit" className="btn-primary" disabled={loading}>Criar Checklist</button></div>
                </form>
            </div>
        </div>
    );
}

// ========== ATRIBUIR CERTIFICACAO MODAL ==========
function AtribuirCertificacaoModal({ empresaId, perfil, certificacoes, onClose, onSave }: { empresaId: string, perfil: UserProfile, certificacoes: Certificacao[], onClose: () => void, onSave: () => void }) {
    const [certId, setCertId] = useState('');
    const [dataEmissao, setDataEmissao] = useState('');
    const [dataVencimento, setDataVencimento] = useState('');
    const [numero, setNumero] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await conformidadeService.salvarCertificacaoTecnico({
                empresa_id: empresaId,
                perfil_id: perfil.id,
                certificacao_id: certId,
                data_emissao: dataEmissao,
                data_vencimento: dataVencimento,
                numero_registro: numero,
                status: 'ativo'
            });
            onSave();
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header"><h2 className="modal-title">Vincular Certificado: {perfil.nome}</h2><button className="modal-close" onClick={onClose}>✕</button></div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-group">
                            <label className="form-label">Certificação / Treinamento</label>
                            <select className="form-select" value={certId} onChange={e => setCertId(e.target.value)} required>
                                <option value="">Selecione...</option>
                                {certificacoes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                            </select>
                        </div>
                        <div className="form-row">
                            <div className="form-group"><label className="form-label">Data Emissão</label><input className="form-input" type="date" value={dataEmissao} onChange={e => setDataEmissao(e.target.value)} required /></div>
                            <div className="form-group"><label className="form-label">Data Vencimento</label><input className="form-input" type="date" value={dataVencimento} onChange={e => setDataVencimento(e.target.value)} required /></div>
                        </div>
                        <div className="form-group"><label className="form-label">Nº Registro/Autenticação</label><input className="form-input" value={numero} onChange={e => setNumero(e.target.value)} /></div>
                    </div>
                    <div className="modal-footer"><button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button><button type="submit" className="btn-primary" disabled={loading}>Vincular</button></div>
                </form>
            </div>
        </div>
    );
}

export function ConformidadePage() {
    const { userProfile } = useAuth();
    const [activeTab, setActiveTab] = useState<'certificacoes' | 'riscos' | 'checklists'>('certificacoes');
    const [certificacoes, setCertificacoes] = useState<Certificacao[]>([]);
    const [tecnicos, setTecnicos] = useState<UserProfile[]>([]);
    const [riscos, setRiscos] = useState<TipoRisco[]>([]);
    const [checklists, setChecklists] = useState<ChecklistSeguranca[]>([]);
    const [loading, setLoading] = useState(true);

    const [showCertModal, setShowCertModal] = useState(false);
    const [showRiscoModal, setShowRiscoModal] = useState(false);
    const [showCheckModal, setShowCheckModal] = useState(false);
    const [selectedTecnico, setSelectedTecnico] = useState<UserProfile | null>(null);
    const [tecnicoCertificacoes, setTecnicoCertificacoes] = useState<Record<string, any[]>>({});

    const empresaId = userProfile?.empresa_id || '';

    const carregarDados = async () => {
        if (!empresaId) return;
        setLoading(true);
        try {
            const [certs, tics, rs, cls] = await Promise.all([
                conformidadeService.listarCertificacoes(empresaId),
                adminService.listarUsuariosPorEmpresa(empresaId),
                conformidadeService.listarTiposRisco(empresaId),
                conformidadeService.listarChecklists(empresaId)
            ]);
            setCertificacoes(certs);
            setTecnicos(tics.filter((u: UserProfile) => u.role === 'tecnico' || u.role === 'admin'));
            setRiscos(rs);
            setChecklists(cls);

            // Carregar certificações de cada técnico
            const certsMap: Record<string, any[]> = {};
            await Promise.all(tics.map(async (t) => {
                const tc = await conformidadeService.listarCertificacoesTecnico(t.id);
                certsMap[t.id] = tc;
            }));
            setTecnicoCertificacoes(certsMap);
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    useEffect(() => { carregarDados(); }, [empresaId]);

    if (loading) return <div className="conformidade-page"><div className="loading-spinner">Carregando...</div></div>;

    return (
        <div className="conformidade-page">
            <div className="page-header">
                <h1 className="page-title">Gestão de Riscos e Conformidade</h1>
                <div className="header-actions">
                    <button className="btn-primary" onClick={() => setShowCertModal(true)}>+ Nova Certificação</button>
                </div>
            </div>

            <div className="conformidade-tabs">
                <button className={`conformidade-tab ${activeTab === 'certificacoes' ? 'active' : ''}`} onClick={() => setActiveTab('certificacoes')}>📜 Certificações</button>
                <button className={`conformidade-tab ${activeTab === 'riscos' ? 'active' : ''}`} onClick={() => setActiveTab('riscos')}>⚠️ Riscos e Alertas</button>
                <button className={`conformidade-tab ${activeTab === 'checklists' ? 'active' : ''}`} onClick={() => setActiveTab('checklists')}>✅ Checklists</button>
            </div>

            {/* ABA CERTIFICAÇÕES */}
            {activeTab === 'certificacoes' && (
                <div className="tab-content">
                    <div className="section-header" style={{ marginBottom: '1.5rem' }}>
                        <h3>Certificações por Técnico</h3>
                        <p>Acompanhe a validade das NRs e treinamentos obrigatórios.</p>
                    </div>

                    {tecnicos.map(t => (
                        <div key={t.id} style={{ marginBottom: '2rem', background: '#f8fafc', padding: '1.5rem', borderRadius: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h4 style={{ margin: 0 }}>👤 {t.nome}</h4>
                                <button className="btn-secondary" style={{ fontSize: '0.8rem' }} onClick={() => setSelectedTecnico(t)}>Adicionar Certificado</button>
                            </div>

                            <div className="cert-list">
                                {tecnicoCertificacoes[t.id]?.map(tc => (
                                    <div key={tc.id} className="cert-card" style={{ borderLeft: tc.status === 'vencido' ? '4px solid #ef4444' : 'none' }}>
                                        <div className="cert-info">
                                            <h4>{tc.certificacao?.nome}</h4>
                                            <p>Vencimento: {new Date(tc.data_vencimento).toLocaleDateString()}</p>
                                        </div>
                                        <span className={`cert-status ${tc.status}`}>{tc.status}</span>
                                    </div>
                                ))}
                                {(!tecnicoCertificacoes[t.id] || tecnicoCertificacoes[t.id].length === 0) && (
                                    <div className="empty-state" style={{ padding: '1rem', fontSize: '0.8rem' }}>Nenhum certificado registrado.</div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ABA RISCOS */}
            {activeTab === 'riscos' && (
                <div className="tab-content">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                        <h3>Configuração de Riscos</h3>
                        <button className="btn-secondary" onClick={() => setShowRiscoModal(true)}>+ Novo Risco</button>
                    </div>

                    <div className="riscos-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                        {riscos.length === 0 ? (
                            <div className="empty-state">Nenhum risco cadastrado.</div>
                        ) : riscos.map(r => (
                            <div key={r.id} className="card" style={{ padding: '1.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                                    <span className={`risco-badge ${r.cor_alerta}`}>{r.cor_alerta === 'danger' ? '☠️ High Risk' : '⚠️ Alert'}</span>
                                    <h4 style={{ margin: 0 }}>{r.nome}</h4>
                                </div>
                                <p style={{ fontSize: '0.9rem', color: '#64748b' }}>{r.descricao}</p>
                                <div style={{ marginTop: '1rem' }}>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Exigências:</span>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                                        {r.certificacoes_requeridas.map(cId => {
                                            const c = certificacoes.find(x => x.id === cId);
                                            return <span key={cId} style={{ background: '#f1f5f9', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem' }}>{c?.nome || 'Certificação'}</span>
                                        })}
                                        {r.certificacoes_requeridas.length === 0 && <span style={{ fontStyle: 'italic', fontSize: '0.75rem' }}>Nenhuma certificação exigida</span>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ABA CHECKLISTS */}
            {activeTab === 'checklists' && (
                <div className="tab-content">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                        <h3>Modelos de Checklists de Segurança</h3>
                        <button className="btn-primary" onClick={() => setShowCheckModal(true)}>+ Novo Modelo</button>
                    </div>

                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr><th>Título</th><th>Risco Associado</th><th>Itens</th><th>Criado em</th><th>Ações</th></tr>
                            </thead>
                            <tbody>
                                {checklists.map(cl => (
                                    <tr key={cl.id}>
                                        <td style={{ fontWeight: 600 }}>{cl.titulo}</td>
                                        <td>{cl.tipo_risco_id ? riscos.find(r => r.id === cl.tipo_risco_id)?.nome : 'Geral'}</td>
                                        <td>{cl.itens.length} verificações</td>
                                        <td>{new Date(cl.created_at).toLocaleDateString()}</td>
                                        <td><button className="btn-secondary">Editar</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* MODAIS */}
            {showCertModal && <CertificacaoModal empresaId={empresaId} onClose={() => setShowCertModal(false)} onSave={() => { setShowCertModal(false); carregarDados(); }} />}
            {showRiscoModal && <TipoRiscoModal empresaId={empresaId} certificacoes={certificacoes} onClose={() => setShowRiscoModal(false)} onSave={() => { setShowRiscoModal(false); carregarDados(); }} />}
            {showCheckModal && <ChecklistModal empresaId={empresaId} riscos={riscos} onClose={() => setShowCheckModal(false)} onSave={() => { setShowCheckModal(false); carregarDados(); }} />}
            {selectedTecnico && <AtribuirCertificacaoModal empresaId={empresaId} perfil={selectedTecnico} certificacoes={certificacoes} onClose={() => setSelectedTecnico(null)} onSave={() => { setSelectedTecnico(null); carregarDados(); }} />}
        </div>
    );
}

export default ConformidadePage;

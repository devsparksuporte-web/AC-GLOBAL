import { useState, useEffect, type FormEvent } from 'react';
import { conhecimentoService } from '../../services/conhecimentoService';
import type { ArtigoConhecimento, SolucaoConhecimento, PontuacaoTecnico } from '../../types';
import '../Clientes/Clientes.css';
import './Conhecimento.css';

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

const ArrowLeftIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="19" y1="12" x2="5" y2="12"></line>
        <polyline points="12 19 5 12 12 5"></polyline>
    </svg>
);

const BookIcon = () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
    </svg>
);

// ========== ARTIGO FORM MODAL ==========
function ArtigoModal({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
    const [titulo, setTitulo] = useState('');
    const [descricao, setDescricao] = useState('');
    const [categoria, setCategoria] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const categorias = ['Ar Condicionado', 'Elétrica', 'Instalação', 'Manutenção', 'Refrigeração', 'Ferramentas', 'Outro'];

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await conhecimentoService.criarArtigo({ titulo, descricao, categoria });
            onSave();
        } catch (err) {
            setError('Erro ao criar artigo.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">Novo Problema / Tópico</h2>
                    <button className="modal-close" onClick={onClose}><XIcon /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {error && <div className="error-message">{error}</div>}
                        <div className="form-group">
                            <label className="form-label">Título do Problema *</label>
                            <input className="form-input" value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ex: Split não gela mesmo após limpeza" required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Descrição Detalhada *</label>
                            <textarea className="form-input" rows={4} value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Descreva o problema com o máximo de detalhes possível..." required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Categoria</label>
                            <select className="form-select" value={categoria} onChange={e => setCategoria(e.target.value)}>
                                <option value="">Selecione...</option>
                                {categorias.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'Publicando...' : 'Publicar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ========== SOLUÇÃO FORM MODAL ==========
function SolucaoModal({ artigoId, onClose, onSave }: { artigoId: string; onClose: () => void; onSave: () => void }) {
    const [conteudo, setConteudo] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await conhecimentoService.criarSolucao({ artigo_id: artigoId, conteudo });
            onSave();
        } catch (err) {
            setError('Erro ao enviar solução.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">Contribuir Solução</h2>
                    <button className="modal-close" onClick={onClose}><XIcon /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {error && <div className="error-message">{error}</div>}
                        <div className="form-group">
                            <label className="form-label">Sua Solução / Dica *</label>
                            <textarea className="form-input" rows={6} value={conteudo} onChange={e => setConteudo(e.target.value)} placeholder="Descreva a solução passo a passo. Quanto mais detalhes, mais útil para a equipe!" required />
                        </div>
                        <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
                            🏆 Você ganha <strong>+10 pontos</strong> por contribuir e <strong>+5 pontos</strong> por cada voto positivo recebido!
                        </p>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'Enviando...' : 'Enviar Solução'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ========== MAIN PAGE ==========
export function ConhecimentoPage() {
    const [activeTab, setActiveTab] = useState<'artigos' | 'ranking'>('artigos');
    const [artigos, setArtigos] = useState<ArtigoConhecimento[]>([]);
    const [ranking, setRanking] = useState<PontuacaoTecnico[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showArtigoModal, setShowArtigoModal] = useState(false);

    // Detail view state
    const [selectedArtigo, setSelectedArtigo] = useState<ArtigoConhecimento | null>(null);
    const [solucoes, setSolucoes] = useState<SolucaoConhecimento[]>([]);
    const [showSolucaoModal, setShowSolucaoModal] = useState(false);

    const carregarArtigos = async () => {
        setLoading(true);
        try {
            const data = search
                ? await conhecimentoService.buscarArtigos(search)
                : await conhecimentoService.listarArtigos();
            setArtigos(data);
        } catch (error) {
            console.error('Erro ao carregar artigos:', error);
        } finally {
            setLoading(false);
        }
    };

    const carregarRanking = async () => {
        try {
            const data = await conhecimentoService.listarRanking();
            setRanking(data);
        } catch (error) {
            console.error('Erro ao carregar ranking:', error);
        }
    };

    const carregarSolucoes = async (artigoId: string) => {
        try {
            const data = await conhecimentoService.listarSolucoes(artigoId);
            setSolucoes(data);
        } catch (error) {
            console.error('Erro ao carregar soluções:', error);
        }
    };

    useEffect(() => {
        carregarArtigos();
        carregarRanking();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            carregarArtigos();
        }, 400);
        return () => clearTimeout(timer);
    }, [search]);

    const handleSelectArtigo = (artigo: ArtigoConhecimento) => {
        setSelectedArtigo(artigo);
        carregarSolucoes(artigo.id);
    };

    const handleVotar = async (solucaoId: string, valor: 1 | -1) => {
        try {
            await conhecimentoService.votar(solucaoId, valor);
            if (selectedArtigo) {
                carregarSolucoes(selectedArtigo.id);
            }
        } catch (error) {
            console.error('Erro ao votar:', error);
        }
    };

    const handleVoltar = () => {
        setSelectedArtigo(null);
        setSolucoes([]);
    };

    const formatDate = (d: string) => new Date(d).toLocaleDateString('pt-BR');
    const getRankClass = (i: number) => {
        if (i === 0) return 'gold';
        if (i === 1) return 'silver';
        if (i === 2) return 'bronze';
        return 'default';
    };

    // ========== DETAIL VIEW ==========
    if (selectedArtigo) {
        return (
            <div className="kb-page">
                <button className="kb-detail-back" onClick={handleVoltar}>
                    <ArrowLeftIcon /> Voltar para listagem
                </button>

                <div className="kb-detail-header">
                    <div className="kb-detail-title">{selectedArtigo.titulo}</div>
                    <div className="kb-detail-desc">{selectedArtigo.descricao}</div>
                    <div className="kb-article-meta" style={{ marginTop: '1rem' }}>
                        {selectedArtigo.categoria && <span className="kb-tag">{selectedArtigo.categoria}</span>}
                        <span>por {selectedArtigo.autor?.nome || 'Anônimo'}</span>
                        <span>{formatDate(selectedArtigo.created_at)}</span>
                    </div>
                </div>

                <div className="kb-solutions-header">
                    <h3 className="kb-solutions-title">💡 Soluções ({solucoes.length})</h3>
                    <button className="btn-primary" onClick={() => setShowSolucaoModal(true)}>
                        <PlusIcon /> Contribuir
                    </button>
                </div>

                {solucoes.length === 0 ? (
                    <div className="empty-state">
                        <p className="empty-description">Nenhuma solução ainda. Seja o primeiro a contribuir! 🏆</p>
                    </div>
                ) : (
                    solucoes.map((sol, idx) => (
                        <div key={sol.id} className={`kb-solution-card ${idx === 0 && sol.utilidade_score > 0 ? 'best' : ''}`}>
                            <div className="kb-vote-controls">
                                <button
                                    className={`kb-vote-btn ${sol.voto_usuario === 1 ? 'voted-up' : ''}`}
                                    onClick={() => handleVotar(sol.id, 1)}
                                    title="Útil"
                                >▲</button>
                                <span className="kb-vote-score">{sol.utilidade_score}</span>
                                <button
                                    className={`kb-vote-btn ${sol.voto_usuario === -1 ? 'voted-down' : ''}`}
                                    onClick={() => handleVotar(sol.id, -1)}
                                    title="Não ajudou"
                                >▼</button>
                            </div>
                            <div className="kb-solution-body">
                                <div className="kb-solution-content">{sol.conteudo}</div>
                                <div className="kb-solution-meta">
                                    {idx === 0 && sol.utilidade_score > 0 && <span style={{ color: '#16a34a', fontWeight: 600 }}>✅ Melhor Solução · </span>}
                                    por {sol.autor?.nome || 'Anônimo'} · {formatDate(sol.created_at)}
                                </div>
                            </div>
                        </div>
                    ))
                )}

                {showSolucaoModal && (
                    <SolucaoModal
                        artigoId={selectedArtigo.id}
                        onClose={() => setShowSolucaoModal(false)}
                        onSave={() => { setShowSolucaoModal(false); carregarSolucoes(selectedArtigo.id); }}
                    />
                )}
            </div>
        );
    }

    // ========== LIST VIEW ==========
    return (
        <div className="kb-page">
            <div className="kb-header">
                <h1 className="kb-title">Base de Conhecimento</h1>
                <button className="btn-primary" onClick={() => setShowArtigoModal(true)}>
                    <PlusIcon /> Novo Problema
                </button>
            </div>

            <div className="kb-tabs">
                <button className={`kb-tab ${activeTab === 'artigos' ? 'active' : ''}`} onClick={() => setActiveTab('artigos')}>
                    Problemas & Soluções
                </button>
                <button className={`kb-tab ${activeTab === 'ranking' ? 'active' : ''}`} onClick={() => setActiveTab('ranking')}>
                    🏆 Ranking
                </button>
            </div>

            {activeTab === 'artigos' && (
                <>
                    <div className="kb-search">
                        <input
                            type="text"
                            placeholder="Buscar problemas, soluções ou palavras-chave..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>

                    {loading ? (
                        <div className="loading-spinner"><div className="spinner"></div></div>
                    ) : artigos.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon"><BookIcon /></div>
                            <h3 className="empty-title">Nenhum artigo encontrado</h3>
                            <p className="empty-description">Comece registrando um problema para a equipe ajudar a resolver.</p>
                        </div>
                    ) : (
                        artigos.map(artigo => (
                            <div key={artigo.id} className="kb-article-card" onClick={() => handleSelectArtigo(artigo)}>
                                <div className="kb-article-title">{artigo.titulo}</div>
                                <div className="kb-article-desc">{artigo.descricao}</div>
                                <div className="kb-article-meta">
                                    {artigo.categoria && <span className="kb-tag">{artigo.categoria}</span>}
                                    <span>por {artigo.autor?.nome || 'Anônimo'}</span>
                                    <span>{formatDate(artigo.created_at)}</span>
                                </div>
                            </div>
                        ))
                    )}
                </>
            )}

            {activeTab === 'ranking' && (
                <div className="kb-leaderboard">
                    <div className="kb-leaderboard-title">🏅 Ranking dos Técnicos</div>
                    {ranking.length === 0 ? (
                        <div className="empty-state" style={{ padding: '2rem' }}>
                            <p className="empty-description">Nenhuma pontuação registrada ainda.</p>
                        </div>
                    ) : (
                        ranking.map((r, i) => (
                            <div key={r.usuario_id} className="kb-rank-item">
                                <div className={`kb-rank-pos ${getRankClass(i)}`}>{i + 1}º</div>
                                <div className="kb-rank-name">{r.usuario?.nome || 'Técnico'}</div>
                                <div className="kb-rank-score">{r.pontos_totais} pts</div>
                                <div className="kb-rank-contributions">{r.contribuicoes_count} contribuições</div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {showArtigoModal && (
                <ArtigoModal
                    onClose={() => setShowArtigoModal(false)}
                    onSave={() => { setShowArtigoModal(false); carregarArtigos(); }}
                />
            )}
        </div>
    );
}

export default ConhecimentoPage;

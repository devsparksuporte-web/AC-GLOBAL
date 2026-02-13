import { useState, useEffect } from 'react';
import { educacaoService } from '../../services/educacaoService';
import { useAuth } from '../../hooks/useAuth';
import type { Curso, TecnicoStats, ConquistaTecnico, ProgressoTecnico } from '../../types';
import './Educacao.css';

export function EducacaoPage() {
    const { userProfile } = useAuth();
    const [cursos, setCursos] = useState<Curso[]>([]);
    const [stats, setStats] = useState<TecnicoStats | null>(null);
    const [conquistas, setConquistas] = useState<ConquistaTecnico[]>([]);
    const [progresso, _setProgresso] = useState<ProgressoTecnico[]>([]);
    const [loading, setLoading] = useState(true);
    const [_view, _setView] = useState<'catalog' | 'player'>('catalog');
    const [_selectedCurso, _setSelectedCurso] = useState<Curso | null>(null);

    const empresaId = userProfile?.empresa_id || '';
    const perfilId = userProfile?.id || '';

    const carregarDados = async () => {
        if (!empresaId || !perfilId) return;
        setLoading(true);
        try {
            const [cList, s, conqu, prog] = await Promise.all([
                educacaoService.listarCursos(empresaId),
                educacaoService.obterStatsTecnico(perfilId, empresaId),
                educacaoService.listarConquistas(perfilId),
                educacaoService.obterProgressoUsuario(perfilId)
            ]);
            setCursos(cList);
            setStats(s);
            setConquistas(conqu);
            _setProgresso(prog);
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    useEffect(() => { carregarDados(); }, [empresaId, perfilId]);

    const _xpParaProximoNivel = (stats?.nivel || 1) * 1000;
    const progressoXP = stats ? (stats.xp_total % 1000) / 10 : 0;

    if (loading) return <div className="educacao-page"><div className="loading-spinner">Carregando Academia...</div></div>;

    return (
        <div className="educacao-page">
            <header className="educacao-header">
                <h1 className="page-title">Academia de Técnicos</h1>
                <p className="page-subtitle">Aprimore suas habilidades e conquiste novos níveis.</p>
            </header>

            {/* BARRA DE GAMIFICAÇÃO */}
            <div className="gamificacao-bar">
                <div className="stat-card">
                    <div className="stat-icon">🏆</div>
                    <div className="stat-info" style={{ flexGrow: 1 }}>
                        <div className="label">Nível {stats?.nivel}</div>
                        <div className="value">{stats?.xp_total} / {_xpParaProximoNivel} XP</div>
                        <div className="xp-progress-container">
                            <div className="xp-progress-fill" style={{ width: `${progressoXP}%` }}></div>
                        </div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">🎓</div>
                    <div className="stat-info">
                        <div className="label">Cursos Concluídos</div>
                        <div className="value">{stats?.cursos_concluidos}</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">💎</div>
                    <div className="stat-info">
                        <div className="label">Moedas</div>
                        <div className="value">{stats?.moedas_aprendizado}</div>
                    </div>
                </div>
            </div>

            <section className="catalog-section">
                <div className="section-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
                    <h3>Cursos Disponíveis</h3>
                    <div className="filters">
                        <button className="btn-secondary" style={{ fontSize: '0.8rem' }}>Todos</button>
                        <button className="btn-secondary" style={{ fontSize: '0.8rem', marginLeft: '0.5rem' }}>Segurança</button>
                    </div>
                </div>

                <div className="courses-grid">
                    {cursos.length === 0 ? (
                        <div className="empty-state">Nenhum curso disponível no momento.</div>
                    ) : cursos.map(c => (
                        <div key={c.id} className="course-card" onClick={() => { _setSelectedCurso(c); _setView('player'); }}>
                            <div className="course-capa">
                                <span className="course-category">{c.categoria}</span>
                                {c.capa_url ? <img src={c.capa_url} alt={c.titulo} /> : '📚'}
                            </div>
                            <div className="course-content">
                                <h4 className="course-title">{c.titulo}</h4>
                                <p style={{ fontSize: '0.85rem', color: '#64748b', lineClamp: 2, overflow: 'hidden', display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2 }}>{c.descricao}</p>
                                <div className="course-meta">
                                    <span>⏱️ {Math.round(c.carga_horaria / 60)}h</span>
                                    <span className="course-xp">+{c.xp_recompensa} XP</span>
                                    {progresso.find(p => p.aula_id === c.id) && <span style={{ color: '#22c55e' }}>✅</span>}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section className="badges-section">
                <h3>Minhas Conquistas</h3>
                <div className="badges-grid">
                    {/* Exemplo de badges que poderiam ser habilitados conforme conquistas existir */}
                    <div className={`badge-item ${stats?.cursos_concluidos && stats.cursos_concluidos >= 1 ? 'conquistado' : ''}`}>
                        <div className="badge-icon">🎯</div>
                        <div className="badge-name">Primeiro Passo</div>
                    </div>
                    <div className={`badge-item ${stats?.nivel && stats.nivel >= 5 ? 'conquistado' : ''}`}>
                        <div className="badge-icon">🔥</div>
                        <div className="badge-name">Veterano</div>
                    </div>
                    {conquistas.map(conq => (
                        <div key={conq.id} className="badge-item conquistado">
                            <div className="badge-icon">{conq.badge?.icone}</div>
                            <div className="badge-name">{conq.badge?.nome}</div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}

export default EducacaoPage;

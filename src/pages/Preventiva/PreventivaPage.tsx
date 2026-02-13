import { useState, useEffect, type FormEvent } from 'react';
import { preventivaService } from '../../services/preventivaService';
import { clientesService } from '../../services/clientesService';
import { useAuth } from '../../hooks/useAuth';
import type { PlanoManutencao, Cliente } from '../../types';
import '../Clientes/Clientes.css'; // Reusing base styles
import '../Contratos/Contratos.css'; // Reusing layout styles

// Icons
const PlusIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
);

const EditIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
);

const TrashIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>
);

const XIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);

const ClipboardIcon = () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
    </svg>
);

// Form Interface
interface PlanoFormInput {
    titulo: string;
    cliente_id: string;
    equipamento: string;
    localizacao: string;
    frequencia_dias: number;
    proxima_visita: string;
    empresa_id: string;
}

// Modal Form
interface PlanoFormModalProps {
    plano: PlanoManutencao | null;
    clientes: Cliente[];
    empresaId: string;
    onClose: () => void;
    onSave: () => void;
}

function PlanoFormModal({ plano, clientes, empresaId, onClose, onSave }: PlanoFormModalProps) {
    const [formData, setFormData] = useState<PlanoFormInput>({
        titulo: plano?.titulo || '',
        cliente_id: plano?.cliente_id || '',
        equipamento: plano?.equipamento || '',
        localizacao: plano?.localizacao || '',
        frequencia_dias: plano?.frequencia_dias || 30,
        proxima_visita: plano?.proxima_visita || new Date().toISOString().split('T')[0],
        empresa_id: empresaId
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (plano) {
                await preventivaService.atualizarPlano(plano.id, formData);
            } else {
                await preventivaService.criarPlano(formData);
            }
            onSave();
        } catch (err) {
            setError('Erro ao salvar plano de manutenção.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">{plano ? 'Editar Plano PMOC' : 'Novo Plano PMOC'}</h2>
                    <button className="modal-close" onClick={onClose}><XIcon /></button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {error && <div className="error-message">{error}</div>}

                        <div className="form-group">
                            <label className="form-label">Título do Plano *</label>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.titulo}
                                onChange={e => setFormData({ ...formData, titulo: e.target.value })}
                                placeholder="Ex: PMOC - Ar Condicionado Split"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Cliente *</label>
                            <select
                                className="form-select"
                                value={formData.cliente_id}
                                onChange={e => setFormData({ ...formData, cliente_id: e.target.value })}
                                required
                            >
                                <option value="">Selecione um cliente...</option>
                                {clientes.map(c => (
                                    <option key={c.id} value={c.id}>{c.nome}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Equipamento *</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.equipamento}
                                    onChange={e => setFormData({ ...formData, equipamento: e.target.value })}
                                    placeholder="Ex: Split 12000 BTUs"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Localização (Sala/Setor)</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.localizacao}
                                    onChange={e => setFormData({ ...formData, localizacao: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Frequência (Dias)</label>
                                <input
                                    type="number"
                                    min="1"
                                    className="form-input"
                                    value={formData.frequencia_dias}
                                    onChange={e => setFormData({ ...formData, frequencia_dias: parseInt(e.target.value) })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Próxima Visita</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={formData.proxima_visita}
                                    onChange={e => setFormData({ ...formData, proxima_visita: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'Salvando...' : 'Salvar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export function PreventivaPage() {
    const { userProfile } = useAuth();
    const [planos, setPlanos] = useState<PlanoManutencao[]>([]);
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingPlano, setEditingPlano] = useState<PlanoManutencao | null>(null);

    const carregarDados = async () => {
        if (!userProfile?.empresa_id) return;

        try {
            setLoading(true);
            const [planosData, clientesData] = await Promise.all([
                preventivaService.listarPlanos(userProfile.empresa_id),
                clientesService.listar()
            ]);
            setPlanos(planosData);
            setClientes(clientesData);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        carregarDados();
    }, [userProfile?.empresa_id]);

    const handleNovo = () => {
        setEditingPlano(null);
        setShowModal(true);
    };

    const handleEdit = (plano: PlanoManutencao) => {
        setEditingPlano(plano);
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Tem certeza que deseja excluir este plano?')) {
            try {
                await preventivaService.excluirPlano(id);
                carregarDados();
            } catch (error) {
                console.error('Erro ao excluir:', error);
            }
        }
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('pt-BR');
    };

    return (
        <div className="contratos-page"> {/* Using same layout class */}
            <div className="contratos-header">
                <h1 className="contratos-title">Manutenção Preventiva (PMOC)</h1>
                <button className="btn-primary" onClick={handleNovo}>
                    <PlusIcon /> Novo Plano
                </button>
            </div>

            {loading ? (
                <div className="loading-spinner"><div className="spinner"></div></div>
            ) : planos.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon"><ClipboardIcon /></div>
                    <h3 className="empty-title">Nenhum plano PMOC encontrado</h3>
                    <p className="empty-description">Crie planos de manutenção recorrente para seus clientes.</p>
                </div>
            ) : (
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Título/Equipamento</th>
                                <th>Cliente</th>
                                <th>Frequência</th>
                                <th>Última Visita</th>
                                <th>Próxima Visita</th>
                                <th>Status</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {planos.map(plano => (
                                <tr key={plano.id}>
                                    <td>
                                        <div className="table-name">{plano.titulo}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#666' }}>{plano.equipamento} - {plano.localizacao}</div>
                                    </td>
                                    <td>{plano.cliente?.nome}</td>
                                    <td>A cada {plano.frequencia_dias} dias</td>
                                    <td>{formatDate(plano.ultima_visita || '')}</td>
                                    <td>{formatDate(plano.proxima_visita || '')}</td>
                                    <td>
                                        <span className={plano.ativo ? 'badge-ativo' : 'badge-inativo'}>
                                            {plano.ativo ? 'Ativo' : 'Inativo'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="table-actions">
                                            <button className="btn-icon" onClick={() => handleEdit(plano)}><EditIcon /></button>
                                            <button className="btn-icon danger" onClick={() => handleDelete(plano.id)}><TrashIcon /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showModal && userProfile?.empresa_id && (
                <PlanoFormModal
                    plano={editingPlano}
                    clientes={clientes}
                    empresaId={userProfile.empresa_id}
                    onClose={() => setShowModal(false)}
                    onSave={() => { setShowModal(false); carregarDados(); }}
                />
            )}
        </div>
    );
}

export default PreventivaPage;

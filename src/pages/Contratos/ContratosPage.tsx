import { useState, useEffect, type FormEvent } from 'react';
import { contratosService, type ContratoInput } from '../../services/contratosService';
import { clientesService } from '../../services/clientesService';
import type { Contrato, Cliente } from '../../types';
import '../Clientes/Clientes.css'; // Reutilizando estilos base
import './Contratos.css';

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

const FileTextIcon = () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <polyline points="10 9 9 9 8 9"></polyline>
    </svg>
);

// Modal Form
interface ContratoFormModalProps {
    contrato: Contrato | null;
    clientes: Cliente[];
    onClose: () => void;
    onSave: () => void;
}

function ContratoFormModal({ contrato, clientes, onClose, onSave }: ContratoFormModalProps) {
    const [formData, setFormData] = useState<ContratoInput>({
        nome: contrato?.nome || '',
        cliente_id: contrato?.cliente_id || '',
        valor: contrato?.valor || 0,
        dia_vencimento: contrato?.dia_vencimento || 5,
        data_inicio: contrato?.data_inicio || new Date().toISOString().split('T')[0],
        data_fim: contrato?.data_fim || '',
        descricao: contrato?.descricao || '',
        ativo: contrato?.ativo ?? true
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (contrato) {
                await contratosService.atualizar(contrato.id, formData);
            } else {
                await contratosService.criar(formData);
            }
            onSave();
        } catch (err) {
            setError('Erro ao salvar contrato.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">{contrato ? 'Editar Contrato' : 'Novo Contrato'}</h2>
                    <button className="modal-close" onClick={onClose}><XIcon /></button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {error && <div className="error-message">{error}</div>}

                        <div className="form-group">
                            <label className="form-label">Nome do Contrato *</label>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.nome}
                                onChange={e => setFormData({ ...formData, nome: e.target.value })}
                                placeholder="Ex: Manutenção Mensal - Sede"
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
                                <label className="form-label">Valor Mensal (R$)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="form-input"
                                    value={formData.valor}
                                    onChange={e => setFormData({ ...formData, valor: parseFloat(e.target.value) })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Dia Vencimento</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="31"
                                    className="form-input"
                                    value={formData.dia_vencimento}
                                    onChange={e => setFormData({ ...formData, dia_vencimento: parseInt(e.target.value) })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Data Início</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={formData.data_inicio}
                                    onChange={e => setFormData({ ...formData, data_inicio: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Data Fim (Opcional)</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={formData.data_fim || ''}
                                    onChange={e => setFormData({ ...formData, data_fim: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Descrição / Observações</label>
                            <textarea
                                className="form-input"
                                value={formData.descricao || ''}
                                onChange={e => setFormData({ ...formData, descricao: e.target.value })}
                                rows={3}
                            />
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

export function ContratosPage() {
    const [contratos, setContratos] = useState<Contrato[]>([]);
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingContrato, setEditingContrato] = useState<Contrato | null>(null);

    const carregarDados = async () => {
        try {
            setLoading(true);
            const [contratosData, clientesData] = await Promise.all([
                contratosService.listar(),
                clientesService.listar()
            ]);
            setContratos(contratosData);
            setClientes(clientesData);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        carregarDados();
    }, []);

    const handleNovo = () => {
        setEditingContrato(null);
        setShowModal(true);
    };

    const handleEdit = (contrato: Contrato) => {
        setEditingContrato(contrato);
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Tem certeza que deseja excluir este contrato?')) {
            try {
                await contratosService.excluir(id);
                carregarDados();
            } catch (error) {
                console.error('Erro ao excluir:', error);
            }
        }
    };

    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    return (
        <div className="contratos-page">
            <div className="contratos-header">
                <h1 className="contratos-title">Contratos</h1>
                <button className="btn-primary" onClick={handleNovo}>
                    <PlusIcon /> Novo Contrato
                </button>
            </div>

            {loading ? (
                <div className="loading-spinner"><div className="spinner"></div></div>
            ) : contratos.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon"><FileTextIcon /></div>
                    <h3 className="empty-title">Nenhum contrato encontrado</h3>
                    <p className="empty-description">Cadastre contratos de manutenção recorrente.</p>
                </div>
            ) : (
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Nome</th>
                                <th>Cliente</th>
                                <th>Valor</th>
                                <th>Vencimento</th>
                                <th>Status</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {contratos.map(contrato => (
                                <tr key={contrato.id}>
                                    <td>
                                        <div className="table-name">{contrato.nome}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#666' }}>{contrato.descricao}</div>
                                    </td>
                                    <td>{contrato.cliente?.nome}</td>
                                    <td>{formatCurrency(contrato.valor)}</td>
                                    <td>Dia {contrato.dia_vencimento}</td>
                                    <td>
                                        <span className={contrato.ativo ? 'badge-ativo' : 'badge-inativo'}>
                                            {contrato.ativo ? 'Ativo' : 'Inativo'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="table-actions">
                                            <button className="btn-icon" onClick={() => handleEdit(contrato)}><EditIcon /></button>
                                            <button className="btn-icon danger" onClick={() => handleDelete(contrato.id)}><TrashIcon /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showModal && (
                <ContratoFormModal
                    contrato={editingContrato}
                    clientes={clientes}
                    onClose={() => setShowModal(false)}
                    onSave={() => { setShowModal(false); carregarDados(); }}
                />
            )}
        </div>
    );
}

export default ContratosPage;

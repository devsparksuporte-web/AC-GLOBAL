import { useState, useEffect, type FormEvent } from 'react';
import { faturamentoService } from '../../services/faturamentoService';
import { clientesService } from '../../services/clientesService';
import { useAuth } from '../../hooks/useAuth';
import type { Fatura, Cliente } from '../../types';
import '../Clientes/Clientes.css';
import '../Contratos/Contratos.css';

// Icons
const PlusIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
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

const DollarSignIcon = () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23"></line>
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
    </svg>
);

// Form Interface
interface FaturaFormInput {
    descricao: string;
    cliente_id: string;
    valor: number;
    data_vencimento: string;
    status: Fatura['status'];
    empresa_id: string;
}

// Modal Form
interface FaturaFormModalProps {
    clientes: Cliente[];
    empresaId: string;
    onClose: () => void;
    onSave: () => void;
}

function FaturaFormModal({ clientes, empresaId, onClose, onSave }: FaturaFormModalProps) {
    const [formData, setFormData] = useState<FaturaFormInput>({
        descricao: '',
        cliente_id: '',
        valor: 0,
        data_vencimento: new Date().toISOString().split('T')[0],
        status: 'pendente',
        empresa_id: empresaId
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await faturamentoService.criarFatura(formData);
            onSave();
        } catch (err) {
            setError('Erro ao criar fatura.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">Nova Fatura</h2>
                    <button className="modal-close" onClick={onClose}><XIcon /></button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {error && <div className="error-message">{error}</div>}

                        <div className="form-group">
                            <label className="form-label">Descrição *</label>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.descricao}
                                onChange={e => setFormData({ ...formData, descricao: e.target.value })}
                                placeholder="Ex: Manutenção Mensal - Maio/2026"
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
                                <label className="form-label">Valor (R$)</label>
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
                                <label className="form-label">Vencimento</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={formData.data_vencimento}
                                    onChange={e => setFormData({ ...formData, data_vencimento: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Status Inicial</label>
                            <select
                                className="form-select"
                                value={formData.status}
                                onChange={e => setFormData({ ...formData, status: e.target.value as Fatura['status'] })}
                            >
                                <option value="pendente">Pendente</option>
                                <option value="pago">Pago</option>
                            </select>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'Criar Fatura' : 'Criar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export function FaturamentoPage() {
    const { userProfile } = useAuth();
    const [faturas, setFaturas] = useState<Fatura[]>([]);
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    const carregarDados = async () => {
        if (!userProfile?.empresa_id) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const [faturasData, clientesData] = await Promise.all([
                faturamentoService.listarFaturas(userProfile.empresa_id),
                clientesService.listar()
            ]);
            setFaturas(faturasData);
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
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Tem certeza que deseja excluir esta fatura?')) {
            try {
                await faturamentoService.excluirFatura(id);
                carregarDados();
            } catch (error) {
                console.error('Erro ao excluir:', error);
            }
        }
    };

    const handleStatusChange = async (id: string, novoStatus: Fatura['status']) => {
        try {
            await faturamentoService.atualizarStatusFatura(id, novoStatus);
            carregarDados();
        } catch (error) {
            console.error('Erro ao atualizar status:', error);
        }
    };

    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    const formatDate = (dateStr: string) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('pt-BR');
    };



    // Inline styles for badges if not in CSS
    const getBadgeStyle = (status: string) => {
        switch (status) {
            case 'pago': return { backgroundColor: '#dcfce7', color: '#166534', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '500' };
            case 'pendente': return { backgroundColor: '#fef9c3', color: '#854d0e', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '500' };
            case 'atrasado': return { backgroundColor: '#fee2e2', color: '#991b1b', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '500' };
            case 'cancelado': return { backgroundColor: '#f1f5f9', color: '#64748b', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '500' };
            default: return {};
        }
    };

    return (
        <div className="contratos-page">
            <div className="contratos-header">
                <h1 className="contratos-title">Faturamento</h1>
                <button className="btn-primary" onClick={handleNovo}>
                    <PlusIcon /> Nova Fatura
                </button>
            </div>

            {loading ? (
                <div className="loading-spinner"><div className="spinner"></div></div>
            ) : faturas.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon"><DollarSignIcon /></div>
                    <h3 className="empty-title">Nenhuma fatura encontrada</h3>
                    <p className="empty-description">Gerencie as cobranças dos seus serviços e contratos.</p>
                </div>
            ) : (
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Descrição</th>
                                <th>Cliente</th>
                                <th>Valor</th>
                                <th>Vencimento</th>
                                <th>Pagamento</th>
                                <th>Status</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {faturas.map(fatura => (
                                <tr key={fatura.id}>
                                    <td>
                                        <div className="table-name">{fatura.descricao}</div>
                                        {fatura.contrato?.nome && (
                                            <div style={{ fontSize: '0.8rem', color: '#666' }}>Contrato: {fatura.contrato.nome}</div>
                                        )}
                                    </td>
                                    <td>{fatura.cliente?.nome}</td>
                                    <td>{formatCurrency(fatura.valor)}</td>
                                    <td>{formatDate(fatura.data_vencimento)}</td>
                                    <td>{formatDate(fatura.data_pagamento || '')}</td>
                                    <td>
                                        <span style={getBadgeStyle(fatura.status)}>
                                            {fatura.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="table-actions">
                                            {fatura.status === 'pendente' && (
                                                <button
                                                    className="btn-icon"
                                                    title="Marcar como Pago"
                                                    onClick={() => handleStatusChange(fatura.id, 'pago')}
                                                    style={{ color: '#166534' }}
                                                >
                                                    ✓
                                                </button>
                                            )}
                                            <button className="btn-icon danger" onClick={() => handleDelete(fatura.id)}><TrashIcon /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showModal && userProfile?.empresa_id && (
                <FaturaFormModal
                    clientes={clientes}
                    empresaId={userProfile.empresa_id}
                    onClose={() => setShowModal(false)}
                    onSave={() => { setShowModal(false); carregarDados(); }}
                />
            )}
        </div>
    );
}

export default FaturamentoPage;

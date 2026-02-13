import { useState, useEffect, type FormEvent } from 'react';
import { orcamentosService } from '../../services/orcamentosService';
import { useAuth } from '../../hooks/useAuth';
import { clientesService } from '../../services/clientesService';
import { estoqueService } from '../../services/estoqueService';
import type { Orcamento, Cliente, StatusOrcamento, ItemOrcamento, EstoqueItem } from '../../types';
import '../Clientes/Clientes.css';
import '../Ordens/Ordens.css';

// Icons
const EditIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
        <path d="M18.5 2.5a2.121 2 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
);

const XIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);

const DollarIcon = () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23"></line>
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
    </svg>
);

interface OrcamentoModalProps {
    orcamento: Orcamento | null;
    clientes: Cliente[];
    onClose: () => void;
    onSave: () => void;
}

function OrcamentoModal({ orcamento, clientes, onClose, onSave }: OrcamentoModalProps) {
    const [formData, setFormData] = useState({
        cliente_id: orcamento?.cliente_id || '',
        valor: orcamento?.valor || 0,
        descricao: orcamento?.descricao || '',
        equipamento: orcamento?.equipamento || '',
        data_inicio: orcamento?.data_inicio || '',
        data_fim: orcamento?.data_fim || '',
        status: orcamento?.status || 'pendente' as StatusOrcamento,
        observacoes: orcamento?.observacoes || '',
    });
    const [items, setItems] = useState<ItemOrcamento[]>([]);
    const [inventory, setInventory] = useState<EstoqueItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingItems, setLoadingItems] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadModalData = async () => {
            setLoadingItems(true);
            try {
                const [invData, itemsData] = await Promise.all([
                    estoqueService.listar(),
                    orcamento ? orcamentosService.listarItens(orcamento.id) : Promise.resolve([])
                ]);
                setInventory(invData);
                setItems(itemsData);
            } catch (err) {
                console.error('Erro ao carregar dados do modal:', err);
            } finally {
                setLoadingItems(false);
            }
        };
        loadModalData();
    }, [orcamento]);

    // Calcular total automaticamente quando itens mudam
    useEffect(() => {
        const totalItems = items.reduce((sum, item) => sum + (Number(item.preco_unitario) * Number(item.quantidade)), 0);
        if (totalItems > 0) {
            setFormData(prev => ({ ...prev, valor: totalItems }));
        }
    }, [items]);

    const handleAddItem = async (stockItem: EstoqueItem) => {
        try {
            const newItem = {
                orcamento_id: orcamento?.id || 'temp', // Id temporário se for novo orçamento
                item_id: stockItem.id,
                nome: stockItem.nome,
                quantidade: 1,
                preco_unitario: stockItem.preco_venda || stockItem.preco_unitario,
            };

            if (orcamento) {
                // Se o orçamento já existe, salvar no banco imediatamente
                const saved = await orcamentosService.adicionarItem(newItem as any);
                setItems([...items, saved]);
            } else {
                // Se for novo orçamento, manter apenas em memória (precisará de lógica de salvamento em lote posterior ou criar o orçamento primeiro)
                // Por simplicidade, vamos sugerir criar o orçamento e depois adicionar itens, ou salvar tudo no final.
                // Ajuste: Vamos permitir adicionar em memória para novos orçamentos.
                setItems([...items, { ...newItem, id: Math.random().toString(), total: newItem.quantidade * newItem.preco_unitario } as any]);
            }
        } catch (err) {
            console.error('Erro ao adicionar item:', err);
        }
    };

    const handleRemoveItem = async (itemId: string) => {
        try {
            if (orcamento && !itemId.startsWith('0.')) {
                await orcamentosService.removerItem(itemId);
            }
            setItems(items.filter(i => i.id !== itemId));
        } catch (err) {
            console.error('Erro ao remover item:', err);
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!formData.cliente_id) {
            setError('Selecione um cliente');
            return;
        }

        setLoading(true);
        setError('');

        try {
            let savedOrcamento: Orcamento;
            if (orcamento) {
                savedOrcamento = await orcamentosService.atualizar(orcamento.id, formData);
            } else {
                savedOrcamento = await orcamentosService.criar(formData);
                // Salvar itens que estavam em memória
                if (items.length > 0) {
                    await Promise.all(items.map(item =>
                        orcamentosService.adicionarItem({
                            orcamento_id: savedOrcamento.id,
                            item_id: item.item_id,
                            nome: item.nome,
                            quantidade: item.quantidade,
                            preco_unitario: item.preco_unitario
                        })
                    ));
                }
            }
            onSave();
        } catch (err) {
            console.error('Erro ao salvar orçamento:', err);
            setError('Erro ao salvar orçamento. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const selectedCliente = clientes.find(c => c.id === formData.cliente_id) || orcamento?.cliente;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">
                        {orcamento ? 'Editar Orçamento' : 'Novo Orçamento'}
                    </h2>
                    <button className="modal-close" onClick={onClose}>
                        <XIcon />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {error && <div className="error-message" style={{ marginBottom: '1rem' }}>{error}</div>}

                        <div className="form-group">
                            <label className="form-label">Cliente *</label>
                            <select
                                className="form-input"
                                value={formData.cliente_id}
                                onChange={e => setFormData({ ...formData, cliente_id: e.target.value })}
                                disabled={loading || !!orcamento}
                                required
                            >
                                <option value="">Selecione um cliente</option>
                                {clientes.map(cliente => (
                                    <option key={cliente.id} value={cliente.id}>{cliente.nome}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Equipamento</label>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.equipamento}
                                onChange={e => setFormData({ ...formData, equipamento: e.target.value })}
                                placeholder="Ex: Split 12000 BTUs LG"
                                disabled={loading}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">O que vai fazer (Serviço)</label>
                            <textarea
                                className="form-input"
                                value={formData.descricao}
                                onChange={e => setFormData({ ...formData, descricao: e.target.value })}
                                placeholder="Descrição do serviço..."
                                disabled={loading}
                                rows={3}
                                required
                            />
                        </div>

                        <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="form-group">
                                <label className="form-label">Data Início</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={formData.data_inicio}
                                    onChange={e => setFormData({ ...formData, data_inicio: e.target.value })}
                                    disabled={loading}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Data Fim</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={formData.data_fim}
                                    onChange={e => setFormData({ ...formData, data_fim: e.target.value })}
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Peças e Materiais (Estoque)</label>
                            {loadingItems ? (
                                <div style={{ fontSize: '0.9rem', color: '#64748b' }}>Carregando catálogo...</div>
                            ) : (
                                <div className="inventory-selector" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                                    <select
                                        className="form-input"
                                        onChange={(e) => {
                                            const item = inventory.find(i => i.id === e.target.value);
                                            if (item) handleAddItem(item);
                                            e.target.value = '';
                                        }}
                                        defaultValue=""
                                    >
                                        <option value="" disabled>+ Adicionar peça do estoque</option>
                                        {inventory.map(item => (
                                            <option key={item.id} value={item.id}>
                                                {item.nome} (Saldo: {item.quantidade} {item.unidade} | R$ {item.preco_venda?.toFixed(2)})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {items.length > 0 && (
                                <div className="budget-items-list" style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                                    {items.map(item => (
                                        <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', paddingBottom: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 600 }}>{item.nome}</div>
                                                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                                    {item.quantidade} x R$ {Number(item.preco_unitario).toFixed(2)}
                                                </div>
                                            </div>
                                            <div style={{ fontWeight: 600, marginRight: '1rem' }}>
                                                R$ {Number(item.total || (item.quantidade * item.preco_unitario)).toFixed(2)}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveItem(item.id)}
                                                style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                                            >
                                                &times;
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="form-row" style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr) 1fr', gap: '1rem' }}>
                            <div className="form-group">
                                <label className="form-label">Preço Total (R$)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="form-input"
                                    value={formData.valor || ''}
                                    onChange={e => setFormData({ ...formData, valor: parseFloat(e.target.value) || 0 })}
                                    placeholder="0,00"
                                    disabled={loading}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Status</label>
                                <select
                                    className="form-input"
                                    value={formData.status}
                                    onChange={e => setFormData({ ...formData, status: e.target.value as StatusOrcamento })}
                                    disabled={loading}
                                >
                                    <option value="pendente">Pendente</option>
                                    <option value="aprovado">Aprovado</option>
                                    <option value="rejeitado">Rejeitado</option>
                                    <option value="concluido">Concluido</option>
                                </select>
                            </div>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '-0.5rem', marginBottom: '1rem' }}>
                            {items.length > 0 ? '✓ Valor calculado auto. pelas peças.' : 'Informe o valor total do serviço.'}
                        </p>

                        <div className="form-group">
                            <label className="form-label">Observações Detalhadas</label>
                            <textarea
                                className="form-input"
                                value={formData.observacoes}
                                onChange={e => setFormData({ ...formData, observacoes: e.target.value })}
                                placeholder="Informações adicionais para o cliente..."
                                disabled={loading}
                                rows={3}
                            />
                        </div>

                        <div className="share-buttons" style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                            <button
                                type="button"
                                className="btn-secondary"
                                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: '#25D366', color: 'white', border: 'none' }}
                                onClick={() => {
                                    const texto = `Olá ${selectedCliente?.nome || ''}, segue o orçamento:\n\n*Serviço:* ${formData.descricao || 'N/A'}\n*Equipamento:* ${formData.equipamento || 'N/A'}\n*Data Início:* ${formData.data_inicio || '-'}\n*Data Fim:* ${formData.data_fim || '-'}\n*Valor:* R$ ${formData.valor?.toFixed(2) || '0.00'}\n*Observações:* ${formData.observacoes || '-'}\n\nFicamos no aguardo da aprovação!`;
                                    window.open(`https://wa.me/${selectedCliente?.telefone?.replace(/\D/g, '')}?text=${encodeURIComponent(texto)}`, '_blank');
                                }}
                            >
                                WhatsApp
                            </button>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'Salvando...' : 'Salvar Orçamento'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export function OrcamentosPage() {
    const { userProfile } = useAuth();
    const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrcamento, setSelectedOrcamento] = useState<Orcamento | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);

    const carregarDados = async () => {
        try {
            setLoading(true);
            const [orcamentosData, clientesData] = await Promise.all([
                orcamentosService.listar(),
                clientesService.listar(),
            ]);
            setOrcamentos(orcamentosData);
            setClientes(clientesData);
        } catch (error) {
            console.error('Erro ao carregar orçamentos:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        carregarDados();
    }, []);

    if (userProfile?.role === 'tecnico') {
        return <div className="p-8">Acesso restrito a administradores.</div>;
    }

    return (
        <div className="ordens-page">
            <div className="page-header">
                <h1 className="page-title">Gestão de Orçamentos</h1>
                <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
                    Novo Orçamento
                </button>
            </div>

            {loading ? (
                <div className="table-container">
                    <div className="loading-spinner">
                        <div className="spinner"></div>
                    </div>
                </div>
            ) : orcamentos.length === 0 ? (
                <div className="table-container">
                    <div className="empty-state">
                        <div className="empty-icon">
                            <DollarIcon />
                        </div>
                        <h3 className="empty-title">Nenhum orçamento cadastrado</h3>
                        <button className="btn-primary" style={{ marginTop: '1rem' }} onClick={() => setShowCreateModal(true)}>
                            Criar Primeiro Orçamento
                        </button>
                    </div>
                </div>
            ) : (
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Cliente</th>
                                <th>Equipamento</th>
                                <th>Serviço</th>
                                <th>Valor</th>
                                <th>Início/Fim</th>
                                <th>Status</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orcamentos.map(orc => (
                                <tr key={orc.id}>
                                    <td>{orc.cliente?.nome || 'N/A'}</td>
                                    <td>{orc.equipamento}</td>
                                    <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {orc.descricao}
                                    </td>
                                    <td style={{ fontWeight: 600, color: '#059669' }}>
                                        R$ {orc.valor?.toFixed(2)}
                                    </td>
                                    <td>
                                        <div style={{ fontSize: '0.85rem' }}>
                                            {orc.data_inicio || '-'} <br />
                                            {orc.data_fim || '-'}
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${orc.status}`}>
                                            {orc.status}
                                        </span>
                                    </td>
                                    <td>
                                        <button
                                            className="btn-icon"
                                            onClick={() => setSelectedOrcamento(orc)}
                                            title="Editar Orçamento"
                                        >
                                            <EditIcon />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {(selectedOrcamento || showCreateModal) && (
                <OrcamentoModal
                    orcamento={selectedOrcamento}
                    clientes={clientes}
                    onClose={() => {
                        setSelectedOrcamento(null);
                        setShowCreateModal(false);
                    }}
                    onSave={() => {
                        setSelectedOrcamento(null);
                        setShowCreateModal(false);
                        carregarDados();
                    }}
                />
            )}
        </div>
    );
}

export default OrcamentosPage;

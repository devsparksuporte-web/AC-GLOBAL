import { useState, useEffect } from 'react';
import { fornecedoresService } from '../../services/fornecedoresService';
import { useAuth } from '../../hooks/useAuth';
import type { Fornecedor, PedidoCompra, ItemPedidoCompra } from '../../types';
import '../Clientes/Clientes.css'; // Reutilizando os estilos de tabela e modal
import './Fornecedores.css';

export default function FornecedoresPage() {
    const { userProfile } = useAuth();
    const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingFornecedor, setEditingFornecedor] = useState<Partial<Fornecedor> | null>(null);
    const [selectedFornecedor, setSelectedFornecedor] = useState<Fornecedor | null>(null);
    const [pedidos, setPedidos] = useState<PedidoCompra[]>([]);
    const [showPedidoModal, setShowPedidoModal] = useState(false);
    const [newPedido, setNewPedido] = useState<Partial<PedidoCompra> | null>(null);
    const [pedidoItems, setPedidoItems] = useState<Partial<ItemPedidoCompra>[]>([]);

    const carregarFornecedores = async () => {
        try {
            setLoading(true);
            const data = await fornecedoresService.listar();
            setFornecedores(data);
        } catch (error) {
            console.error('Erro ao carregar fornecedores:', error);
        } finally {
            setLoading(false);
        }
    };

    const carregarPedidos = async (fornecedorId: string) => {
        try {
            const data = await fornecedoresService.listarPedidos(fornecedorId);
            setPedidos(data);
        } catch (error) {
            console.error('Erro ao carregar pedidos:', error);
        }
    };

    useEffect(() => {
        carregarFornecedores();
    }, []);

    const handleSalvarFornecedor = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingFornecedor?.nome) return;

        try {
            if (editingFornecedor.id) {
                await fornecedoresService.atualizar(editingFornecedor.id, editingFornecedor);
            } else {
                await fornecedoresService.criar(editingFornecedor as any);
            }
            setShowModal(false);
            carregarFornecedores();
        } catch (error) {
            console.error('Erro ao salvar fornecedor:', error);
            alert('Erro ao salvar fornecedor');
        }
    };

    const handleSalvarPedido = async () => {
        if (!selectedFornecedor || pedidoItems.length === 0) return;

        try {
            const pedido = await fornecedoresService.criarPedido({
                fornecedor_id: selectedFornecedor.id,
                status: 'pendente',
                valor_total: 0,
                observacoes: newPedido?.observacoes || ''
            });

            await Promise.all(pedidoItems.map(item =>
                fornecedoresService.adicionarItemPedido({
                    pedido_id: pedido.id,
                    nome: item.nome || '',
                    quantidade: item.quantidade || 0,
                    preco_unitario: item.preco_unitario || 0
                })
            ));

            setShowPedidoModal(false);
            setPedidoItems([]);
            carregarPedidos(selectedFornecedor.id);
        } catch (error) {
            console.error('Erro ao salvar pedido:', error);
            alert('Erro ao salvar pedido');
        }
    };

    const handleWhatsAppShare = (pedido: PedidoCompra, items: ItemPedidoCompra[]) => {
        const empresa = userProfile?.empresa?.nome || 'AC Global';
        let mensagem = `*PEDIDO DE COMPRA - ${empresa}*\n\n`;
        mensagem += `*Fornecedor:* ${pedido.fornecedor?.nome}\n`;
        mensagem += `*Data:* ${new Date(pedido.created_at).toLocaleDateString()}\n\n`;
        mensagem += `*Itens:*\n`;

        items.forEach(item => {
            mensagem += `- ${item.nome}: ${item.quantidade} x R$ ${item.preco_unitario.toFixed(2)} = R$ ${item.total.toFixed(2)}\n`;
        });

        mensagem += `\n*VALOR TOTAL:* R$ ${pedido.valor_total.toFixed(2)}\n`;
        if (pedido.observacoes) mensagem += `\n*Obs:* ${pedido.observacoes}`;

        const url = `https://wa.me/${pedido.fornecedor?.telefone?.replace(/\D/g, '')}?text=${encodeURIComponent(mensagem)}`;
        window.open(url, '_blank');
    };

    return (
        <div className="clientes-page"> {/* Usando classes de Clientes.css */}
            <div className="page-header">
                <h1 className="page-title">Fornecedores</h1>
                <button className="btn-primary" onClick={() => { setEditingFornecedor({}); setShowModal(true); }}>
                    + Novo Fornecedor
                </button>
            </div>

            {loading ? (
                <div className="loading">Carregando fornecedores...</div>
            ) : (
                <div className="table-container shadow-premium">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Nome</th>
                                <th>Contato</th>
                                <th>Localização</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {fornecedores.map(f => (
                                <tr key={f.id} onClick={() => { setSelectedFornecedor(f); carregarPedidos(f.id); }} style={{ cursor: 'pointer' }}>
                                    <td>
                                        <div style={{ fontWeight: 600 }}>{f.nome}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{f.cnpj || 'Sem CNPJ'}</div>
                                    </td>
                                    <td>
                                        <div>{f.telefone || 'Sem telefone'}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{f.email}</div>
                                    </td>
                                    <td>{f.cidade} / {f.estado}</td>
                                    <td>
                                        <button className="btn-icon" onClick={(e) => { e.stopPropagation(); setEditingFornecedor(f); setShowModal(true); }}>✏️</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {selectedFornecedor && (
                <div className="details-section shadow-premium" style={{ marginTop: '2rem', background: 'white', padding: '1.5rem', borderRadius: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h2>Histórico de Pedidos: {selectedFornecedor.nome}</h2>
                        <button className="btn-primary" onClick={() => setShowPedidoModal(true)}>+ Novo Pedido</button>
                    </div>

                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Status</th>
                                <th>Valor Total</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pedidos.map(p => (
                                <tr key={p.id}>
                                    <td>{new Date(p.created_at).toLocaleDateString()}</td>
                                    <td>
                                        <span className={`status-badge status-${p.status}`}>
                                            {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                                        </span>
                                    </td>
                                    <td>R$ {p.valor_total.toFixed(2)}</td>
                                    <td>
                                        <button className="btn-icon" title="WhatsApp" onClick={async () => {
                                            const items = await fornecedoresService.listarItensPedido(p.id);
                                            handleWhatsAppShare(p, items);
                                        }}>📱</button>
                                        <button className="btn-icon" title="Imprimir/PDF" onClick={() => window.print()}>PDF</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal Fornecedor */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2 className="modal-title">{editingFornecedor?.id ? 'Editar Fornecedor' : 'Novo Fornecedor'}</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleSalvarFornecedor}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Nome Fantasia</label>
                                    <input className="form-input" value={editingFornecedor?.nome || ''} onChange={e => setEditingFornecedor({ ...editingFornecedor, nome: e.target.value })} required />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">CNPJ</label>
                                        <input className="form-input" value={editingFornecedor?.cnpj || ''} onChange={e => setEditingFornecedor({ ...editingFornecedor, cnpj: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Telefone (WhatsApp)</label>
                                        <input className="form-input" value={editingFornecedor?.telefone || ''} onChange={e => setEditingFornecedor({ ...editingFornecedor, telefone: e.target.value })} />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">E-mail</label>
                                    <input className="form-input" type="email" value={editingFornecedor?.email || ''} onChange={e => setEditingFornecedor({ ...editingFornecedor, email: e.target.value })} />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                                <button type="submit" className="btn-primary">Salvar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Pedido */}
            {showPedidoModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '600px' }}>
                        <div className="modal-header">
                            <h2 className="modal-title">Novo Pedido para {selectedFornecedor?.nome}</h2>
                            <button className="modal-close" onClick={() => setShowPedidoModal(false)}>&times;</button>
                        </div>
                        <div className="modal-body">
                            <div className="pedido-items-manager">
                                <h3>Itens do Pedido</h3>
                                <div className="add-item-row" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '0.5rem', marginBottom: '1rem' }}>
                                    <input className="form-input" placeholder="Produto" id="new-item-nome" />
                                    <input className="form-input" type="number" placeholder="Qtd" id="new-item-qtd" />
                                    <input className="form-input" type="number" placeholder="R$ Unit" id="new-item-preco" />
                                    <button className="btn-primary" onClick={() => {
                                        const nome = (document.getElementById('new-item-nome') as HTMLInputElement).value;
                                        const qtd = Number((document.getElementById('new-item-qtd') as HTMLInputElement).value);
                                        const preco = Number((document.getElementById('new-item-preco') as HTMLInputElement).value);
                                        if (nome && qtd > 0) {
                                            setPedidoItems([...pedidoItems, { nome, quantidade: qtd, preco_unitario: preco }]);
                                            (document.getElementById('new-item-nome') as HTMLInputElement).value = '';
                                            (document.getElementById('new-item-qtd') as HTMLInputElement).value = '';
                                            (document.getElementById('new-item-preco') as HTMLInputElement).value = '';
                                        }
                                    }}>+</button>
                                </div>

                                <ul className="pedido-list" style={{ listStyle: 'none', padding: 0 }}>
                                    {pedidoItems.map((item, idx) => (
                                        <li key={idx} style={{ padding: '0.5rem', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
                                            <span>{item.quantidade}x {item.nome} - R$ {((item.quantidade || 0) * (item.preco_unitario || 0)).toFixed(2)}</span>
                                            <button style={{ color: 'red', border: 'none', background: 'none' }} onClick={() => setPedidoItems(pedidoItems.filter((_, i) => i !== idx))}>Remover</button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="form-group" style={{ marginTop: '1rem' }}>
                                <label className="form-label">Observações</label>
                                <textarea className="form-input" value={newPedido?.observacoes || ''} onChange={e => setNewPedido({ ...newPedido, observacoes: e.target.value })} />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={() => setShowPedidoModal(false)}>Cancelar</button>
                            <button className="btn-primary" onClick={handleSalvarPedido}>Enviar Pedido</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

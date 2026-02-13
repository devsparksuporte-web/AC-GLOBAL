import { useState, useEffect } from 'react';
import { estoqueService } from '../../services/estoqueService';
import type { EstoqueItem } from '../../types';
import '../Clientes/Clientes.css';
import './Estoque.css';

export default function EstoquePage() {
    const [itens, setItens] = useState<EstoqueItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState<Partial<EstoqueItem> | null>(null);
    const [movModal, setMovModal] = useState<EstoqueItem | null>(null);
    const [movQuantidade, setMovQuantidade] = useState<number>(0);
    const [movTipo, setMovTipo] = useState<'entrada' | 'saida'>('entrada');

    const carregarItens = async () => {
        try {
            setLoading(true);
            const data = await estoqueService.listar();
            setItens(data);
        } catch (error) {
            console.error('Erro ao carregar estoque:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        carregarItens();
    }, []);

    const handleSalvarItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingItem?.nome) return;

        try {
            if (editingItem.id) {
                await estoqueService.atualizar(editingItem.id, editingItem);
            } else {
                await estoqueService.criar(editingItem as any);
            }
            setShowModal(false);
            carregarItens();
        } catch (error: any) {
            console.error('Erro detalhado ao salvar:', error);
            alert(`Erro ao salvar item: ${error.message || 'Erro desconhecido'}`);
        }
    };

    const handleMovimentacao = async () => {
        if (!movModal || movQuantidade <= 0) return;

        try {
            await estoqueService.registrarMovimentacao({
                item_id: movModal.id,
                tipo: movTipo,
                quantidade: movQuantidade,
                motivo: movTipo === 'entrada' ? 'Entrada Manual' : 'Saída Manual'
            });
            setMovModal(null);
            setMovQuantidade(0);
            carregarItens();
        } catch (error: any) {
            console.error('Erro detalhado na movimentação:', error);
            alert(`Erro ao registrar movimentação: ${error.message || 'Erro desconhecido'}`);
        }
    };

    return (
        <div className="estoque-page">
            <div className="page-header">
                <h1 className="page-title">Controle de Estoque</h1>
                <button className="btn-primary" onClick={() => { setEditingItem({}); setShowModal(true); }}>
                    + Novo Item
                </button>
            </div>

            {loading ? (
                <div className="loading">Carregando estoque...</div>
            ) : (
                <div className="estoque-grid">
                    {itens.map(item => (
                        <div key={item.id} className={`estoque-card ${item.quantidade <= item.quantidade_minima ? 'low-stock' : ''}`}>
                            <div className="item-info">
                                <h3>{item.nome}</h3>
                                <p>{item.descricao || 'Sem descrição'}</p>

                                <div className="item-stats">
                                    <div className="stat">
                                        <span className="label">Custo</span>
                                        <span className="value">R$ {item.preco_unitario.toFixed(2)}</span>
                                    </div>
                                    <div className="stat">
                                        <span className="label">Venda</span>
                                        <span className="value" style={{ color: '#2563eb' }}>R$ {(item.preco_venda || 0).toFixed(2)}</span>
                                    </div>
                                </div>

                                <div className="item-stats" style={{ marginTop: '0.5rem', borderTop: '1px dashed #eee', paddingTop: '0.5rem' }}>
                                    <div className="stat">
                                        <span className="label">Qtd Total</span>
                                        <span className="value">{item.quantidade} {item.unidade}</span>
                                    </div>
                                    <div className="stat">
                                        <span className="label">Qtd Mínima</span>
                                        <span className="value" style={{ color: item.quantidade <= item.quantidade_minima ? '#ef4444' : 'inherit' }}>
                                            {item.quantidade_minima} {item.unidade}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="item-actions">
                                <button className="btn-secondary btn-sm" onClick={() => setMovModal(item)}>Movimentar</button>
                                <button className="btn-icon" onClick={() => { setEditingItem(item); setShowModal(true); }}>✏️</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal de Item */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2 className="modal-title">{editingItem?.id ? 'Editar Item' : 'Novo Item'}</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}><span style={{ fontSize: '1.5rem' }}>&times;</span></button>
                        </div>
                        <form onSubmit={handleSalvarItem}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Nome do Item</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={editingItem?.nome || ''}
                                        onChange={e => setEditingItem({ ...editingItem, nome: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Unidade</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={editingItem?.unidade || 'un'}
                                            onChange={e => setEditingItem({ ...editingItem, unidade: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Estoque Mínimo</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            value={editingItem?.quantidade_minima || 0}
                                            onChange={e => setEditingItem({ ...editingItem, quantidade_minima: Number(e.target.value) })}
                                        />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Preço de Custo (Unit.)</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            step="0.01"
                                            value={editingItem?.preco_unitario || 0}
                                            onChange={e => setEditingItem({ ...editingItem, preco_unitario: Number(e.target.value) })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Preço de Venda</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            step="0.01"
                                            value={editingItem?.preco_venda || 0}
                                            onChange={e => setEditingItem({ ...editingItem, preco_venda: Number(e.target.value) })}
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Descrição</label>
                                    <textarea
                                        className="form-input"
                                        value={editingItem?.descricao || ''}
                                        onChange={e => setEditingItem({ ...editingItem, descricao: e.target.value })}
                                    />
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

            {/* Modal de Movimentação */}
            {movModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '400px' }}>
                        <div className="modal-header">
                            <h2 className="modal-title">Movimentar Estoque</h2>
                            <button className="modal-close" onClick={() => setMovModal(null)}><span style={{ fontSize: '1.5rem' }}>&times;</span></button>
                        </div>
                        <div className="modal-body">
                            <p><strong>Item:</strong> {movModal.nome}</p>
                            <p><strong>Saldo Atual:</strong> {movModal.quantidade} {movModal.unidade}</p>

                            <div className="form-group" style={{ marginTop: '1.5rem' }}>
                                <label className="form-label">Tipo de Movimentação</label>
                                <div className="tipo-switch">
                                    <button
                                        type="button"
                                        className={movTipo === 'entrada' ? 'active' : ''}
                                        onClick={() => setMovTipo('entrada')}
                                    >Entrada</button>
                                    <button
                                        type="button"
                                        className={movTipo === 'saida' ? 'active' : ''}
                                        onClick={() => setMovTipo('saida')}
                                    >Saída</button>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Quantidade</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={movQuantidade}
                                    onChange={e => setMovQuantidade(Number(e.target.value))}
                                    min="0.01"
                                    step="0.01"
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={() => setMovModal(null)}>Cancelar</button>
                            <button className="btn-primary" onClick={handleMovimentacao}>Confirmar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

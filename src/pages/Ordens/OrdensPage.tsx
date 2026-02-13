import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ordensService } from '../../services/ordensService';
import { clientesService } from '../../services/clientesService';
import { transparentService } from '../../services/transparentService';
import { useAuth } from '../../hooks/useAuth';
import { BTUCalculator } from '../../components/BTUCalculator/BTUCalculator';
import { SignaturePad } from '../../components/Signature/SignaturePad';
import { estoqueService } from '../../services/estoqueService';
import { adminService } from '../../services/adminService';
import type { OrdemServico, OrdemServicoInput, Cliente, TipoOrdem, StatusOrdem, PrioridadeOrdem, EstoqueItem, UserProfile } from '../../types';
import '../Clientes/Clientes.css';
import './Ordens.css';

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
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
    </svg>
);

const AlertIcon = () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
        <line x1="12" y1="9" x2="12" y2="13"></line>
        <line x1="12" y1="17" x2="12.01" y2="17"></line>
    </svg>
);

const tiposOrdem: { value: TipoOrdem; label: string }[] = [
    { value: 'instalacao', label: 'Instalação' },
    { value: 'manutencao', label: 'Manutenção' },
    { value: 'reparo', label: 'Reparo' },
    { value: 'limpeza', label: 'Limpeza' },
];

const statusOrdem: { value: StatusOrdem; label: string }[] = [
    { value: 'aberta', label: 'Aberta' },
    { value: 'em_andamento', label: 'Em Andamento' },
    { value: 'concluida', label: 'Concluída' },
    { value: 'cancelada', label: 'Cancelada' },
];

const prioridadesOrdem: { value: PrioridadeOrdem; label: string }[] = [
    { value: 'baixa', label: 'Baixa' },
    { value: 'normal', label: 'Normal' },
    { value: 'alta', label: 'Alta' },
    { value: 'urgente', label: 'Urgente' },
];

// Modal de Formulário
interface OrdemFormModalProps {
    ordem: OrdemServico | null;
    clientes: Cliente[];
    tecnicos: UserProfile[];
    onClose: () => void;
    onSave: () => void;
}

function OrdemFormModal({ ordem, clientes, tecnicos, onClose, onSave }: OrdemFormModalProps) {

    const [formData, setFormData] = useState<OrdemServicoInput>({
        cliente_id: ordem?.cliente_id || '',
        tipo: ordem?.tipo || 'manutencao',
        status: ordem?.status || 'aberta',
        prioridade: ordem?.prioridade || 'normal',
        descricao: ordem?.descricao || '',
        equipamento: ordem?.equipamento || '',
        valor: ordem?.valor || undefined,
        data_agendamento: ordem?.data_agendamento?.split('T')[0] || '',
        tecnico_responsavel: ordem?.tecnico_responsavel || '',
        observacoes: ordem?.observacoes || '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!formData.cliente_id) {
            setError('Selecione um cliente');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const dataToSend = {
                ...formData,
                data_agendamento: formData.data_agendamento ? `${formData.data_agendamento}T09:00:00` : undefined,
            };

            if (ordem) {
                await ordensService.atualizar(ordem.id, dataToSend);
            } else {
                await ordensService.criar(dataToSend);
            }
            onSave();
        } catch (err) {
            setError('Erro ao salvar ordem. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">
                        {ordem ? `Editar OS #${ordem.numero}` : 'Nova Ordem de Serviço'}
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
                                disabled={loading}
                            >
                                <option value="">Selecione um cliente</option>
                                {clientes.map(cliente => (
                                    <option key={cliente.id} value={cliente.id}>{cliente.nome}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Tipo</label>
                                <select
                                    className="form-input"
                                    value={formData.tipo}
                                    onChange={e => setFormData({ ...formData, tipo: e.target.value as TipoOrdem })}
                                    disabled={loading}
                                >
                                    {tiposOrdem.map(tipo => (
                                        <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Prioridade</label>
                                <select
                                    className="form-input"
                                    value={formData.prioridade}
                                    onChange={e => setFormData({ ...formData, prioridade: e.target.value as PrioridadeOrdem })}
                                    disabled={loading}
                                >
                                    {prioridadesOrdem.map(p => (
                                        <option key={p.value} value={p.value}>{p.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {ordem && (
                            <div className="form-group">
                                <label className="form-label">Status</label>
                                <select
                                    className="form-input"
                                    value={formData.status}
                                    onChange={e => setFormData({ ...formData, status: e.target.value as StatusOrdem })}
                                    disabled={loading}
                                >
                                    {statusOrdem.map(s => (
                                        <option key={s.value} value={s.value}>{s.label}</option>
                                    ))}
                                </select>
                            </div>
                        )}

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
                            <label className="form-label">Descrição do Serviço</label>
                            <textarea
                                className="form-input"
                                value={formData.descricao}
                                onChange={e => setFormData({ ...formData, descricao: e.target.value })}
                                placeholder="Descreva o serviço a ser realizado..."
                                disabled={loading}
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Data Agendamento</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={formData.data_agendamento}
                                    onChange={e => setFormData({ ...formData, data_agendamento: e.target.value })}
                                    disabled={loading}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Valor (R$)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="form-input"
                                    value={formData.valor || ''}
                                    onChange={e => setFormData({ ...formData, valor: parseFloat(e.target.value) || undefined })}
                                    placeholder="0,00"
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Técnico Responsável *</label>
                            <select
                                className="form-input"
                                value={formData.tecnico_id || ''}
                                onChange={e => setFormData({ ...formData, tecnico_id: e.target.value })}
                                disabled={loading}
                                required
                            >
                                <option value="">Selecione um técnico</option>
                                {tecnicos.map(t => (
                                    <option key={t.id} value={t.id}>{t.nome}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group" style={{ marginTop: '1.5rem' }}>
                            <label className="form-label">Observações</label>
                            <textarea
                                className="form-input"
                                value={formData.observacoes}
                                onChange={e => setFormData({ ...formData, observacoes: e.target.value })}
                                placeholder="Observações adicionais..."
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'Salvando...' : (ordem ? 'Salvar Alterações' : 'Criar Ordem')}
                        </button>
                    </div>
                </form >
            </div >
        </div >
    );
}

// Confirm Dialog
interface ConfirmDialogProps {
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    loading?: boolean;
}

function ConfirmDialog({ title, message, onConfirm, onCancel, loading }: ConfirmDialogProps) {
    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="modal-content" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
                <div className="modal-body">
                    <div className="confirm-dialog">
                        <div className="confirm-icon">
                            <AlertIcon />
                        </div>
                        <h3 className="confirm-title">{title}</h3>
                        <p className="confirm-message">{message}</p>
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="btn-secondary" onClick={onCancel} disabled={loading}>
                        Cancelar
                    </button>
                    <button className="btn-primary btn-danger" onClick={onConfirm} disabled={loading}>
                        {loading ? 'Excluindo...' : 'Excluir'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// Helpers
function formatDate(dateString: string | null): string {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
}

function getStatusLabel(status: StatusOrdem): string {
    return statusOrdem.find(s => s.value === status)?.label || status;
}

function getTipoLabel(tipo: TipoOrdem): string {
    return tiposOrdem.find(t => t.value === tipo)?.label || tipo;
}

// --- PAINEL DO TÉCNICO (CONTROLE DE RASTREIO) ---
interface PainelTecnicoModalProps {
    ordem: OrdemServico;
    onClose: () => void;
    onUpdate: () => void;
}

function PainelTecnicoModal({ ordem, onClose, onUpdate }: PainelTecnicoModalProps) {
    const [loading, setLoading] = useState(false);
    const [fotos, setFotos] = useState<any[]>([]);
    const [trackingAtivo, setTrackingAtivo] = useState(ordem.rastreamento_ativo || false);
    const [showSignature, setShowSignature] = useState(false);
    const [itensEstoque, setItensEstoque] = useState<EstoqueItem[]>([]);
    const [pecasUtilizadas, setPecasUtilizadas] = useState<{ item_id: string, quantidade: number, nome: string }[]>([]);

    const carregarFotos = async () => {
        const data = await transparentService.listarFotos(ordem.id);
        setFotos(data);
    };

    const carregarEstoque = async () => {
        const data = await estoqueService.listar();
        setItensEstoque(data);
    };

    useEffect(() => {
        carregarFotos();
        carregarEstoque();
    }, [ordem.id]);

    const handleShare = () => {
        const link = `${window.location.origin}/track/${ordem.public_id}`;
        navigator.clipboard.writeText(link);
        alert('Link de rastreio copiado para o cliente!');
    };

    const handleWhatsAppShare = () => {
        if (ordem.cliente?.telefone) {
            const link = ordensService.getWhatsAppClientLink(ordem, ordem.cliente.telefone, 'caminho');
            window.open(link, '_blank');
        } else {
            alert('Cliente não possui telefone cadastrado.');
        }
    };

    const { user } = useAuth();

    const handleToggleTracking = async () => {
        try {
            setLoading(true);
            const novoStatus = !trackingAtivo;

            // Se estiver iniciando, garantimos que o tecnico_id é o do usuário logado
            const updates: any = { rastreamento_ativo: novoStatus };
            if (novoStatus && user) {
                updates.tecnico_id = user.id;
            }

            await ordensService.atualizar(ordem.id, updates);
            setTrackingAtivo(novoStatus);

            // Iniciar Geolocalização se ativado
            if (novoStatus) {
                navigator.geolocation.getCurrentPosition(async (pos) => {
                    await transparentService.atualizarLocalizacao(pos.coords.latitude, pos.coords.longitude);
                    await transparentService.registrarEvento({
                        ordem_id: ordem.id,
                        empresa_id: ordem.empresa_id,
                        tipo: 'inicio',
                        descricao: 'Técnico iniciou o rastreamento',
                        latitude: pos.coords.latitude,
                        longitude: pos.coords.longitude
                    });
                });
            }
            onUpdate();
        } catch (err) {
            alert('Erro ao atualizar rastreio');
        } finally {
            setLoading(false);
        }
    };

    const handleMarcarChegada = async () => {
        setLoading(true);
        navigator.geolocation.getCurrentPosition(async (pos) => {
            await transparentService.registrarEvento({
                ordem_id: ordem.id,
                empresa_id: (ordem as any).empresa_id,
                tipo: 'chegada',
                descricao: 'Técnico chegou ao local',
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude
            });
            setLoading(false);
            alert('Chegada registrada!');
        });
    };

    const handleUploadFoto = async (e: React.ChangeEvent<HTMLInputElement>, tipo: any) => {
        if (!e.target.files?.[0]) return;
        setLoading(true);
        try {
            await transparentService.uploadFoto(ordem.id, e.target.files[0], tipo, `Foto de ${tipo}`);
            carregarFotos();
        } catch (err) {
            alert('Erro no upload');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSignature = async (signatureDataUrl: string) => {
        try {
            setLoading(true);
            // 1. Upload da assinatura
            await transparentService.uploadAssinatura(ordem.id, signatureDataUrl);

            // 2. Marcar OS como concluída e desativar rastreio
            await ordensService.atualizar(ordem.id, {
                status: 'concluida' as any,
                rastreamento_ativo: false,
                data_conclusao: new Date().toISOString()
            } as any);

            // 3. Baixa no estoque
            for (const peca of pecasUtilizadas) {
                await estoqueService.registrarMovimentacao({
                    item_id: peca.item_id,
                    ordem_id: ordem.id,
                    tipo: 'saida',
                    quantidade: peca.quantidade,
                    motivo: `Uso na OS #${ordem.numero}`
                });
            }

            // 4. Registrar evento final
            await transparentService.registrarEvento({
                ordem_id: ordem.id,
                empresa_id: ordem.empresa_id,
                tipo: 'concluido',
                descricao: 'Serviço concluído e assinado pelo cliente',
                latitude: 0,
                longitude: 0
            });

            alert('Serviço finalizado com sucesso!');
            setShowSignature(false);
            onUpdate();
            onClose();
        } catch (err) {
            console.error(err);
            alert('Erro ao finalizar serviço');
        } finally {
            setLoading(false);
        }
    };

    const handleAdicionarPeca = (itemId: string) => {
        const item = itensEstoque.find(i => i.id === itemId);
        if (!item) return;

        setPecasUtilizadas(prev => {
            const existe = prev.find(p => p.item_id === itemId);
            if (existe) {
                return prev.map(p => p.item_id === itemId ? { ...p, quantidade: p.quantidade + 1 } : p);
            }
            return [...prev, { item_id: itemId, quantidade: 1, nome: item.nome }];
        });
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">Painel do Técnico (OS #{ordem.numero})</h2>
                    <button className="modal-close" onClick={onClose}><XIcon /></button>
                </div>
                <div className="modal-body">
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                        <button className={`btn-primary ${trackingAtivo ? 'btn-danger' : ''}`} onClick={handleToggleTracking} disabled={loading}>
                            {trackingAtivo ? 'Encerrar Rastreio' : '🚀 Iniciar Rastreio'}
                        </button>
                        <button className="btn-secondary" onClick={handleShare}>🔗 Copiar Link</button>
                        <button className="btn-secondary" onClick={handleWhatsAppShare} style={{ color: '#25D366' }}>💬 Zap</button>
                    </div>

                    <div className="actions-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <button className="btn-secondary" onClick={handleMarcarChegada} disabled={loading}>📍 Marcar Chegada</button>
                        <button className="btn-primary" onClick={() => setShowSignature(true)} disabled={loading || ordem.status === 'concluida'}>✍️ Finalizar (Assinar)</button>
                    </div>

                    <div className="upload-btn-wrapper" style={{ position: 'relative', overflow: 'hidden', marginTop: '1rem' }}>
                        <button className="btn-secondary" style={{ width: '100%' }}>📸 Foto do Problema/Serviço</button>
                        <input type="file" style={{ position: 'absolute', opacity: 0, inset: 0, cursor: 'pointer' }} onChange={e => handleUploadFoto(e, 'depois')} />
                    </div>

                    <h4 style={{ marginTop: '2rem' }}>Peças Utilizadas</h4>
                    <div className="pecas-control" style={{ marginBottom: '1rem' }}>
                        <select
                            onChange={(e) => handleAdicionarPeca(e.target.value)}
                            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
                            value=""
                        >
                            <option value="" disabled>Selecionar peça do estoque...</option>
                            {itensEstoque.map(item => (
                                <option key={item.id} value={item.id}>
                                    {item.nome} ({item.quantidade} {item.unidade})
                                </option>
                            ))}
                        </select>
                        <ul style={{ listStyle: 'none', padding: 0, marginTop: '1rem', border: '1px solid #f1f5f9', borderRadius: '4px' }}>
                            {pecasUtilizadas.map(peca => (
                                <li key={peca.item_id} style={{ padding: '0.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                    <span>{peca.nome}</span>
                                    <strong>{peca.quantidade}x</strong>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <h4 style={{ marginTop: '2rem' }}>Resumo de Fotos</h4>
                    <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', padding: '0.5rem 0' }}>
                        {fotos.map(f => (
                            <img key={f.id} src={f.url} style={{ width: '60px', height: '60px', borderRadius: '4px', objectFit: 'cover' }} />
                        ))}
                    </div>
                </div>
            </div>

            {showSignature && (
                <SignaturePad
                    onSave={handleSaveSignature}
                    onCancel={() => setShowSignature(false)}
                />
            )}
        </div>
    );
}

export function OrdensPage() {

    const [ordens, setOrdens] = useState<OrdemServico[]>([]);
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [tecnicos, setTecnicos] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>('todos');
    const [showModal, setShowModal] = useState(false);
    const [editingOrdem, setEditingOrdem] = useState<OrdemServico | null>(null);
    const [trackingOrdem, setTrackingOrdem] = useState<OrdemServico | null>(null);
    const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
    const [deletingOrdem, setDeletingOrdem] = useState<OrdemServico | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const { userProfile, user } = useAuth();
    const navigate = useNavigate(); // Assume useNavigate is needed if not imported
    const isAdmin = userProfile?.role === 'admin' || userProfile?.role === 'super_admin';

    useEffect(() => {
        if (userProfile?.role === 'cliente') {
            navigate('/portal');
        }
    }, [userProfile, navigate]);

    const carregarDados = async () => {
        try {
            setLoading(true);
            const [ordensData, clientesData, usersData] = await Promise.all([
                statusFilter === 'todos'
                    ? ordensService.listar()
                    : ordensService.listarPorStatus(statusFilter),
                clientesService.listar(),
                userProfile?.empresa_id ? adminService.listarUsuariosPorEmpresa(userProfile.empresa_id) : Promise.resolve([])
            ]);

            // Se for técnico, filtrar para ver apenas suas ordens ou as abertas da empresa dele
            let filteredOrdens = ordensData;
            if (!isAdmin && user) {
                filteredOrdens = ordensData.filter(o => o.tecnico_id === user.id || o.status === 'aberta');
            }

            setOrdens(filteredOrdens);
            setClientes(clientesData);
            setTecnicos(usersData.filter(u => u.role === 'tecnico' || u.role === 'admin'));
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        carregarDados();
    }, [statusFilter]);

    const handleNovaOrdem = () => {
        setEditingOrdem(null);
        setShowModal(true);
    };

    const handleEditOrdem = (ordem: OrdemServico) => {
        setEditingOrdem(ordem);
        setShowModal(true);
    };

    const handleDeleteOrdem = async () => {
        if (!deletingOrdem) return;

        setDeleteLoading(true);
        try {
            await ordensService.excluir(deletingOrdem.id);
            setDeletingOrdem(null);
            carregarDados();
        } catch (error) {
            console.error('Erro ao excluir ordem:', error);
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleModalClose = () => {
        setShowModal(false);
        setEditingOrdem(null);
    };

    const handleModalSave = () => {
        handleModalClose();
        carregarDados();
    };

    return (
        <div className="ordens-page">
            <div className="page-header">
                <h1 className="page-title">Ordens de Serviço</h1>
                <div className="page-actions" style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn-secondary" onClick={() => setIsCalculatorOpen(true)}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
                            <line x1="8" y1="6" x2="16" y2="6"></line>
                            <line x1="16" y1="14" x2="16" y2="18"></line>
                            <path d="M16 10h.01"></path>
                            <path d="M12 10h.01"></path>
                            <path d="M8 10h.01"></path>
                            <path d="M12 14h.01"></path>
                            <path d="M8 14h.01"></path>
                            <path d="M12 18h.01"></path>
                            <path d="M8 18h.01"></path>
                        </svg>
                        Calculadora BTU
                    </button>
                    {isAdmin && (
                        <button className="btn-primary" onClick={handleNovaOrdem}>
                            <PlusIcon />
                            Nova Ordem
                        </button>
                    )}
                </div>
            </div>

            <div className="filters-bar horizontal-scroll hide-scrollbar">
                <div className="filter-group">
                    <span className="filter-label">Status:</span>
                    <select
                        className="filter-select"
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                    >
                        <option value="todos">Todos</option>
                        {statusOrdem.map(s => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="table-container">
                    <div className="loading-spinner">
                        <div className="spinner"></div>
                    </div>
                </div>
            ) : ordens.length === 0 ? (
                <div className="table-container">
                    <div className="empty-state">
                        <div className="empty-icon">
                            <ClipboardIcon />
                        </div>
                        <h3 className="empty-title">
                            {statusFilter !== 'todos' ? 'Nenhuma ordem encontrada' : 'Nenhuma ordem cadastrada'}
                        </h3>
                        <p className="empty-description">
                            {statusFilter !== 'todos'
                                ? 'Tente filtrar por outro status'
                                : 'Comece criando sua primeira ordem de serviço'}
                        </p>
                        {statusFilter === 'todos' && (
                            <button className="btn-primary" onClick={handleNovaOrdem}>
                                <PlusIcon />
                                Criar Ordem
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Nº</th>
                                <th>Cliente</th>
                                <th>Tipo</th>
                                <th>Status</th>
                                <th>Prioridade</th>
                                <th>Agendamento</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ordens.map(ordem => (
                                <tr key={ordem.id}>
                                    <td className="order-number" data-label="Nº">#{ordem.numero}</td>
                                    <td data-label="Cliente">
                                        <div className="client-cell">
                                            <span className="client-name">{(ordem.cliente as unknown as Cliente)?.nome || 'Cliente não encontrado'}</span>
                                            <span className="client-phone">{(ordem.cliente as unknown as Cliente)?.telefone || ''}</span>
                                        </div>
                                    </td>
                                    <td data-label="Tipo">
                                        <span className="tipo-label">{getTipoLabel(ordem.tipo)}</span>
                                    </td>
                                    <td data-label="Status">
                                        <span className={`status-badge ${ordem.status}`}>
                                            {getStatusLabel(ordem.status)}
                                        </span>
                                    </td>
                                    <td data-label="Prioridade">
                                        <span className={`prioridade-badge ${ordem.prioridade}`}>
                                            {ordem.prioridade}
                                        </span>
                                    </td>
                                    <td className="date-cell" data-label="Agendamento">
                                        {formatDate(ordem.data_agendamento)}
                                    </td>
                                    <td data-label="Ações">
                                        <div className="table-actions">
                                            {ordem.status === 'aberta' && (
                                                <>
                                                    {isAdmin && ordem.tecnico_id && (
                                                        <button
                                                            className="btn-icon"
                                                            onClick={() => {
                                                                const tech = tecnicos.find(t => t.id === ordem.tecnico_id);
                                                                if (tech?.telefone) {
                                                                    window.open(ordensService.getWhatsAppTechLink(ordem, tech.telefone, userProfile?.empresa?.nome || 'N/A'), '_blank');
                                                                } else {
                                                                    alert('Técnico não possui telefone cadastrado.');
                                                                }
                                                            }}
                                                            title="Notificar Técnico via WhatsApp"
                                                            style={{ color: '#25D366' }}
                                                        >
                                                            💬
                                                        </button>
                                                    )}
                                                    {ordem.tecnico_id === user?.id && (
                                                        <div style={{ display: 'flex', gap: '0.2rem' }}>
                                                            <button
                                                                className="btn-icon"
                                                                onClick={async () => {
                                                                    if (confirm('Deseja aceitar este chamado e informar que está a caminho?')) {
                                                                        await ordensService.aceitarOrdem(ordem.id, 'imediato');
                                                                        if (ordem.cliente?.telefone) {
                                                                            window.open(ordensService.getWhatsAppClientLink(ordem, ordem.cliente.telefone, 'caminho'), '_blank');
                                                                        }
                                                                        carregarDados();
                                                                    }
                                                                }}
                                                                title="Aceitar e Ir Agora"
                                                                style={{ color: '#10b981' }}
                                                            >
                                                                🚀
                                                            </button>
                                                            <button
                                                                className="btn-icon"
                                                                onClick={async () => {
                                                                    if (confirm('Deseja aceitar este chamado e confirmar o agendamento?')) {
                                                                        await ordensService.aceitarOrdem(ordem.id, 'agendado');
                                                                        if (ordem.cliente?.telefone) {
                                                                            window.open(ordensService.getWhatsAppClientLink(ordem, ordem.cliente.telefone, 'agendado'), '_blank');
                                                                        }
                                                                        carregarDados();
                                                                    }
                                                                }}
                                                                title="Aceitar e Agendar"
                                                                style={{ color: '#f59e0b' }}
                                                            >
                                                                📅
                                                            </button>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                            <button
                                                className="btn-icon"
                                                onClick={() => setTrackingOrdem(ordem)}
                                                title="Painel do Técnico"
                                                style={{ color: ordem.rastreamento_ativo ? '#2563eb' : 'inherit' }}
                                            >
                                                🛰️
                                            </button>
                                            {isAdmin && (
                                                <>
                                                    <button
                                                        className="btn-icon"
                                                        onClick={() => handleEditOrdem(ordem)}
                                                        title="Editar"
                                                    >
                                                        <EditIcon />
                                                    </button>
                                                    <button
                                                        className="btn-icon danger"
                                                        onClick={() => setDeletingOrdem(ordem)}
                                                        title="Excluir"
                                                    >
                                                        <TrashIcon />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showModal && (
                <OrdemFormModal
                    ordem={editingOrdem}
                    clientes={clientes}
                    tecnicos={tecnicos}
                    onClose={handleModalClose}
                    onSave={handleModalSave}
                />
            )}

            {deletingOrdem && (
                <ConfirmDialog
                    title="Excluir Ordem"
                    message={`Tem certeza que deseja excluir a ordem #${deletingOrdem.numero}? Esta ação não pode ser desfeita.`}
                    onConfirm={handleDeleteOrdem}
                    onCancel={() => setDeletingOrdem(null)}
                    loading={deleteLoading}
                />
            )}

            {trackingOrdem && (
                <PainelTecnicoModal
                    ordem={trackingOrdem}
                    onClose={() => setTrackingOrdem(null)}
                    onUpdate={carregarDados}
                />
            )}

            {isCalculatorOpen && (
                <BTUCalculator onClose={() => setIsCalculatorOpen(false)} />
            )}
        </div>
    );
}

export default OrdensPage;

import { useState, useEffect, type FormEvent } from 'react';
import { clientesService } from '../../services/clientesService';
import { adminService } from '../../services/adminService';
import { useAuth } from '../../hooks/useAuth';
import { maskPhone, maskCEP, maskCPF, unmask } from '../../utils/formatters';
import { validateCPF } from '../../utils/validators';
import type { Cliente, ClienteInput, Empresa } from '../../types';
import './Clientes.css';

// Icons
const PlusIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
);

const SearchIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
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

const UsersIcon = () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
);

const AlertIcon = () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
        <line x1="12" y1="9" x2="12" y2="13"></line>
        <line x1="12" y1="17" x2="12.01" y2="17"></line>
    </svg>
);

interface ClienteFormModalProps {
    cliente: Cliente | null;
    onClose: () => void;
    onSave: () => void;
    empresas: Empresa[];
    isSuperAdmin: boolean;
}

// Interface auxiliar para o formulário
interface ClienteFormState extends ClienteInput {
    logradouro?: string;
    numero?: string;
    bairro?: string;
    complemento?: string;
    empresa_id?: string;
}

function ClienteFormModal({ cliente, onClose, onSave, empresas, isSuperAdmin }: ClienteFormModalProps) {
    // Estado inicial
    const [formData, setFormData] = useState<ClienteFormState>(() => {
        // Tentar extrair dados do endereço se existir (ex: Rua X, 123 - Bairro)
        // Por simplicidade, se já existir, jogamos no logradouro para não perder dados
        // O usuário pode ajustar manualmente
        return {
            nome: cliente?.nome || '',
            telefone: cliente?.telefone || '',
            email: cliente?.email || '',
            endereco: '', // Vamos montar no submit
            cidade: cliente?.cidade || '',
            estado: cliente?.estado || '',
            cep: cliente?.cep || '',
            observacoes: cliente?.observacoes || '',
            logradouro: cliente?.endereco || '',
            numero: '',
            bairro: '',
            complemento: '',
            empresa_id: cliente ? (cliente as any).empresa_id : ''
        };
    });

    const [loading, setLoading] = useState(false);
    const [buscandoCep, setBuscandoCep] = useState(false);
    const [error, setError] = useState('');

    const buscarCep = async (cep: string) => {
        const cepLimpo = cep.replace(/\D/g, '');
        if (cepLimpo.length !== 8) return;

        setBuscandoCep(true);
        try {
            const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
            const data = await response.json();

            if (!data.erro) {
                setFormData(prev => ({
                    ...prev,
                    logradouro: data.logradouro,
                    bairro: data.bairro,
                    cidade: data.localidade,
                    estado: data.uf,
                    complemento: '' // Limpa complemento pois pode ser diferente
                }));
            }
        } catch (err) {
            console.error('Erro ao buscar CEP:', err);
        } finally {
            setBuscandoCep(false);
        }
    };

    const handleCepBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        buscarCep(e.target.value);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!formData.nome.trim()) {
            setError('O nome é obrigatório');
            return;
        }

        setLoading(true);
        setError('');

        // Montar endereço completo
        // Formato: Logradouro, Número - Bairro - Complemento
        const partesEndereco = [];
        if (formData.logradouro) partesEndereco.push(formData.logradouro);
        if (formData.numero) partesEndereco.push(formData.numero);
        if (formData.bairro) partesEndereco.push(`- ${formData.bairro}`);
        if (formData.complemento) partesEndereco.push(`(${formData.complemento})`);

        // Se o usuário não usou os campos novos e só editou o logradouro (legado), usa o logradouro como full address
        const enderecoFinal = partesEndereco.length > 0 ? partesEndereco.join(', ').replace(', -', ' -') : formData.logradouro;

        // Validação de CPF
        const cleanCPF = unmask(formData.cpf || '');
        if (cleanCPF && !validateCPF(formData.cpf || '')) {
            alert('CPF inválido. Por favor, verifique os dígitos.');
            return;
        }

        // Limpar campos auxiliares antes de enviar
        const clienteParaSalvar: ClienteInput = {
            nome: formData.nome,
            telefone: unmask(formData.telefone || ''),
            email: formData.email,
            cidade: formData.cidade,
            estado: formData.estado,
            cep: unmask(formData.cep || ''),
            cpf: cleanCPF,
            observacoes: formData.observacoes,
            endereco: enderecoFinal || '',
            empresa_id: formData.empresa_id
        };

        try {
            if (cliente) {
                await clientesService.atualizar(cliente.id, clienteParaSalvar);
            } else {
                await clientesService.criar(clienteParaSalvar);
            }
            onSave();
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Erro ao salvar cliente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">
                        {cliente ? 'Editar Cliente' : 'Novo Cliente'}
                    </h2>
                    <button className="modal-close" onClick={onClose}>
                        <XIcon />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {error && <div className="error-message" style={{ marginBottom: '1rem' }}>{error}</div>}

                        <div className="form-group">
                            <label className="form-label">Nome *</label>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.nome}
                                onChange={e => setFormData({ ...formData, nome: e.target.value })}
                                placeholder="Nome do cliente"
                                disabled={loading}
                            />
                        </div>

                        {isSuperAdmin && (
                            <div className="form-group">
                                <label className="form-label">Empresa *</label>
                                <select
                                    className="form-input"
                                    value={formData.empresa_id}
                                    onChange={e => setFormData({ ...formData, empresa_id: e.target.value })}
                                    disabled={loading || !!cliente}
                                >
                                    <option value="">Selecione uma empresa</option>
                                    {empresas.map(emp => (
                                        <option key={emp.id} value={emp.id}>{emp.nome}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Telefone</label>
                                <input
                                    type="tel"
                                    className="form-input"
                                    value={formData.telefone}
                                    onChange={e => setFormData({ ...formData, telefone: maskPhone(e.target.value) })}
                                    placeholder="(00) 00000-0000"
                                    disabled={loading}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Email</label>
                                <input
                                    type="email"
                                    className="form-input"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="email@exemplo.com"
                                    disabled={loading}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">CPF (Opcional)</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.cpf}
                                    onChange={e => setFormData({ ...formData, cpf: maskCPF(e.target.value) })}
                                    placeholder="000.000.000-00"
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">CEP</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.cep}
                                        onChange={e => setFormData({ ...formData, cep: maskCEP(e.target.value) })}
                                        onBlur={handleCepBlur}
                                        placeholder="00000-000"
                                        disabled={loading || buscandoCep}
                                    />
                                    {buscandoCep && <span style={{ position: 'absolute', right: 10, top: 10, fontSize: '0.8rem' }}>Busca...</span>}
                                </div>
                            </div>
                            <div className="form-group" style={{ flex: 2 }}>
                                <label className="form-label">Cidade</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.cidade}
                                    onChange={e => setFormData({ ...formData, cidade: e.target.value })}
                                    disabled={loading}
                                />
                            </div>
                            <div className="form-group" style={{ flex: 0.5 }}>
                                <label className="form-label">UF</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.estado}
                                    onChange={e => setFormData({ ...formData, estado: e.target.value })}
                                    maxLength={2}
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Endereço (Rua/Av)</label>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.logradouro}
                                onChange={e => setFormData({ ...formData, logradouro: e.target.value })}
                                placeholder="Logradouro"
                                disabled={loading}
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Número</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.numero}
                                    onChange={e => setFormData({ ...formData, numero: e.target.value })}
                                    placeholder="Nº"
                                    disabled={loading}
                                />
                            </div>
                            <div className="form-group" style={{ flex: 2 }}>
                                <label className="form-label">Bairro</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.bairro}
                                    onChange={e => setFormData({ ...formData, bairro: e.target.value })}
                                    placeholder="Bairro"
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Complemento / Referência</label>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.complemento}
                                onChange={e => setFormData({ ...formData, complemento: e.target.value })}
                                placeholder="Apto, Bloco, Próximo a..."
                                disabled={loading}
                            />
                        </div>

                        <div className="form-group">
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
                            {loading ? 'Salvando...' : (cliente ? 'Salvar Alterações' : 'Cadastrar Cliente')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

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

export function ClientesPage() {
    const { isSuperAdmin } = useAuth();
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [empresas, setEmpresas] = useState<Empresa[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
    const [deletingCliente, setDeletingCliente] = useState<Cliente | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    useEffect(() => {
        if (isSuperAdmin) {
            adminService.listarEmpresas().then(setEmpresas).catch(console.error);
        }
    }, [isSuperAdmin]);

    const carregarClientes = async () => {
        try {
            setLoading(true);
            const data = searchTerm
                ? await clientesService.buscar(searchTerm)
                : await clientesService.listar();
            setClientes(data);
        } catch (error) {
            console.error('Erro ao carregar clientes:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        carregarClientes();
    }, [searchTerm]);

    const handleNovoCliente = () => {
        setEditingCliente(null);
        setShowModal(true);
    };

    const handleEditCliente = (cliente: Cliente) => {
        setEditingCliente(cliente);
        setShowModal(true);
    };

    const handleDeleteCliente = async () => {
        if (!deletingCliente) return;

        setDeleteLoading(true);
        try {
            await clientesService.excluir(deletingCliente.id);
            setDeletingCliente(null);
            carregarClientes();
        } catch (error) {
            console.error('Erro ao excluir cliente:', error);
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleModalClose = () => {
        setShowModal(false);
        setEditingCliente(null);
    };

    const handleModalSave = () => {
        handleModalClose();
        carregarClientes();
    };

    return (
        <div className="clientes-page">
            <div className="page-header">
                <h1 className="page-title">Clientes</h1>
                <button className="btn-primary" onClick={handleNovoCliente}>
                    <PlusIcon />
                    Novo Cliente
                </button>
            </div>

            <div className="search-bar">
                <div className="search-input-wrapper">
                    <span className="input-icon">
                        <SearchIcon />
                    </span>
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Buscar por nome, telefone ou email..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="table-container">
                    <div className="loading-spinner">
                        <div className="spinner"></div>
                    </div>
                </div>
            ) : clientes.length === 0 ? (
                <div className="table-container">
                    <div className="empty-state">
                        <div className="empty-icon">
                            <UsersIcon />
                        </div>
                        <h3 className="empty-title">
                            {searchTerm ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
                        </h3>
                        <p className="empty-description">
                            {searchTerm
                                ? 'Tente buscar com outros termos'
                                : 'Comece cadastrando seu primeiro cliente'}
                        </p>
                        {!searchTerm && (
                            <button className="btn-primary" onClick={handleNovoCliente}>
                                <PlusIcon />
                                Cadastrar Cliente
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Nome</th>
                                <th>Telefone</th>
                                <th>Email</th>
                                <th>Cidade</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {clientes.map(cliente => (
                                <tr key={cliente.id}>
                                    <td className="table-name" data-label="Nome">{cliente.nome}</td>
                                    <td data-label="Telefone">{cliente.telefone || '-'}</td>
                                    <td data-label="Email">{cliente.email || '-'}</td>
                                    <td data-label="Cidade">{cliente.cidade ? `${cliente.cidade}/${cliente.estado}` : '-'}</td>
                                    <td data-label="Ações">
                                        <div className="table-actions">
                                            <button
                                                className="btn-icon"
                                                onClick={() => handleEditCliente(cliente)}
                                                title="Editar"
                                            >
                                                <EditIcon />
                                            </button>
                                            <button
                                                className="btn-icon danger"
                                                onClick={() => setDeletingCliente(cliente)}
                                                title="Excluir"
                                            >
                                                <TrashIcon />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showModal && (
                <ClienteFormModal
                    cliente={editingCliente}
                    onClose={handleModalClose}
                    onSave={handleModalSave}
                    empresas={empresas}
                    isSuperAdmin={isSuperAdmin}
                />
            )}

            {deletingCliente && (
                <ConfirmDialog
                    title="Excluir Cliente"
                    message={`Tem certeza que deseja excluir o cliente "${deletingCliente.nome}"? Ao confirmar a exclusão, todos os chamados vinculados a esse cliente serão mantidos no sistema para fins de histórico.`}
                    onConfirm={handleDeleteCliente}
                    onCancel={() => setDeletingCliente(null)}
                    loading={deleteLoading}
                />
            )}
        </div>
    );
}

export default ClientesPage;

import { useState, useEffect, useRef, type FormEvent } from 'react';
import { adminService } from '../../services/adminService';
import { useAuth } from '../../hooks/useAuth';
import type { Empresa, UserProfile, UserRole, AuditLog } from '../../types';
import { maskCNPJ, maskPhone, maskCPF, unmask } from '../../utils/formatters';
import { validateCNPJ, validateCPF } from '../../utils/validators';
import '../Clientes/Clientes.css';
import './Admin.css';

// Icons
const PlusIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
);
const EditIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
);
const XIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);
const TrashIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
);

// --- MODAL EMPRESA ---
interface EmpresaModalProps {
    empresa: Empresa | null;
    onClose: () => void;
    onSave: () => void;
}
function EmpresaModal({ empresa, onClose, onSave }: EmpresaModalProps) {
    const [formData, setFormData] = useState({
        nome: empresa?.nome || '',
        cnpj: empresa?.cnpj || '',
        email: empresa?.email || '',
        telefone: empresa?.telefone || '',
        ativo: empresa ? empresa.ativo : true
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        // Validação de CNPJ
        const cleanCNPJ = unmask(formData.cnpj);
        if (cleanCNPJ && !validateCNPJ(formData.cnpj)) {
            alert('CNPJ inválido. Por favor, verifique os dígitos.');
            return;
        }

        setLoading(true);
        try {
            const dataToSave = {
                ...formData,
                cnpj: cleanCNPJ,
                telefone: unmask(formData.telefone)
            };

            if (empresa) {
                await adminService.atualizarEmpresa(empresa.id, dataToSave);
            } else {
                await adminService.criarEmpresa(dataToSave);
            }
            onSave();
        } catch (error) {
            console.error(error);
            alert('Erro ao salvar empresa');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">{empresa ? 'Editar Empresa' : 'Nova Empresa'}</h2>
                    <button className="modal-close" onClick={onClose}><XIcon /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-group">
                            <label className="form-label">Nome</label>
                            <input className="form-input" value={formData.nome} onChange={e => setFormData({ ...formData, nome: e.target.value })} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">CNPJ</label>
                            <input
                                className="form-input"
                                value={formData.cnpj}
                                onChange={e => setFormData({ ...formData, cnpj: maskCNPJ(e.target.value) })}
                                placeholder="00.000.000/0000-00"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Email</label>
                            <input
                                className="form-input"
                                type="email"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                placeholder="email@empresa.com"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Telefone</label>
                            <input
                                className="form-input"
                                value={formData.telefone}
                                onChange={e => setFormData({ ...formData, telefone: maskPhone(e.target.value) })}
                                placeholder="(00) 0000-0000"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={formData.ativo}
                                    onChange={e => setFormData({ ...formData, ativo: e.target.checked })}
                                />
                                Empresa Ativa
                            </label>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// --- MODAL USUÁRIO ---
interface UsuarioModalProps {
    usuario: UserProfile;
    empresas: Empresa[];
    onClose: () => void;
    onSave: () => void;
    fixedRole?: UserRole;
}
function UsuarioModal({ usuario, empresas, onClose, onSave, fixedRole }: UsuarioModalProps) {
    const { userProfile } = useAuth();
    const isSuperAdmin = userProfile?.role === 'super_admin';

    const [formData, setFormData] = useState<{
        nome: string;
        role: UserRole;
        empresa_id: string;
        email?: string;
        telefone?: string;
        cpf?: string;
        password?: string;
    }>({
        nome: usuario.nome || '',
        role: fixedRole || usuario.role || 'tecnico',
        empresa_id: usuario.empresa_id || (isSuperAdmin ? '' : (userProfile?.empresa_id || '')),
        email: usuario.email || '',
        telefone: usuario.telefone || '',
        cpf: (usuario as any).cpf || '',
        password: ''
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        // Validação de CPF
        const cleanCPF = unmask(formData.cpf || '');
        if (cleanCPF && !validateCPF(formData.cpf || '')) {
            alert('CPF inválido. Por favor, verifique os dígitos.');
            return;
        }

        setLoading(true);
        try {
            const dataToSave = {
                role: formData.role as UserRole,
                empresa_id: formData.empresa_id,
                nome: formData.nome,
                telefone: unmask(formData.telefone || ''),
                cpf: cleanCPF,
                password: formData.password
            };

            if (usuario.id) {
                await adminService.atualizarPerfilUsuario(usuario.id, dataToSave);
            } else {
                if (!formData.email) {
                    alert('E-mail é obrigatório para novos usuários');
                    return;
                }
                await adminService.criarUsuarioComAcesso({
                    ...dataToSave,
                    email: formData.email,
                    password: formData.password
                });
            }
            onSave();
        } catch (error: any) {
            console.error(error);
            alert(error.message || 'Erro ao processar usuário');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">
                        {usuario.id ? `Editar Usuário: ${usuario.nome}` : (fixedRole === 'tecnico' ? 'Novo Técnico' : 'Novo Usuário (Acesso + Perfil)')}
                    </h2>
                    <button className="modal-close" onClick={onClose}><XIcon /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-group">
                            <label className="form-label">Nome Completo</label>
                            <input className="form-input" value={formData.nome} onChange={e => setFormData({ ...formData, nome: e.target.value })} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">E-mail (Login)</label>
                            <input
                                className="form-input"
                                type="email"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                required
                                disabled={!!usuario.id}
                                style={usuario.id ? { backgroundColor: '#f1f5f9', cursor: 'not-allowed' } : {}}
                            />
                            {usuario.id && <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>O e-mail não pode ser alterado após a criação.</p>}
                        </div>

                        <div className="form-group">
                            <label className="form-label">WhatsApp (Telefone)</label>
                            <input
                                className="form-input"
                                type="tel"
                                value={formData.telefone}
                                onChange={e => setFormData({ ...formData, telefone: maskPhone(e.target.value) })}
                                placeholder="(00) 00000-0000"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">CPF (Opcional)</label>
                            <input
                                className="form-input"
                                value={formData.cpf}
                                onChange={e => setFormData({ ...formData, cpf: maskCPF(e.target.value) })}
                                placeholder="000.000.000-00"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">{usuario.id ? 'Nova Senha (Opcional)' : 'Senha de Acesso'}</label>
                            <input
                                className="form-input"
                                type="password"
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                placeholder={usuario.id ? 'Deixe em branco para não alterar' : 'Mínimo 6 caracteres'}
                                required={!usuario.id}
                            />
                            <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                                {!usuario.id ? 'Defina uma senha para o primeiro acesso.' : 'Preencha apenas se desejar redefinir a senha do usuário.'}
                            </p>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Empresa</label>
                            <select
                                className="form-select"
                                value={formData.empresa_id}
                                onChange={e => setFormData({ ...formData, empresa_id: e.target.value })}
                                disabled={!isSuperAdmin}
                                style={!isSuperAdmin ? { backgroundColor: '#f1f5f9', cursor: 'not-allowed' } : {}}
                            >
                                <option value="">Selecione uma empresa</option>
                                {empresas.map(emp => (
                                    <option key={emp.id} value={emp.id}>{emp.nome}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Perfil (Role)</label>
                            <select
                                className="form-select"
                                value={formData.role}
                                onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
                                disabled={!isSuperAdmin && !usuario.id} // Trava para novo usuário se não for Super Admin
                                style={(!isSuperAdmin && !usuario.id) ? { backgroundColor: '#f1f5f9', cursor: 'not-allowed' } : {}}
                            >
                                {isSuperAdmin ? (
                                    <>
                                        <option value="super_admin">Super Admin (Global)</option>
                                        <option value="admin">Administrador (Empresa)</option>
                                        <option value="tecnico">Técnico</option>
                                        <option value="cliente">Cliente</option>
                                    </>
                                ) : (
                                    <>
                                        {usuario.role === 'admin' && <option value="admin">Administrador (Empresa)</option>}
                                        <option value="tecnico">Técnico</option>
                                        {usuario.role === 'cliente' && <option value="cliente">Cliente</option>}
                                    </>
                                )}
                            </select>
                            {!isSuperAdmin && !usuario.id && (
                                <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                                    Como administrador de empresa, você só pode criar novos técnicos.
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'Salvando...' : (usuario.id ? 'Salvar Alterações' : (fixedRole === 'tecnico' ? 'Criar Técnico' : 'Criar Usuário'))}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// --- PÁGINA PRINCIPAL ---
export function AdminPage() {
    const { userProfile } = useAuth();
    const isSuperAdmin = userProfile?.role === 'super_admin';

    const [activeTab, setActiveTab] = useState<'empresas' | 'usuarios' | 'auditoria'>(isSuperAdmin ? 'empresas' : 'usuarios');
    const [empresas, setEmpresas] = useState<Empresa[]>([]);
    const [usuarios, setUsuarios] = useState<UserProfile[]>([]);
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);

    const tabsRef = useRef<HTMLDivElement>(null);

    const [showEmpresaModal, setShowEmpresaModal] = useState(false);
    const [editingEmpresa, setEditingEmpresa] = useState<Empresa | null>(null);

    const [showUsuarioModal, setShowUsuarioModal] = useState(false);
    const [editingUsuario, setEditingUsuario] = useState<UserProfile | null>(null);

    const carregarDados = async () => {
        setLoading(true);
        try {
            // Carregamos empresas e usuários primeiro (essenciais)
            const [emps, users] = await Promise.all([
                adminService.listarEmpresas(),
                adminService.listarUsuarios()
            ]);
            setEmpresas(emps);
            setUsuarios(users);

            // Carregamos auditoria separadamente para não travar se a tabela não existir
            try {
                const auditLogs = await adminService.listarAuditoria();
                setLogs(auditLogs);
            } catch (auditError) {
                console.warn('Logs de auditoria não disponíveis (verifique se rodou o SQL):', auditError);
                setLogs([]);
            }
        } catch (error) {
            console.error('Erro ao carregar dados administrativos:', error);
            alert('Erro ao carregar empresas ou usuários. Verifique sua conexão.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        carregarDados();
        // Sincronizar aba com o hash da URL se existir
        if (window.location.hash === '#usuarios') {
            setActiveTab('usuarios');
        } else if (window.location.hash === '#empresas') {
            setActiveTab('empresas');
        } else if (window.location.hash === '#auditoria') {
            setActiveTab('auditoria');
        }
    }, [location.hash]);

    // Auto-scroll para a aba ativa no mobile
    useEffect(() => {
        if (tabsRef.current) {
            const activeTabElement = tabsRef.current.querySelector('.admin-tab.active');
            if (activeTabElement) {
                activeTabElement.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
            }
        }
    }, [activeTab]);

    // Handlers Empresas
    const handleNovaEmpresa = () => { setEditingEmpresa(null); setShowEmpresaModal(true); };
    const handleEditEmpresa = (emp: Empresa) => { setEditingEmpresa(emp); setShowEmpresaModal(true); };
    const handleSaveEmpresa = () => { setShowEmpresaModal(false); carregarDados(); };

    // Handlers Usuários
    const handleEditUsuario = (user: UserProfile) => { setEditingUsuario(user); setShowUsuarioModal(true); };
    const handleSaveUsuario = () => { setShowUsuarioModal(false); carregarDados(); };

    const handleExcluirEmpresa = async (id: string, nome: string) => {
        if (!window.confirm(`Tem certeza que deseja excluir a empresa "${nome}"? Esta ação é irreversível e afetará todos os usuários e dados vinculados.`)) return;
        try {
            await adminService.excluirEmpresa(id);
            carregarDados();
        } catch (error) {
            console.error(error);
            alert('Erro ao excluir empresa. Verifique se existem vínculos ativos.');
        }
    };

    const handleExcluirUsuario = async (id: string, nome: string) => {
        if (!window.confirm(`Tem certeza que deseja remover o acesso de "${nome}"?`)) return;
        try {
            await adminService.excluirPerfil(id);
            carregarDados();
        } catch (error) {
            console.error(error);
            alert('Erro ao remover usuário.');
        }
    };

    const formatLogAction = (action: string) => {
        switch (action) {
            case 'INSERT': return { label: 'Criação', color: '#059669' };
            case 'UPDATE': return { label: 'Edição', color: '#2563eb' };
            case 'DELETE': return { label: 'Exclusão', color: '#dc2626' };
            default: return { label: action, color: '#64748b' };
        }
    };

    const formatTableName = (table: string) => {
        switch (table) {
            case 'ordens_servico': return 'OS';
            case 'clientes': return 'Cliente';
            case 'orcamentos': return 'Orçamento';
            case 'produtos': return 'Produto';
            default: return table;
        }
    };

    return (
        <div className="admin-page">
            <div className="admin-header">
                <h1 className="admin-title">
                    {isSuperAdmin ? 'Administração Global' : 'Administração da Empresa'}
                </h1>
                {activeTab === 'empresas' && (
                    <button className="btn-primary" onClick={handleNovaEmpresa}>
                        <PlusIcon /> Nova Empresa
                    </button>
                )}
                {activeTab === 'usuarios' && (
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <span style={{ fontSize: '0.8rem', color: '#64748b', alignSelf: 'center' }}>
                            {isSuperAdmin ? 'Gerencie todos os usuários do sistema.' : 'Gerencie os técnicos da sua empresa.'}
                        </span>
                        <button className="btn-primary" onClick={() => { setEditingUsuario({ id: '', nome: '', empresa_id: '', role: 'tecnico' }); setShowUsuarioModal(true); }}>
                            <PlusIcon /> {isSuperAdmin ? 'Novo Usuário' : 'Novo Técnico'}
                        </button>
                    </div>
                )}
                {activeTab === 'auditoria' && (
                    <button className="btn-secondary" onClick={carregarDados}>
                        Atualizar Logs
                    </button>
                )}
            </div>

            <div className="admin-tabs horizontal-tabs-container hide-scrollbar" ref={tabsRef}>
                {isSuperAdmin && (
                    <div className={`admin-tab ${activeTab === 'empresas' ? 'active' : ''}`} onClick={() => setActiveTab('empresas')}>
                        Empresas
                    </div>
                )}
                <div className={`admin-tab ${activeTab === 'usuarios' ? 'active' : ''}`} onClick={() => setActiveTab('usuarios')}>
                    {isSuperAdmin ? 'Usuários' : 'Equipe / Usuários'}
                </div>
                {isSuperAdmin && (
                    <div className={`admin-tab ${activeTab === 'auditoria' ? 'active' : ''}`} onClick={() => setActiveTab('auditoria')}>
                        Auditoria
                    </div>
                )}
            </div>

            {loading ? (
                <div>Carregando...</div>
            ) : (
                <div className="admin-content">
                    {activeTab === 'empresas' && (
                        <div className="admin-table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Nome</th>
                                        <th>CNPJ</th>
                                        <th>Email</th>
                                        <th>Status</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {empresas.map(emp => (
                                        <tr key={emp.id} style={{ opacity: emp.ativo === false ? 0.6 : 1 }}>
                                            <td style={{ fontWeight: 600 }} data-label="Nome">{emp.nome}</td>
                                            <td data-label="CNPJ">{emp.cnpj || '-'}</td>
                                            <td data-label="Email">{emp.email || '-'}</td>
                                            <td data-label="Status">
                                                <span className={`badge ${emp.ativo === false ? 'badge-danger' : 'badge-success'}`}>
                                                    {emp.ativo === false ? 'Bloqueada' : 'Ativa'}
                                                </span>
                                            </td>
                                            <td data-label="Ações">
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button className="btn-icon" onClick={() => handleEditEmpresa(emp)} title="Editar">
                                                        <EditIcon />
                                                    </button>
                                                    <button className="btn-icon btn-icon-danger" onClick={() => handleExcluirEmpresa(emp.id, emp.nome)} title="Excluir">
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

                    {activeTab === 'usuarios' && (
                        <div className="admin-table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Nome</th>
                                        <th>E-mail</th>
                                        <th>WhatsApp</th>
                                        <th>Empresa</th>
                                        <th>Perfil</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {usuarios.map(user => (
                                        <tr key={user.id}>
                                            <td style={{ fontWeight: 600 }} data-label="Nome">{user.nome}</td>
                                            <td style={{ fontSize: '0.85rem' }} data-label="E-mail">{user.email || '-'}</td>
                                            <td style={{ fontSize: '0.85rem' }} data-label="WhatsApp">{user.telefone || '-'}</td>
                                            <td data-label="Empresa">{user.empresa?.nome || '-'}</td>
                                            <td data-label="Perfil"><span className={`role-badge role-${user.role}`}>{user.role}</span></td>
                                            <td data-label="Ações">
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button className="btn-icon" onClick={() => handleEditUsuario(user)} title="Editar Perfil">
                                                        <EditIcon />
                                                    </button>
                                                    <button className="btn-icon btn-icon-danger" onClick={() => handleExcluirUsuario(user.id, user.nome)} title="Excluir">
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

                    {activeTab === 'auditoria' && (
                        <div className="admin-table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Data/Hora</th>
                                        <th>Usuário</th>
                                        <th>Empresa</th>
                                        <th>Ação</th>
                                        <th>Tabela</th>
                                        <th>Detalhes (JSON)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.map(log => (
                                        <tr key={log.id}>
                                            <td style={{ fontSize: '0.8rem' }} data-label="Data/Hora">
                                                {new Date(log.created_at).toLocaleString('pt-BR')}
                                            </td>
                                            <td style={{ fontWeight: 600 }} data-label="Usuário">{log.perfil?.nome || 'Sistema'}</td>
                                            <td data-label="Empresa">{log.empresa?.nome || '-'}</td>
                                            <td data-label="Ação">
                                                <span style={{
                                                    color: formatLogAction(log.acao).color,
                                                    fontWeight: 600,
                                                    padding: '0.2rem 0.5rem',
                                                    borderRadius: '4px',
                                                    background: `${formatLogAction(log.acao).color}15`
                                                }}>
                                                    {formatLogAction(log.acao).label}
                                                </span>
                                            </td>
                                            <td data-label="Tabela">{formatTableName(log.tabela)}</td>
                                            <td data-label="Detalhes">
                                                <button
                                                    className="btn-secondary"
                                                    style={{ fontSize: '0.7rem', padding: '0.2rem 0.4rem' }}
                                                    onClick={() => {
                                                        const detalhes = {
                                                            antes: log.dados_antigos,
                                                            depois: log.dados_novos
                                                        };
                                                        alert(JSON.stringify(detalhes, null, 2));
                                                    }}
                                                >
                                                    Ver Alterações
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {showEmpresaModal && (
                <EmpresaModal
                    empresa={editingEmpresa}
                    onClose={() => setShowEmpresaModal(false)}
                    onSave={handleSaveEmpresa}
                />
            )}

            {showUsuarioModal && editingUsuario && (
                <UsuarioModal
                    usuario={editingUsuario}
                    empresas={empresas}
                    onClose={() => setShowUsuarioModal(false)}
                    onSave={handleSaveUsuario}
                />
            )}
        </div>
    );
}

export default AdminPage;

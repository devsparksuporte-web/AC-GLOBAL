import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { PageTransition } from '../PageTransition/PageTransition';
import './Layout.css';

// Icons
const MenuIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="3" y1="12" x2="21" y2="12"></line>
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <line x1="3" y1="18" x2="21" y2="18"></line>
    </svg>
);

const CloseIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);

// Icons
const SnowflakeIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="2" x2="12" y2="22"></line>
        <path d="M20 16l-4-4 4-4"></path>
        <path d="M4 8l4 4-4 4"></path>
        <line x1="2" y1="12" x2="22" y2="12"></line>
        <path d="M16 4l-4 4-4-4"></path>
        <path d="M8 20l4-4 4 4"></path>
    </svg>
);

const HomeIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
        <polyline points="9 22 9 12 15 12 15 22"></polyline>
    </svg>
);

const UsersIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
);

const ClipboardIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
        <path d="M12 11h4"></path>
        <path d="M12 16h4"></path>
        <path d="M8 11h.01"></path>
        <path d="M8 16h.01"></path>
    </svg>
);

const CalendarIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
);

const PackageIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16.5 9.4 7.55 4.24"></path>
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
        <polyline points="3.29 7 12 12 20.71 7"></polyline>
        <line x1="12" y1="22" x2="12" y2="12"></line>
    </svg>
);

const BarChartIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="20" x2="12" y2="10"></line>
        <line x1="18" y1="20" x2="18" y2="4"></line>
        <line x1="6" y1="20" x2="6" y2="16"></line>
    </svg>
);

const TrendingUpIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
        <polyline points="17 6 23 6 23 12"></polyline>
    </svg>
);

const SettingsIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
        <circle cx="12" cy="12" r="3"></circle>
    </svg>
);

const BellIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path>
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path>
    </svg>
);

const LogOutIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
        <polyline points="16 17 21 12 16 7"></polyline>
        <line x1="21" y1="12" x2="9" y2="12"></line>
    </svg>
);

const FileTextIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <polyline points="10 9 9 9 8 9"></polyline>
    </svg>
);

const ShieldIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
    </svg>
);
const DollarSignIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23"></line>
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
    </svg>
);

const GiftIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 12 20 22 4 22 4 12"></polyline>
        <rect x="2" y="7" width="20" height="5"></rect>
        <line x1="12" y1="22" x2="12" y2="7"></line>
        <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path>
        <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path>
    </svg>
);

const ShieldCheckIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
        <path d="m9 12 2 2 4-4"></path>
    </svg>
);
const BookOpenIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a4 4 0 0 0-4-4H2z"></path>
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a4 4 0 0 1 4-4h6z"></path>
    </svg>
);
const CheckCircleIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
);
const LeafIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 3.5 1.08 9.2a7 7 0 0 1-9.08 8.8Z"></path>
        <path d="M11 20c-1-3.5 0-6 2.5-8.5"></path>
    </svg>
);

const BriefcaseIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
    </svg>
);

const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: HomeIcon },
    { path: '/agenda', label: 'Agenda', icon: CalendarIcon },
    { path: '/clientes', label: 'Clientes', icon: UsersIcon },
    { path: '/ordens', label: 'Ordens de Serviço', icon: ClipboardIcon },
    { path: '/orcamentos', label: 'Orçamentos', icon: DollarSignIcon },
    { path: '/estoque', label: 'Estoque', icon: PackageIcon },
];

const clientItems = [
    { path: '/portal', label: 'Meu Portal', icon: HomeIcon },
    { path: '/portal/agendar', label: 'Agendar Serviço', icon: CalendarIcon },
];

const managementItems = [
    { path: '/fornecedores', label: 'Fornecedores', icon: UsersIcon },
    { path: '/contratos', label: 'Contratos', icon: FileTextIcon },
    { path: '/preventiva', label: 'Preventiva (PMOC)', icon: ShieldIcon },
    { path: '/faturamento', label: 'Faturamento', icon: DollarSignIcon },
    { path: '/integracao', label: 'Integração Fornecedores', icon: PackageIcon },
    { path: '/fidelidade', label: 'Fidelidade', icon: GiftIcon },
    { path: '/conformidade', label: 'Riscos e Conformidade', icon: ShieldCheckIcon },
    { path: '/educacao', label: 'Academia', icon: BookOpenIcon },
    { path: '/sustentabilidade', label: 'Sustentabilidade', icon: LeafIcon },
    { path: '/marketplace', label: 'Marketplace Técnicos', icon: BriefcaseIcon },
];
const systemItems = [
    { path: '/conhecimento', label: 'Base de Conhecimento', icon: BookOpenIcon },
    { path: '/qualidade', label: 'Gestão de Qualidade', icon: CheckCircleIcon },
    { path: '/relatorios', label: 'Relatórios', icon: BarChartIcon },
    { path: '/performance', label: 'Análise Preditiva', icon: TrendingUpIcon },
    { path: '/configuracoes', label: 'Configurações', icon: SettingsIcon },
];

export function Layout() {
    const { user, userProfile, signOut } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    // Fechar sidebar ao mudar de rota (mobile)
    useEffect(() => {
        setIsSidebarOpen(false);
    }, [location.pathname]);

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    const getUserInitials = () => {
        if (userProfile?.nome) return userProfile.nome.charAt(0).toUpperCase();
        if (user?.email) return user.email.charAt(0).toUpperCase();
        return 'U';
    };

    const getUserName = () => {
        return userProfile?.nome || 'Usuário';
    };

    const getUserRole = () => {
        const role = userProfile?.role || 'tecnico';
        return role.charAt(0).toUpperCase() + role.slice(1);
    };

    const getEmpresaName = () => {
        return userProfile?.empresa?.nome || 'AC Global';
    };

    const getPageTitle = () => {
        const allItems = [...menuItems, ...managementItems, ...systemItems];
        const currentItem = allItems.find(item => item.path === location.pathname);
        return currentItem?.label || 'Dashboard';
    };

    // Bottom Navigation Items (Mobile only)
    const bottomNavItems = [
        { path: userProfile?.role === 'cliente' ? '/portal' : '/dashboard', label: 'Início', icon: HomeIcon },
        { path: '/agenda', label: 'Agenda', icon: CalendarIcon },
        ...(userProfile?.role !== 'cliente' ? [{ path: '/ordens', label: 'OS', icon: ClipboardIcon }] : []),
        { path: '/configuracoes', label: 'Ajustes', icon: SettingsIcon },
    ];

    return (
        <div className={`app-layout ${isSidebarOpen ? 'sidebar-open' : ''}`}>
            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />
            )}

            {/* Sidebar */}
            <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <div className="sidebar-logo" onClick={() => navigate(userProfile?.role === 'cliente' ? '/portal' : '/dashboard')}>
                        <div className="sidebar-logo-icon">
                            <SnowflakeIcon />
                        </div>
                        <div className="sidebar-logo-text">
                            <span className="sidebar-logo-title">{getEmpresaName()}</span>
                            <span className="sidebar-logo-subtitle">Suporte Técnico</span>
                        </div>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    {userProfile?.role === 'cliente' && (
                        <div className="nav-section">
                            <div className="nav-section-title">Meu Atendimento</div>
                            {clientItems.map(item => (
                                <div
                                    key={item.path}
                                    className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                                    onClick={() => navigate(item.path)}
                                    title={item.label}
                                >
                                    <span className="nav-item-icon"><item.icon /></span>
                                    <span className="nav-item-label">{item.label}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {userProfile?.role !== 'cliente' && (
                        <div className="nav-section">
                            <div className="nav-section-title">Operacional</div>
                            {menuItems
                                .filter(item => {
                                    if (!userProfile) return ['Dashboard', 'Agenda'].includes(item.label);
                                    if (userProfile.role === 'tecnico') {
                                        return ['Dashboard', 'Agenda', 'Ordens de Serviço'].includes(item.label);
                                    }
                                    if (item.label === 'Orçamentos') {
                                        return userProfile.role === 'admin' || userProfile.role === 'super_admin';
                                    }
                                    return true;
                                })
                                .map(item => (
                                    <div
                                        key={item.path}
                                        className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                                        onClick={() => navigate(item.path)}
                                        title={item.label}
                                    >
                                        <span className="nav-item-icon"><item.icon /></span>
                                        <span className="nav-item-label">{item.label}</span>
                                    </div>
                                ))}
                        </div>
                    )}

                    {(userProfile?.role === 'admin' || userProfile?.role === 'super_admin') && (
                        <div className="nav-section">
                            <div className="nav-section-title">Gestão</div>
                            {managementItems.map(item => (
                                <div
                                    key={item.path}
                                    className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                                    onClick={() => navigate(item.path)}
                                    title={item.label}
                                >
                                    <span className="nav-item-icon"><item.icon /></span>
                                    <span className="nav-item-label">{item.label}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {userProfile?.role !== 'cliente' && (
                        <div className="nav-section">
                            <div className="nav-section-title">Sistema</div>
                            {systemItems
                                .filter(item => {
                                    if (!userProfile) return item.label === 'Configurações';
                                    if (userProfile.role === 'tecnico') {
                                        return item.label === 'Configurações';
                                    }
                                    return true;
                                })
                                .map(item => (
                                    <div
                                        key={item.path}
                                        className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                                        onClick={() => navigate(item.path)}
                                        title={item.label}
                                    >
                                        <span className="nav-item-icon"><item.icon /></span>
                                        <span className="nav-item-label">{item.label}</span>
                                    </div>
                                ))}
                        </div>
                    )}

                    {(userProfile?.role === 'super_admin' || userProfile?.role === 'admin') && (
                        <div className="nav-section">
                            <div className="nav-section-title">Administração</div>
                            {userProfile.role === 'super_admin' && (
                                <div
                                    className={`nav-item ${location.pathname === '/admin' && (location.hash === '' || location.hash === '#empresas') ? 'active' : ''}`}
                                    onClick={() => navigate('/admin#empresas')}
                                    title="Empresas"
                                >
                                    <span className="nav-item-icon"><ShieldIcon /></span>
                                    <span className="nav-item-label">Empresas</span>
                                </div>
                            )}
                            <div
                                className={`nav-item ${location.pathname === '/admin' && (location.hash === '#usuarios' || (userProfile.role === 'admin' && location.hash === '')) ? 'active' : ''}`}
                                onClick={() => navigate('/admin#usuarios')}
                                title={userProfile.role === 'admin' ? 'Equipe' : 'Usuários'}
                            >
                                <span className="nav-item-icon"><UsersIcon /></span>
                                <span className="nav-item-label">{userProfile.role === 'admin' ? 'Equipe' : 'Usuários'}</span>
                            </div>
                        </div>
                    )}
                </nav>

                <div className="sidebar-footer">
                    <div className="user-info">
                        <div className="user-avatar">{getUserInitials()}</div>
                        <div className="user-details">
                            <div className="user-name">{getUserName()}</div>
                            <div className="user-email">
                                {getUserRole()}
                            </div>
                        </div>
                        <button className="logout-button" onClick={handleLogout} title="Sair">
                            <LogOutIcon />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                <header className="main-header">
                    <div className="header-left">
                        <button
                            className="mobile-menu-toggle"
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            aria-label="Menu"
                        >
                            {isSidebarOpen ? <CloseIcon /> : <MenuIcon />}
                        </button>
                        <h1 className="header-title">{getPageTitle()}</h1>
                    </div>
                    <div className="header-actions">
                        <button className="header-icon-button">
                            <BellIcon />
                        </button>
                    </div>
                </header>

                <div className="content-area">
                    <AnimatePresence mode="wait">
                        <PageTransition key={location.pathname}>
                            <Outlet />
                        </PageTransition>
                    </AnimatePresence>
                </div>

                {/* Bottom Navigation (Mobile Only) */}
                <nav className="bottom-nav">
                    {bottomNavItems.map(item => (
                        <div
                            key={item.path}
                            className={`bottom-nav-item ${location.pathname === item.path ? 'active' : ''}`}
                            onClick={() => navigate(item.path)}
                        >
                            <span className="bottom-nav-icon"><item.icon /></span>
                            <span className="bottom-nav-label">{item.label}</span>
                        </div>
                    ))}
                </nav>
            </main>
        </div>
    );
}

export default Layout;

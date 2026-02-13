import { useAuth } from '../../hooks/useAuth';
import './Dashboard.css';

// Icons as SVG components
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

export function Dashboard() {
    const { user, signOut } = useAuth();

    const handleLogout = async () => {
        await signOut();
    };

    const getUserInitials = () => {
        if (!user?.email) return 'U';
        return user.email.charAt(0).toUpperCase();
    };

    return (
        <div className="dashboard-page">
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        <div className="sidebar-logo-icon">
                            <SnowflakeIcon />
                        </div>
                        <div className="sidebar-logo-text">
                            <span className="sidebar-logo-title">AC Global</span>
                            <span className="sidebar-logo-subtitle">Suporte Técnico</span>
                        </div>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <div className="nav-section">
                        <div className="nav-section-title">Menu</div>
                        <div className="nav-item active">
                            <span className="nav-item-icon"><HomeIcon /></span>
                            Dashboard
                        </div>
                        <div className="nav-item">
                            <span className="nav-item-icon"><UsersIcon /></span>
                            Clientes
                        </div>
                        <div className="nav-item">
                            <span className="nav-item-icon"><ClipboardIcon /></span>
                            Ordens de Serviço
                        </div>
                        <div className="nav-item">
                            <span className="nav-item-icon"><CalendarIcon /></span>
                            Agenda
                        </div>
                        <div className="nav-item">
                            <span className="nav-item-icon"><PackageIcon /></span>
                            Estoque
                        </div>
                    </div>

                    <div className="nav-section">
                        <div className="nav-section-title">Sistema</div>
                        <div className="nav-item">
                            <span className="nav-item-icon"><BarChartIcon /></span>
                            Relatórios
                        </div>
                        <div className="nav-item">
                            <span className="nav-item-icon"><SettingsIcon /></span>
                            Configurações
                        </div>
                    </div>
                </nav>

                <div className="sidebar-footer">
                    <div className="user-info">
                        <div className="user-avatar">{getUserInitials()}</div>
                        <div className="user-details">
                            <div className="user-name">Usuário</div>
                            <div className="user-email">{user?.email || 'email@exemplo.com'}</div>
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
                    <h1 className="header-title">Dashboard</h1>
                    <div className="header-actions">
                        <button className="header-icon-button">
                            <BellIcon />
                        </button>
                    </div>
                </header>

                <div className="content-area">
                    <div className="welcome-card">
                        <h2 className="welcome-title">Bem-vindo ao AC Global Suporte!</h2>
                        <p className="welcome-subtitle">
                            Gerencie suas ordens de serviço, clientes e agenda em um só lugar.
                        </p>
                    </div>

                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-header">
                                <div className="stat-icon blue">
                                    <ClipboardIcon />
                                </div>
                            </div>
                            <div className="stat-value">12</div>
                            <div className="stat-label">Ordens Abertas</div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-header">
                                <div className="stat-icon green">
                                    <UsersIcon />
                                </div>
                            </div>
                            <div className="stat-value">48</div>
                            <div className="stat-label">Clientes Ativos</div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-header">
                                <div className="stat-icon orange">
                                    <CalendarIcon />
                                </div>
                            </div>
                            <div className="stat-value">5</div>
                            <div className="stat-label">Agendamentos Hoje</div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-header">
                                <div className="stat-icon purple">
                                    <PackageIcon />
                                </div>
                            </div>
                            <div className="stat-value">23</div>
                            <div className="stat-label">Itens em Estoque</div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default Dashboard;

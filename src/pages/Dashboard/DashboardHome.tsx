import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { clientesService } from '../../services/clientesService';
import { ordensService } from '../../services/ordensService';
import { adminService } from '../../services/adminService';
import type { OrdemServico } from '../../types';
import './DashboardHome.css';

// Icons
const BuildingIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
        <line x1="9" y1="22" x2="9" y2="22.01"></line>
        <line x1="15" y1="22" x2="15" y2="22.01"></line>
        <line x1="12" y1="22" x2="12" y2="22.01"></line>
        <line x1="12" y1="2" x2="12" y2="22"></line>
    </svg>
);

const UsersIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
);

const ToolsIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
    </svg>
);

const AlertCircleIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
    </svg>
);

const PlusIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
);

const ChevronRightIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
);

interface DashboardStats {
    totalEmpresas: number;
    totalUsuarios: number;
    totalClientes: number;
    ordensAbertas: number;
    ordensEmAndamento: number;
    ordensConcluidas: number;
    ordensCanceladas: number;
}

export function DashboardHome() {
    const navigate = useNavigate();
    const { isSuperAdmin, userProfile } = useAuth();
    const [stats, setStats] = useState<DashboardStats>({
        totalEmpresas: 0,
        totalUsuarios: 0,
        totalClientes: 0,
        ordensAbertas: 0,
        ordensEmAndamento: 0,
        ordensConcluidas: 0,
        ordensCanceladas: 0,
    });
    const [recentOrders, setRecentOrders] = useState<OrdemServico[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (userProfile?.role === 'cliente') {
            navigate('/portal');
        }
    }, [userProfile, navigate]);

    useEffect(() => {
        const carregarDados = async () => {
            try {
                // Estatísticas de Ordens (Comum a todos)
                const ordensStats = await ordensService.estatisticas();
                const ordensRecentes = await ordensService.listarRecentes(5);
                const totalClientes = await clientesService.contar();

                // Dados específicos de Super Admin
                let totalEmpresas = 0;
                let totalUsuarios = 0;

                if (isSuperAdmin) {
                    const empresas = await adminService.listarEmpresas();
                    const usuarios = await adminService.listarUsuarios();
                    totalEmpresas = empresas.length;
                    totalUsuarios = usuarios.length;
                }

                setStats({
                    totalEmpresas,
                    totalUsuarios,
                    totalClientes,
                    ordensAbertas: ordensStats.abertas,
                    ordensEmAndamento: ordensStats.emAndamento,
                    ordensConcluidas: ordensStats.concluidas,
                    ordensCanceladas: ordensStats.canceladas,
                });
                setRecentOrders(ordensRecentes);
            } catch (error) {
                console.error('Erro ao carregar dashboard:', error);
            } finally {
                setLoading(false);
            }
        };

        carregarDados();
    }, [isSuperAdmin]);

    // Dados para o Gráfico de Rosca
    const totalOrdens = stats.ordensAbertas + stats.ordensEmAndamento + stats.ordensConcluidas + stats.ordensCanceladas;
    const getPercent = (value: number) => totalOrdens > 0 ? (value / totalOrdens) * 100 : 0;

    // Configuração do Conic Gradient para o gráfico
    const pieChartGradient = totalOrdens > 0
        ? `conic-gradient(
            #3b82f6 0% ${getPercent(stats.ordensEmAndamento)}%,
            #fbbf24 ${getPercent(stats.ordensEmAndamento)}% ${getPercent(stats.ordensEmAndamento) + getPercent(stats.ordensAbertas)}%,
            #10b981 ${getPercent(stats.ordensEmAndamento) + getPercent(stats.ordensAbertas)}% ${getPercent(stats.ordensEmAndamento) + getPercent(stats.ordensAbertas) + getPercent(stats.ordensConcluidas)}%,
            #ef4444 ${getPercent(stats.ordensEmAndamento) + getPercent(stats.ordensAbertas) + getPercent(stats.ordensConcluidas)}% 100%
        )`
        : `conic-gradient(#e2e8f0 0% 100%)`;

    return (
        <div className="dashboard-container">
            {/* Header Section */}
            <div className="dashboard-header">
                <div>
                    <h1 className="dashboard-title">Dashboard</h1>
                    <p className="dashboard-subtitle">Visão geral • {userProfile?.empresa?.nome || 'Sistema'}</p>
                </div>
                <div className="header-actions">
                    <button className="btn-primary" onClick={() => navigate('/ordens')}>
                        <PlusIcon /> Chamado
                    </button>
                </div>
            </div>

            {/* Summary Cards Row */}
            <div className="summary-cards horizontal-scroll hide-scrollbar">
                {isSuperAdmin && (
                    <>
                        <div className="summary-card">
                            <div className="card-icon blue">
                                <BuildingIcon />
                            </div>
                            <div className="card-info">
                                <span className="card-value">{loading ? '-' : stats.totalEmpresas}</span>
                                <span className="card-label">Empresas Ativas</span>
                            </div>
                        </div>
                        <div className="summary-card">
                            <div className="card-icon indigo">
                                <UsersIcon />
                            </div>
                            <div className="card-info">
                                <span className="card-value">{loading ? '-' : stats.totalUsuarios}</span>
                                <span className="card-label">Usuários Cadastrados</span>
                            </div>
                        </div>
                    </>
                )}
                <div className="summary-card">
                    <div className="card-icon blue-light">
                        <ToolsIcon />
                    </div>
                    <div className="card-info">
                        <span className="card-value">__</span>
                        {/* Placeholder para Equipamentos se não tivermos contagem real */}
                        <span className="card-label">Equipamentos</span>
                    </div>
                </div>
                <div className="summary-card">
                    <div className="card-icon red-light">
                        <AlertCircleIcon />
                    </div>
                    <div className="card-info">
                        <span className="card-value">{loading ? '-' : stats.ordensAbertas}</span>
                        <span className="card-label">Ordens Pendentes</span>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="dashboard-grid">
                {/* Left Column: Chart */}
                <div className="dashboard-section chart-section">
                    <div className="section-header">
                        <h3>Status das OS</h3>
                        <button className="btn-icon-small"><PlusIcon /></button>
                    </div>
                    <div className="chart-container">
                        <div className="donut-chart" style={{ background: pieChartGradient }}>
                            <div className="donut-hole">
                                <span className="chart-total">{totalOrdens}</span>
                            </div>
                        </div>
                        <div className="chart-legend">
                            <div className="legend-item">
                                <span className="dot blue"></span>
                                <span className="label">Em andamento</span>
                                <span className="value">{getPercent(stats.ordensEmAndamento).toFixed(0)}%</span>
                            </div>
                            <div className="legend-item">
                                <span className="dot yellow"></span>
                                <span className="label">Pendente</span>
                                <span className="value">{getPercent(stats.ordensAbertas).toFixed(0)}%</span>
                            </div>
                            <div className="legend-item">
                                <span className="dot green"></span>
                                <span className="label">Concluída</span>
                                <span className="value">{getPercent(stats.ordensConcluidas).toFixed(0)}%</span>
                            </div>
                            <div className="legend-item">
                                <span className="dot red"></span>
                                <span className="label">Cancelada</span>
                                <span className="value">{getPercent(stats.ordensCanceladas).toFixed(0)}%</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Recent Activity */}
                <div className="dashboard-section activity-section">
                    <div className="section-header">
                        <h3>{userProfile?.role === 'tecnico' ? 'Minhas Ordens de Serviço' : 'Chamados recentes'}</h3>
                        <button className="btn-link" onClick={() => navigate('/ordens')}>Ver todos <ChevronRightIcon /></button>
                    </div>
                    <div className="activity-list">
                        {loading ? (
                            <p className="loading-text">Carregando...</p>
                        ) : recentOrders.length === 0 ? (
                            <p className="empty-text">Nenhum chamado recente.</p>
                        ) : userProfile?.role === 'tecnico' ? (
                            <div className="tec-orders-list">
                                {recentOrders.map(order => (
                                    <div key={order.id} className="activity-item tec-order-item">
                                        <div className="activity-info">
                                            <span className="activity-title">{order.descricao || `Chamado #${order.numero}`}</span>
                                            <span className="activity-subtitle">
                                                <strong>Destino:</strong> {order.cliente?.nome}
                                                {order.cliente?.cidade ? ` • ${order.cliente.cidade}` : ''}
                                                {order.cliente?.endereco ? ` (${order.cliente.endereco})` : ''}
                                            </span>
                                            <span className="activity-date">{new Date(order.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <div className="activity-badge-container">
                                            <span className={`status-badge ${order.status}`}>
                                                {order.status.replace('_', ' ')}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            recentOrders.map(order => (
                                <div key={order.id} className="activity-item">
                                    <div className="activity-info">
                                        <span className="activity-title">{order.descricao || `Chamado #${order.numero}`}</span>
                                        <span className="activity-subtitle">{order.cliente?.nome} • {new Date(order.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <span className={`status-badge ${order.status}`}>
                                        {order.status.replace('_', ' ')}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DashboardHome;

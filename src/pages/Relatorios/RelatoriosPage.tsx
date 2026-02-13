import { useState, useEffect } from 'react';
import { relatoriosService, type RelatorioFaturamento, type RelatorioServicos, type RelatorioCliente } from '../../services/relatoriosService';
import type { TipoOrdem } from '../../types';
import './Relatorios.css';

// Icons
const BarChartIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="20" x2="12" y2="10"></line>
        <line x1="18" y1="20" x2="18" y2="4"></line>
        <line x1="6" y1="20" x2="6" y2="16"></line>
    </svg>
);

const PieChartIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M16.2 7.8l-2 6.3-6.4 2.1 2-6.3z"></path>
    </svg>
);

const TrendingUpIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
        <polyline points="16 7 22 7 22 13"></polyline>
    </svg>
);

export function RelatoriosPage() {
    const [loading, setLoading] = useState(true);
    const [faturamento, setFaturamento] = useState<RelatorioFaturamento[]>([]);
    const [servicos, setServicos] = useState<RelatorioServicos[]>([]);
    const [topClientes, setTopClientes] = useState<RelatorioCliente[]>([]);
    const [resumo, setResumo] = useState({
        faturamentoTotal: 0,
        ordensConcluidas: 0,
        ticketMedio: 0
    });

    useEffect(() => {
        const carregarDados = async () => {
            try {
                setLoading(true);
                const [fatData, servData, cliData, resData] = await Promise.all([
                    relatoriosService.faturamentoSemestral(),
                    relatoriosService.servicosPorTipo(),
                    relatoriosService.topClientes(),
                    relatoriosService.resumoGeral()
                ]);

                setFaturamento(fatData);
                setServicos(servData);
                setTopClientes(cliData);
                setResumo(resData);
            } catch (error) {
                console.error('Erro ao carregar relatórios:', error);
            } finally {
                setLoading(false);
            }
        };

        carregarDados();
    }, []);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    };

    const getTipoLabel = (tipo: TipoOrdem) => {
        const labels = {
            instalacao: 'Instalação',
            manutencao: 'Manutenção',
            reparo: 'Reparo',
            limpeza: 'Limpeza'
        };
        return labels[tipo] || tipo;
    };

    // Calcular percentuais para barras com segurança contra divisão por zero
    const maxFaturamento = Math.max(...faturamento.map(f => f.valor), 1);
    const maxServicoValor = Math.max(...servicos.map(s => s.valor), 1);
    const maxClienteValor = Math.max(...topClientes.map(c => c.valor_total), 1);

    if (loading) {
        return (
            <div className="table-container">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="relatorios-page">
            <div className="page-header">
                <h1 className="page-title">Relatórios Gerenciais</h1>
            </div>

            <div className="summary-stats">
                <div className="stat-box">
                    <div className="stat-box-label">Faturamento Total</div>
                    <div className="stat-box-value">{formatCurrency(resumo.faturamentoTotal)}</div>
                </div>
                <div className="stat-box">
                    <div className="stat-box-label">Ordens Concluídas</div>
                    <div className="stat-box-value">{resumo.ordensConcluidas}</div>
                </div>
                <div className="stat-box">
                    <div className="stat-box-label">Ticket Médio</div>
                    <div className="stat-box-value">{formatCurrency(resumo.ticketMedio)}</div>
                </div>
            </div>

            <div className="reports-grid">
                {/* Gráfico de Faturamento */}
                <div className="report-card full-width">
                    <div className="card-header">
                        <TrendingUpIcon />
                        <h3 className="card-title">Faturamento Semestral</h3>
                    </div>
                    <div className="financial-chart">
                        {faturamento.map((item, index) => (
                            <div key={index} className="bar-group">
                                <div
                                    className="bar-column"
                                    style={{ height: `${(item.valor / maxFaturamento) * 100}%` }}
                                >
                                    <div className="bar-tooltip">{formatCurrency(item.valor)}</div>
                                </div>
                                <div className="bar-label">{item.mes}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Serviços por Tipo */}
                <div className="report-card">
                    <div className="card-header">
                        <PieChartIcon />
                        <h3 className="card-title">Receita por Serviço</h3>
                    </div>
                    <div className="chart-list">
                        {servicos.length === 0 ? (
                            <div style={{ color: '#666', textAlign: 'center', padding: '1rem' }}>Sem dados</div>
                        ) : servicos.map((servico, index) => (
                            <div key={index} className="chart-item">
                                <div className="chart-item-header">
                                    <span>{getTipoLabel(servico.tipo)} ({servico.quantidade})</span>
                                    <span>{formatCurrency(servico.valor)}</span>
                                </div>
                                <div className="progress-bar-bg">
                                    <div
                                        className={`progress-bar-fill ${servico.tipo}`}
                                        style={{ width: `${(servico.valor / maxServicoValor) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Clientes */}
                <div className="report-card">
                    <div className="card-header">
                        <BarChartIcon />
                        <h3 className="card-title">Top 5 Clientes</h3>
                    </div>
                    <div className="chart-list">
                        {topClientes.length === 0 ? (
                            <div style={{ color: '#666', textAlign: 'center', padding: '1rem' }}>Sem dados</div>
                        ) : topClientes.map((cliente, index) => (
                            <div key={index} className="chart-item">
                                <div className="chart-item-header">
                                    <span>{cliente.nome}</span>
                                    <span>{formatCurrency(cliente.valor_total)}</span>
                                </div>
                                <div className="progress-bar-bg">
                                    <div
                                        className="progress-bar-fill"
                                        style={{
                                            width: `${(cliente.valor_total / maxClienteValor) * 100}%`,
                                            background: '#6366f1'
                                        }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default RelatoriosPage;

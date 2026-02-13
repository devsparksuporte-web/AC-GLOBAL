import { useState, useEffect } from 'react';
import { performanceService, type PrevisaoDemanda, type InsightTime, type PrevisaoEstoque } from '../../services/performanceService';
import { weatherService } from '../../services/weatherService';
import type { WeatherData, ClimateAlert, DailyForecast } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import './Performance.css';

// Icons
const TrendIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
        <polyline points="17 6 23 6 23 12"></polyline>
    </svg>
);

const UserPlusIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="8.5" cy="7" r="4"></circle>
        <line x1="20" y1="8" x2="20" y2="14"></line>
        <line x1="17" y1="11" x2="23" y2="11"></line>
    </svg>
);

const AlertTriangleIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
        <line x1="12" y1="9" x2="12" y2="13"></line>
        <line x1="12" y1="17" x2="12.01" y2="17"></line>
    </svg>
);

const PackageIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
        <line x1="12" y1="22.08" x2="12" y2="12"></line>
    </svg>
);

const CloudRainIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 13a4 4 0 0 1-8 0 4 4 0 0 1 0-8c2.1 0 3.1 1 4 2 1.1 0 2.1 1 3 2.1a4 4 0 0 1 1 3.9z"></path>
        <path d="M12 15v3"></path>
        <path d="M8 17v2"></path>
        <path d="M16 17v2"></path>
    </svg>
);

export function PerformancePage() {
    const { userProfile } = useAuth();
    const [loading, setLoading] = useState(true);
    const [demandData, setDemandData] = useState<PrevisaoDemanda[]>([]);
    const [teamInsight, setTeamInsight] = useState<InsightTime | null>(null);
    const [stockPredictions, setStockPredictions] = useState<PrevisaoEstoque[]>([]);
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [climateAlerts, setClimateAlerts] = useState<ClimateAlert[]>([]);

    useEffect(() => {
        const carregarDados = async () => {
            try {
                setLoading(true);

                // Coordenadas padrão (São Paulo) se o perfil não tiver
                const lat = userProfile?.latitude || -23.5505;
                const lon = userProfile?.longitude || -46.6333;

                const [demand, team, stock, weatherData] = await Promise.all([
                    performanceService.getDemandForecast(),
                    performanceService.getTeamOptimization(),
                    performanceService.getStockPrediction(),
                    weatherService.getWeather(lat, lon)
                ]);

                setDemandData(demand);
                setTeamInsight(team);
                setStockPredictions(stock);
                setWeather(weatherData);
                setClimateAlerts(weatherService.getAlerts(weatherData));
            } catch (error) {
                console.error('Erro ao carregar dados de performance:', error);
            } finally {
                setLoading(false);
            }
        };

        carregarDados();
    }, [userProfile?.latitude, userProfile?.longitude]);

    const maxVal = Math.max(...demandData.map(d => Math.max(d.historico, d.previsto)), 1);

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
        <div className="performance-page">
            <div className="performance-header">
                <h1 className="page-title">Análise de Performance & Projeções</h1>
            </div>

            <div className="insights-grid">
                {/* Capacidade do Time */}
                {teamInsight && (
                    <div className={`insight-card ${teamInsight.recomendacao}`}>
                        <div className="insight-header">
                            <div className="insight-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>
                                <UserPlusIcon />
                            </div>
                            <span className="insight-title">Capacidade da Equipe</span>
                        </div>
                        <div className="insight-value">
                            {teamInsight.tecnicosAtuais}
                            <span className="insight-unit">Técnicos Ativos</span>
                        </div>
                        <p className="insight-message">{teamInsight.mensagem}</p>
                    </div>
                )}

                {/* Peças Críticas */}
                <div className="insight-card critico">
                    <div className="insight-header">
                        <div className="insight-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                            <AlertTriangleIcon />
                        </div>
                        <span className="insight-title">Peças em Risco</span>
                    </div>
                    <div className="insight-value">
                        {stockPredictions.filter(p => p.nivel_critico).length}
                        <span className="insight-unit">Itens para Reposição</span>
                    </div>
                    <p className="insight-message">Baseado no ritmo de consumo dos últimos 60 dias.</p>
                </div>

                {/* Previsão do Tempo */}
                {weather && (
                    <div className="insight-card weather-card">
                        <div className="insight-header">
                            <div className="insight-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                                <CloudRainIcon />
                            </div>
                            <span className="insight-title">Clima Local</span>
                        </div>
                        <div className="insight-value">
                            {weather.temperature}°C
                            <span className="insight-unit">{weather.condition}</span>
                        </div>
                        <div className="weather-forecast-mini">
                            {weather.forecast.slice(1, 4).map((d: DailyForecast, i: number) => (
                                <div key={i} className="forecast-day">
                                    <span>{new Date(d.date).toLocaleDateString('pt-BR', { weekday: 'short' })}</span>
                                    <strong>{d.maxTemp}°</strong>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Alertas Climáticos */}
            {climateAlerts.length > 0 && (
                <div className="climate-alerts-section">
                    {climateAlerts.map((alert, i) => (
                        <div key={i} className={`climate-alert ${alert.severity}`}>
                            <div className="alert-header">
                                <AlertTriangleIcon />
                                <strong>{alert.type === 'heatwave' ? 'Onda de Calor' : 'Alerta Meteorológico'}</strong>
                            </div>
                            <div className="alert-content">
                                <p>{alert.description}</p>
                                <div className="alert-suggestion">
                                    <strong>Ação Proativa:</strong> {alert.suggestion}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Gráfico de Previsão de Demanda */}
            <div className="forecast-section">
                <div className="section-header">
                    <div className="insight-header">
                        <TrendIcon />
                        <h3 className="insight-title">Previsão de Demanda Mensal</h3>
                    </div>
                    <div className="chart-legend">
                        <div className="legend-item">
                            <div className="legend-color" style={{ background: 'var(--color-primary)' }}></div>
                            <span>Histórico</span>
                        </div>
                        <div className="legend-item">
                            <div className="legend-color previsto"></div>
                            <span>Previsão</span>
                        </div>
                    </div>
                </div>

                <div className="chart-container horizontal-scroll hide-scrollbar">
                    {demandData.map((d, i) => (
                        <div key={i} className="chart-bar-group">
                            {d.historico > 0 && (
                                <div
                                    className="chart-bar historico"
                                    style={{ height: `${(d.historico / maxVal) * 80}%` }}
                                >
                                    <div className="chart-bar-tooltip">{d.historico} OS</div>
                                </div>
                            )}
                            {d.previsto > 0 && (
                                <div
                                    className="chart-bar previsto"
                                    style={{ height: `${(d.previsto / maxVal) * 80}%` }}
                                >
                                    <div className="chart-bar-tooltip">{d.previsto} OS (Projeção)</div>
                                </div>
                            )}
                            <span className="chart-label">{d.mes}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Tabela de Previsão de Estoque */}
            <div className="stock-table-card">
                <div className="card-title-container">
                    <PackageIcon />
                    <h3 className="insight-title">Projeção de Ruptura de Estoque</h3>
                </div>
                <div className="table-container" style={{ margin: 0, boxShadow: 'none' }}>
                    <table className="stock-table">
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th>Qtd Atual</th>
                                <th>Consumo Médio</th>
                                <th>Expectativa</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stockPredictions.length === 0 ? (
                                <tr>
                                    <td colSpan={4} style={{ textAlign: 'center', padding: '2rem' }}>Padrões de consumo não detectados ainda.</td>
                                </tr>
                            ) : stockPredictions.map((p) => (
                                <tr key={p.item_id}>
                                    <td style={{ fontWeight: 600 }}>{p.nome}</td>
                                    <td>{p.quantidade_atual}</td>
                                    <td>{p.consumo_diario} /dia</td>
                                    <td>
                                        <span className={`stock-badge ${p.dias_restantes < 15 ? 'critico' : 'alerta'}`}>
                                            {p.dias_restantes > 100 ? '+3 meses' : `${p.dias_restantes} dias`}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default PerformancePage;

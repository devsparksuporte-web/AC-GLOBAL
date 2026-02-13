import { useState, useEffect } from 'react';
import { clientePortalService } from '../../services/clientePortalService';
import { weatherService } from '../../services/weatherService';
import { useAuth } from '../../hooks/useAuth';
import type { Equipamento, OrdemServico, WeatherData, ClimateAlert, DailyForecast } from '../../types';
import { useNavigate } from 'react-router-dom';
import './ClientePortal.css';

// Icons
const AirVentIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 7L4 7"></path>
        <path d="M20 12L4 12"></path>
        <path d="M20 17L4 17"></path>
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

export default function ClienteDashboard() {
    const { userProfile } = useAuth();
    const [equipamentos, setEquipamentos] = useState<Equipamento[]>([]);
    const [historico, setHistorico] = useState<OrdemServico[]>([]);
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [alerts, setAlerts] = useState<ClimateAlert[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const loadData = async () => {
            try {
                const [eqs, hist] = await Promise.all([
                    clientePortalService.getMeusEquipamentos(),
                    clientePortalService.getHistoricoServicos()
                ]);
                setEquipamentos(eqs);
                setHistorico(hist);

                // Carregar clima (usando SP como default se não tiver lat/lon)
                const lat = userProfile?.latitude || -23.5505;
                const lon = userProfile?.longitude || -46.6333;
                const weatherData = await weatherService.getWeather(lat, lon);
                setWeather(weatherData);
                setAlerts(weatherService.getAlerts(weatherData));

            } catch (error) {
                console.error('Erro ao carregar dashboard do cliente:', error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [userProfile]);

    if (loading) return <div className="client-loading">Carregando seus dados...</div>;

    return (
        <div className="cliente-dashboard">
            <header className="client-header">
                <div>
                    <h1>Olá, {userProfile?.nome}!</h1>
                    <p>Bem-vindo ao seu portal de suporte técnico.</p>
                </div>
                <button className="btn-primary" onClick={() => navigate('/portal/agendar')}>
                    <CalendarIcon /> Agendar Novo Serviço
                </button>
            </header>

            {/* Alertas Climáticos */}
            {alerts.length > 0 && (
                <div className="client-alerts">
                    {alerts.map((alert, idx) => (
                        <div key={idx} className={`client-alert-card ${alert.type}`}>
                            <div className="alert-icon">⚠️</div>
                            <div className="alert-content">
                                <h3>{alert.title}</h3>
                                <p>{alert.description}</p>
                                <button className="btn-alert-action" onClick={() => navigate('/portal/agendar')}>
                                    Proteger Equipamentos Agora
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="client-grid">
                {/* Meus Equipamentos */}
                <section className="client-section">
                    <div className="section-header">
                        <h2>Meus Equipamentos</h2>
                        <span className="badge">{equipamentos.length} unidades</span>
                    </div>
                    <div className="equipment-list">
                        {equipamentos.length === 0 ? (
                            <p className="empty-state">Nenhum equipamento cadastrado.</p>
                        ) : (
                            equipamentos.map(eq => (
                                <div key={eq.id} className="equipment-card">
                                    <div className="eq-icon">
                                        <AirVentIcon />
                                    </div>
                                    <div className="eq-info">
                                        <h3>{eq.nome}</h3>
                                        <p>{eq.marca} {eq.modelo} - {eq.capacidade}</p>
                                        <div className="eq-meta">
                                            <span>📍 {eq.localizacao}</span>
                                            {eq.proxima_revisao && (
                                                <span className="revisao">📅 Próxima: {new Date(eq.proxima_revisao).toLocaleDateString()}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>

                {/* Histórico Recente */}
                <section className="client-section">
                    <div className="section-header">
                        <h2>Histórico de Serviços</h2>
                    </div>
                    <div className="history-list">
                        {historico.length === 0 ? (
                            <p className="empty-state">Nenhum serviço registrado.</p>
                        ) : (
                            historico.map(os => (
                                <div key={os.id} className="history-card">
                                    <div className="history-date">
                                        {new Date(os.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                                    </div>
                                    <div className="history-info">
                                        <h3>{os.equipamento || 'Serviço Geral'}</h3>
                                        <p>{os.descricao}</p>
                                        <span className={`status-badge ${os.status}`}>
                                            {os.status.replace('_', ' ')}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </div>

            {/* Widget de Clima */}
            {weather && (
                <div className="client-weather-widget">
                    <div className="weather-main">
                        <span className="temp">{Math.round(weather.temperature)}°C</span>
                        <span className="cond">{weather.condition}</span>
                    </div>
                    <div className="weather-forecast">
                        {weather.forecast.slice(1, 5).map((f: DailyForecast, i: number) => (
                            <div key={i} className="forecast-day">
                                <span>{new Date(f.date).toLocaleDateString('pt-BR', { weekday: 'short' })}</span>
                                <strong>{Math.round(f.maxTemp)}°</strong>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ordensService } from '../../services/ordensService';
import { preventivaService } from '../../services/preventivaService';
import { useAuth } from '../../hooks/useAuth';
import type { OrdemServico, Cliente, PlanoManutencao } from '../../types';
import '../Clientes/Clientes.css';
import './Agenda.css';

// Icons
const ChevronLeftIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6"></polyline>
    </svg>
);

const ChevronRightIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
);

const XIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

function getTipoLabel(tipo: string): string {
    const labels: Record<string, string> = {
        instalacao: 'Instalação',
        manutencao: 'Manutenção',
        reparo: 'Reparo',
        limpeza: 'Limpeza',
        preventiva: 'Preventiva (PMOC)'
    };
    return labels[tipo] || tipo;
}

interface CalendarEvent {
    id: string;
    date: Date;
    label: string;
    tipo: string;
    originalData: OrdemServico | PlanoManutencao;
}

interface CalendarDay {
    date: Date;
    isCurrentMonth: boolean;
    isToday: boolean;
    events: CalendarEvent[];
}

function getCalendarDays(year: number, month: number, events: CalendarEvent[]): CalendarDay[] {
    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Primeiro dia do mês
    const firstDay = new Date(year, month, 1);
    const startingDayOfWeek = firstDay.getDay();

    // Último dia do mês
    const lastDay = new Date(year, month + 1, 0);
    const totalDays = lastDay.getDate();

    // Dias do mês anterior
    const prevMonth = new Date(year, month, 0);
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
        const date = new Date(year, month - 1, prevMonth.getDate() - i);
        days.push({
            date,
            isCurrentMonth: false,
            isToday: false,
            events: getEventsForDate(date, events),
        });
    }

    // Dias do mês atual
    for (let i = 1; i <= totalDays; i++) {
        const date = new Date(year, month, i);
        days.push({
            date,
            isCurrentMonth: true,
            isToday: date.getTime() === today.getTime(),
            events: getEventsForDate(date, events),
        });
    }

    // Dias do próximo mês (completar grid 6x7 = 42)
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
        const date = new Date(year, month + 1, i);
        days.push({
            date,
            isCurrentMonth: false,
            isToday: false,
            events: getEventsForDate(date, events),
        });
    }

    return days;
}

function getEventsForDate(date: Date, events: CalendarEvent[]): CalendarEvent[] {
    return events.filter(event => {
        return event.date.getDate() === date.getDate() &&
            event.date.getMonth() === date.getMonth() &&
            event.date.getFullYear() === date.getFullYear();
    });
}

interface DayDetailModalProps {
    date: Date;
    events: CalendarEvent[];
    onClose: () => void;
}

function DayDetailModal({ date, events, onClose }: DayDetailModalProps) {
    const navigate = useNavigate();

    const formattedDate = date.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">Agendamentos</h2>
                    <button className="modal-close" onClick={onClose}>
                        <XIcon />
                    </button>
                </div>
                <div className="modal-body">
                    <div className="day-detail-header">
                        <div className="day-detail-date">{formattedDate}</div>
                    </div>

                    {events.length === 0 ? (
                        <div className="empty-day">
                            Nenhum agendamento para este dia
                        </div>
                    ) : (
                        <div className="day-events-list">
                            {events.map(event => (
                                <div
                                    key={event.id}
                                    className={`event-card ${event.tipo}`}
                                    onClick={() => navigate(event.tipo === 'preventiva' ? '/preventiva' : '/ordens')}
                                >
                                    <div className="event-card-header">
                                        <span className="event-order-number">
                                            {event.tipo === 'preventiva' ? 'Preventiva' : `OS #${(event.originalData as OrdemServico).numero}`}
                                        </span>
                                        <span className="event-type">
                                            {event.tipo === 'preventiva' ? 'Preventiva (PMOC)' : getTipoLabel((event.originalData as OrdemServico).tipo)}
                                        </span>
                                    </div>
                                    <div className="event-client">
                                        {(event.originalData.cliente as unknown as Cliente)?.nome || 'Cliente'}
                                    </div>
                                    {(event.originalData as OrdemServico).descricao && (
                                        <div className="event-description">{(event.originalData as OrdemServico).descricao}</div>
                                    )}
                                    {event.tipo === 'preventiva' && (event.originalData as PlanoManutencao).titulo && (
                                        <div className="event-description">{(event.originalData as PlanoManutencao).titulo} - {(event.originalData as PlanoManutencao).equipamento}</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export function AgendaPage() {
    const { user, userProfile } = useAuth();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    useEffect(() => {
        const carregarEventos = async () => {
            if (!user || !userProfile) return;

            try {
                setLoading(true);
                const [ordens, preventivas] = await Promise.all([
                    ordensService.listar(),
                    preventivaService.listarPlanos(userProfile.empresa_id)
                ]);

                const calendarEvents: CalendarEvent[] = [];

                // Mapear Ordens
                ordens.filter(o => o.data_agendamento).forEach(o => {
                    calendarEvents.push({
                        id: o.id,
                        date: new Date(o.data_agendamento!),
                        label: `OS #${o.numero} - ${o.cliente?.nome || 'Cliente'}`,
                        tipo: o.tipo,
                        originalData: o
                    });
                });

                // Mapear Preventivas (filtradas pelo criador se não for admin)
                preventivas
                    .filter(p => p.proxima_visita && (userProfile.role === 'admin' || userProfile.role === 'super_admin' || p.criado_por === user.id))
                    .forEach(p => {
                        calendarEvents.push({
                            id: p.id,
                            date: new Date(p.proxima_visita!),
                            label: `Prev: ${p.cliente?.nome || 'Cliente'}`,
                            tipo: 'preventiva',
                            originalData: p
                        });
                    });

                setEvents(calendarEvents);
            } catch (error) {
                console.error('Erro ao carregar eventos:', error);
            } finally {
                setLoading(false);
            }
        };

        carregarEventos();
    }, [user, userProfile]);

    const calendarDays = getCalendarDays(year, month, events);

    const goToPreviousMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1));
    };

    const goToNextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1));
    };

    const goToToday = () => {
        setCurrentDate(new Date());
    };

    return (
        <div className="agenda-page">
            <div className="calendar-header">
                <div className="calendar-nav">
                    <button className="calendar-nav-btn" onClick={goToPreviousMonth}>
                        <ChevronLeftIcon />
                    </button>
                    <h2 className="calendar-title">
                        {MONTHS[month]} {year}
                    </h2>
                    <button className="calendar-nav-btn" onClick={goToNextMonth}>
                        <ChevronRightIcon />
                    </button>
                </div>
                <button className="today-btn" onClick={goToToday}>
                    Hoje
                </button>
            </div>

            {loading ? (
                <div className="table-container">
                    <div className="loading-spinner">
                        <div className="spinner"></div>
                    </div>
                </div>
            ) : (
                <div className="calendar-container">
                    <div className="calendar-weekdays">
                        {WEEKDAYS.map(day => (
                            <div key={day} className="weekday">{day}</div>
                        ))}
                    </div>

                    <div className="calendar-days">
                        {calendarDays.map((day, index) => (
                            <div
                                key={index}
                                className={`calendar-day ${!day.isCurrentMonth ? 'other-month' : ''} ${day.isToday ? 'today' : ''}`}
                                onClick={() => setSelectedDay(day)}
                            >
                                <div className="day-header">
                                    <span className="day-number">{day.date.getDate()}</span>
                                </div>
                                <div className="day-events">
                                    {day.events.slice(0, 2).map(event => (
                                        <div key={event.id} className={`event-item ${event.tipo}`}>
                                            {event.label.split(' - ')[0]}...
                                        </div>
                                    ))}
                                    {day.events.length > 2 && (
                                        <div className="more-events">+{day.events.length - 2} mais</div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="calendar-legend">
                        <div className="legend-item">
                            <div className="legend-color preventiva"></div>
                            <span>Preventiva (PMOC)</span>
                        </div>
                        <div className="legend-item">
                            <div className="legend-color instalacao"></div>
                            <span>Instalação</span>
                        </div>
                        <div className="legend-item">
                            <div className="legend-color manutencao"></div>
                            <span>Manutenção</span>
                        </div>
                        <div className="legend-item">
                            <div className="legend-color reparo"></div>
                            <span>Reparo</span>
                        </div>
                        <div className="legend-item">
                            <div className="legend-color limpeza"></div>
                            <span>Limpeza</span>
                        </div>
                    </div>
                </div>
            )}

            {selectedDay && (
                <DayDetailModal
                    date={selectedDay.date}
                    events={selectedDay.events}
                    onClose={() => setSelectedDay(null)}
                />
            )}
        </div>
    );
}

export default AgendaPage;

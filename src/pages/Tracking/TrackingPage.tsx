import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { ordensService } from '../../services/ordensService';
import { transparentService } from '../../services/transparentService';
import type { OrdemServico, EventoServico, FotoServico } from '../../types';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './Tracking.css';

// Corrigir ícone do Leaflet que quebra no Build
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

export default function TrackingPage() {
    const { publicId } = useParams<{ publicId: string }>();
    const [ordem, setOrdem] = useState<OrdemServico | null>(null);
    const [eventos, setEventos] = useState<EventoServico[]>([]);
    const [fotos, setFotos] = useState<FotoServico[]>([]);
    const [loading, setLoading] = useState(true);
    const [tecnicoLoc, setTecnicoLoc] = useState<[number, number] | null>(null);

    const mapRef = useRef<HTMLDivElement>(null);
    const leafletMap = useRef<L.Map | null>(null);
    const markerTecnico = useRef<L.Marker | null>(null);

    const carregarDados = async () => {
        if (!publicId) return;
        try {
            const data = await ordensService.buscarPorPublicId(publicId);
            if (data) {
                setOrdem(data);
                const [evs, fts] = await Promise.all([
                    transparentService.listarEventos(data.id),
                    transparentService.listarFotos(data.id)
                ]);
                setEventos(evs);
                setFotos(fts);
            }
        } catch (error) {
            console.error('Erro ao carregar rastreio:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        carregarDados();
    }, [publicId]);

    // Inicializar Mapa
    useEffect(() => {
        if (!mapRef.current || !ordem || leafletMap.current) return;

        // Se tivermos endereço do cliente, idealmente geocodificamos. 
        // Para o demo, vamos focar no técnico e usar uma posição inicial.
        leafletMap.current = L.map(mapRef.current).setView([-23.5505, -46.6333], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap'
        }).addTo(leafletMap.current);

        return () => {
            leafletMap.current?.remove();
            leafletMap.current = null;
        };
    }, [ordem]);

    // Escutar atualizações de localização Real-time
    useEffect(() => {
        if (!ordem?.tecnico_id) return;

        const channel = transparentService.inscreverRastreamento(ordem.tecnico_id, (payload) => {
            const { new: newProfile } = payload;
            if (newProfile.latitude && newProfile.longitude) {
                const pos: [number, number] = [newProfile.latitude, newProfile.longitude];
                setTecnicoLoc(pos);

                if (leafletMap.current) {
                    if (!markerTecnico.current) {
                        markerTecnico.current = L.marker(pos, {
                            icon: L.divIcon({
                                className: 'tecnico-marker',
                                html: '<div class="marker-pulse"></div><div class="marker-icon">🚚</div>',
                                iconSize: [30, 30]
                            })
                        }).addTo(leafletMap.current);
                    } else {
                        markerTecnico.current.setLatLng(pos);
                    }
                    leafletMap.current.panTo(pos);
                }
            }
        });

        return () => {
            channel.unsubscribe();
        };
    }, [ordem?.tecnico_id]);

    if (loading) return <div className="tracking-loading">Localizando seu técnico...</div>;
    if (!ordem) return <div className="tracking-not-found">Serviço não encontrado ou link expirado.</div>;

    // --- VIEW DE CONCLUSÃO ---
    if (ordem.status === 'concluida') {
        return (
            <div className="tracking-container completed-view">
                <div className="completed-card">
                    <div className="company-logo">AC Global</div>
                    <div className="success-icon">✅</div>
                    <h1>Serviço Concluído!</h1>
                    <p>Obrigado por confiar na <strong>AC Global</strong>. Seu conforto é nossa prioridade.</p>
                    <div className="service-summary">
                        <span><strong>OS:</strong> #{ordem.numero}</span>
                        <span><strong>Data:</strong> {new Date(ordem.data_conclusao || ordem.updated_at).toLocaleDateString()}</span>
                    </div>
                    <button className="btn-primary" onClick={() => window.print()}>Gerar Comprovante</button>

                    <div className="tracking-gallery" style={{ marginTop: '2rem', width: '100%' }}>
                        <h4>Fotos Finais</h4>
                        <div className="gallery-grid">
                            {fotos.length > 0 ? fotos.filter(f => f.tipo === 'depois').map(foto => (
                                <div key={foto.id} className="gallery-item">
                                    <img src={foto.url} alt={foto.tipo} />
                                </div>
                            )) : <p>Registro fotográfico disponível no histórico.</p>}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="tracking-container">
            <header className="tracking-header">
                <div className="tracking-logo">AC Global</div>
                <div className="tracking-status">
                    <span className={`status-dot ${ordem.status}`}></span>
                    {ordem.status.replace('_', ' ')}
                </div>
            </header>

            <main className="tracking-content">
                <section className="tracking-map-section">
                    <div ref={mapRef} className="live-map"></div>
                    {tecnicoLoc && (
                        <div className="map-overlay-info">
                            Técnico está a caminho do seu endereço
                        </div>
                    )}
                </section>

                <section className="tracking-info-section">
                    <div className="service-info-card">
                        <div className="company-badge">AC Global</div>
                        <h3>OS #{ordem.numero}</h3>

                        <div className="info-group">
                            <label>Motivo da Ida</label>
                            <p className="visit-reason">{ordem.descricao || 'Manutenção de Ar Condicionado'}</p>
                        </div>

                        <div className="info-group">
                            <label>Técnico Responsável</label>
                            <p className="highlight">{(ordem as any).tecnico?.nome || 'Técnico Especialista'}</p>
                        </div>

                        <div className="service-meta">
                            <div className="meta-item">
                                <strong>Solicitado por:</strong>
                                <span>{ordem.cliente?.nome}</span>
                            </div>
                            <div className="meta-item">
                                <strong>Endereço de Atendimento:</strong>
                                <span>{ordem.cliente?.endereco}</span>
                            </div>
                        </div>
                    </div>

                    <div className="tracking-timeline">
                        <h4>Linha do Tempo</h4>
                        <div className="timeline-items">
                            {eventos.map((ev) => (
                                <div key={ev.id} className="timeline-item">
                                    <div className="timeline-time">
                                        {new Date(ev.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                    <div className="timeline-content">
                                        <div className="timeline-title">{ev.tipo.toUpperCase()}</div>
                                        {ev.descricao && <div className="timeline-desc">{ev.descricao}</div>}
                                    </div>
                                </div>
                            ))}
                            <div className="timeline-item">
                                <div className="timeline-time">{new Date(ordem.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
                                <div className="timeline-content">
                                    <div className="timeline-title">Solicitação Recebida</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="tracking-gallery">
                        <h4>Fotos do Serviço</h4>
                        <div className="gallery-grid">
                            {fotos.length > 0 ? fotos.map(foto => (
                                <div key={foto.id} className="gallery-item">
                                    <img src={foto.url} alt={foto.tipo} />
                                    <span className="foto-label">{foto.tipo}</span>
                                </div>
                            )) : (
                                <div className="gallery-empty">Nenhuma foto enviada ainda.</div>
                            )}
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}

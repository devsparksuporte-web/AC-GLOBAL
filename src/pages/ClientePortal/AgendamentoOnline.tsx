import { useState, useEffect } from 'react';
import { clientePortalService } from '../../services/clientePortalService';
import type { Equipamento, ServicoPreco } from '../../types';
import { useNavigate } from 'react-router-dom';
import './ClientePortal.css';

const CheckIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
);

export default function AgendamentoOnline() {
    const [step, setStep] = useState(1);
    const [equipamentos, setEquipamentos] = useState<Equipamento[]>([]);
    const [servicos, setServicos] = useState<ServicoPreco[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const navigate = useNavigate();

    const [selection, setSelection] = useState({
        equipamento_id: '',
        servico_id: '',
        data_agendamento: '',
        observacoes: ''
    });

    useEffect(() => {
        const load = async () => {
            try {
                const [eqs, svs] = await Promise.all([
                    clientePortalService.getMeusEquipamentos(),
                    clientePortalService.listarServicosDisponiveis()
                ]);
                setEquipamentos(eqs);
                setServicos(svs);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const selectedService = servicos.find(s => s.id === selection.servico_id);

    const handleConfirm = async () => {
        setSubmitting(true);
        try {
            await clientePortalService.agendarServico(selection);
            setStep(4);
        } catch (error) {
            alert('Erro ao agendar. Tente novamente mais tarde.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="client-loading">Buscando opções...</div>;

    return (
        <div className="agendamento-online">
            <header className="ag-header">
                <h1>Agendamento Rápido</h1>
                <div className="stepper horizontal-scroll hide-scrollbar">
                    <div className={`step-dot ${step >= 1 ? 'active' : ''}`}>1</div>
                    <div className="step-line"></div>
                    <div className={`step-dot ${step >= 2 ? 'active' : ''}`}>2</div>
                    <div className="step-line"></div>
                    <div className={`step-dot ${step >= 3 ? 'active' : ''}`}>3</div>
                </div>
            </header>

            <div className="ag-content">
                {step === 1 && (
                    <div className="step-pane">
                        <h2>Onde será o serviço?</h2>
                        <div className="selection-grid">
                            {equipamentos.length === 0 ? (
                                <div className="empty-wizard">
                                    <p>Nenhum equipamento encontrado em seu perfil.</p>
                                    <p className="hint">Por favor, entre em contato com o suporte para vincular seus aparelhos ao seu cadastro.</p>
                                    <button className="btn-secondary" onClick={() => navigate('/portal')}>Voltar ao Dashboard</button>
                                </div>
                            ) : (
                                equipamentos.map(eq => (
                                    <div
                                        key={eq.id}
                                        className={`select-card ${selection.equipamento_id === eq.id ? 'selected' : ''}`}
                                        onClick={() => {
                                            setSelection({ ...selection, equipamento_id: eq.id });
                                            setStep(2);
                                        }}
                                    >
                                        <h3>{eq.nome}</h3>
                                        <p>{eq.localizacao}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="step-pane">
                        <h2>Qual serviço você precisa?</h2>
                        <div className="selection-grid">
                            {servicos.length === 0 ? (
                                <div className="empty-wizard">
                                    <p>Não há serviços disponíveis para agendamento online no momento.</p>
                                    <button className="btn-secondary" onClick={() => setStep(1)}>Voltar</button>
                                </div>
                            ) : (
                                servicos.map(sv => (
                                    <div
                                        key={sv.id}
                                        className={`select-card service ${selection.servico_id === sv.id ? 'selected' : ''}`}
                                        onClick={() => {
                                            setSelection({ ...selection, servico_id: sv.id });
                                            setStep(3);
                                        }}
                                    >
                                        <div className="sv-title">
                                            <h3>{sv.nome}</h3>
                                            <span className="price">R$ {sv.preco_base.toFixed(2)}</span>
                                        </div>
                                        <p>{sv.descricao}</p>
                                        <span className="time">⏱️ ~{sv.tempo_estimado_minutos} min</span>
                                    </div>
                                ))
                            )}
                        </div>
                        <button className="btn-secondary" onClick={() => setStep(1)}>Voltar</button>
                    </div>
                )}

                {step === 3 && (
                    <div className="step-pane">
                        <h2>Escolha uma data e finalize</h2>
                        <div className="final-form">
                            <div className="form-group">
                                <label>Data sugerida</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    min={new Date().toISOString().split('T')[0]}
                                    value={selection.data_agendamento}
                                    onChange={(e) => setSelection({ ...selection, data_agendamento: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Observações Adicionais</label>
                                <textarea
                                    className="form-input"
                                    rows={3}
                                    placeholder="Ex: Trazer escada longa, o portão está com barulho..."
                                    value={selection.observacoes}
                                    onChange={(e) => setSelection({ ...selection, observacoes: e.target.value })}
                                />
                            </div>

                            <div className="summary-quote">
                                <h3>Resumo do Pedido</h3>
                                <div className="summary-row">
                                    <span>Serviço:</span>
                                    <strong>{selectedService?.nome}</strong>
                                </div>
                                <div className="summary-row total">
                                    <span>Total (Estimado):</span>
                                    <strong>R$ {selectedService?.preco_base.toFixed(2)}</strong>
                                </div>
                            </div>

                            <div className="final-actions">
                                <button className="btn-secondary" onClick={() => setStep(2)}>Voltar</button>
                                <button
                                    className="btn-primary"
                                    disabled={!selection.data_agendamento || submitting}
                                    onClick={handleConfirm}
                                >
                                    {submitting ? 'Agendando...' : 'Confirmar Agendamento'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <div className="success-pane">
                        <div className="success-icon">
                            <CheckIcon />
                        </div>
                        <h2>Solicitação Enviada!</h2>
                        <p>Seu agendamento foi encaminhado. Nossa equipe entrará em contato via WhatsApp para confirmar o horário exato.</p>
                        <button className="btn-primary" onClick={() => navigate('/portal')}>Ir para o Dashboard</button>
                    </div>
                )}
            </div>
        </div>
    );
}

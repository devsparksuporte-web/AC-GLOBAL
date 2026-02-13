import { useState } from 'react';
import './BTUCalculator.css';

interface BTUCalculatorProps {
    onClose: () => void;
}

export function BTUCalculator({ onClose }: BTUCalculatorProps) {
    const [area, setArea] = useState<number>(0);
    const [pessoas, setPessoas] = useState<number>(1);
    const [eletronicos, setEletronicos] = useState<number>(0);
    const [exposicaoSol, setExposicaoSol] = useState<'pouca' | 'muita'>('pouca');

    const calcularBTU = () => {
        if (area <= 0) return 0;

        // Base 600 BTUs por m² se pouca luz, 800 se muita
        const baseBTU = exposicaoSol === 'pouca' ? 600 : 800;

        let total = area * baseBTU;

        // Adiciona BTUs por pessoa extra (além da primeira)
        if (pessoas > 1) {
            total += (pessoas - 1) * baseBTU;
        }

        // Adiciona BTUs por eletrônico
        total += eletronicos * baseBTU;

        return total;
    };

    const btuResult = calcularBTU();

    // Sugestão de aparelho
    const sugerirAparelho = (btus: number) => {
        if (btus <= 9000) return '9.000 BTU/h';
        if (btus <= 12000) return '12.000 BTU/h';
        if (btus <= 18000) return '18.000 BTU/h';
        if (btus <= 24000) return '24.000 BTU/h';
        if (btus <= 30000) return '30.000 BTU/h';
        return 'Considere sistemas Multi-Split ou VRF';
    };

    return (
        <div className="btu-modal-overlay">
            <div className="btu-modal-content">
                <div className="btu-header">
                    <h2>Calculadora de BTUs</h2>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>

                <div className="btu-body">
                    <div className="btu-form-group">
                        <label>Área do Ambiente (m²)</label>
                        <input
                            type="number"
                            value={area}
                            onChange={(e) => setArea(Number(e.target.value))}
                            placeholder="Ex: 15"
                        />
                    </div>

                    <div className="btu-form-group">
                        <label>Número de Pessoas</label>
                        <input
                            type="number"
                            value={pessoas}
                            onChange={(e) => setPessoas(Number(e.target.value))}
                            min="1"
                        />
                    </div>

                    <div className="btu-form-group">
                        <label>Aparelhos Eletrônicos</label>
                        <input
                            type="number"
                            value={eletronicos}
                            onChange={(e) => setEletronicos(Number(e.target.value))}
                            min="0"
                        />
                    </div>

                    <div className="btu-form-group">
                        <label>Exposição ao Sol</label>
                        <div className="radio-group">
                            <button
                                className={`radio-btn ${exposicaoSol === 'pouca' ? 'active' : ''}`}
                                onClick={() => setExposicaoSol('pouca')}
                            >
                                Pouca / Manhã
                            </button>
                            <button
                                className={`radio-btn ${exposicaoSol === 'muita' ? 'active' : ''}`}
                                onClick={() => setExposicaoSol('muita')}
                            >
                                Muita / Tarde
                            </button>
                        </div>
                    </div>

                    <div className="btu-result-card">
                        <div className="result-label">Cálculo Necessário</div>
                        <div className="result-value">{btuResult.toLocaleString()} BTU/h</div>
                        <div className="result-suggestion">
                            <strong>Sugestão:</strong> {sugerirAparelho(btuResult)}
                        </div>
                    </div>
                </div>

                <div className="btu-footer">
                    <p>Nota: Este cálculo é uma estimativa técnica básica.</p>
                </div>
            </div>
        </div>
    );
}

import type { WeatherData, DailyForecast, ClimateAlert } from '../types';

export const weatherService = {
    // Busca clima baseado em lat/lon (Open-Meteo não exige API Key para uso básico)
    async getWeather(lat: number, lon: number): Promise<WeatherData> {
        const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto`
        );
        const data = await response.json();

        if (!data.current_weather) throw new Error('Falha ao buscar dados climáticos');

        const current = data.current_weather;
        const daily = data.daily;

        const forecast: DailyForecast[] = daily.time.map((time: string, i: number) => ({
            date: time,
            maxTemp: daily.temperature_2m_max[i],
            minTemp: daily.temperature_2m_min[i],
            condition: this.mapWeatherCode(daily.weathercode[i])
        }));

        return {
            temperature: current.temperature,
            condition: this.mapWeatherCode(current.weathercode),
            description: 'Condição atual baseada em satélite',
            humidity: 0, // Open-meteo precisa de param extra para humidade
            windSpeed: current.windspeed,
            forecast
        };
    },

    mapWeatherCode(code: number): string {
        if (code === 0) return 'Céu Limpo';
        if (code <= 3) return 'Parcialmente Nublado';
        if (code <= 48) return 'Nevoeiro';
        if (code <= 57) return 'Garoa';
        if (code <= 67) return 'Chuva';
        if (code <= 77) return 'Neve';
        if (code <= 82) return 'Pancadas de Chuva';
        if (code <= 99) return 'Tempestade';
        return 'Desconhecido';
    },

    getAlerts(weather: WeatherData): ClimateAlert[] {
        const alerts: ClimateAlert[] = [];

        // Lógica de Onda de Calor: 3 dias seguidos acima de 32 graus
        const heatwaveDays = weather.forecast.filter(d => d.maxTemp >= 32).length;
        if (heatwaveDays >= 3) {
            alerts.push({
                type: 'heatwave',
                severity: 'high',
                title: 'Onda de Calor em Breve',
                description: `Onda de calor detectada: ${heatwaveDays} dias com temperaturas acima de 32°C.`,
                suggestion: 'Sugerimos antecipar revisões de limpeza e carga de gás para evitar paradas críticas.'
            });
        }

        // Lógica de Tempestade
        const hasStorm = weather.forecast.some(d => d.condition === 'Tempestade');
        if (hasStorm) {
            alerts.push({
                type: 'storm',
                severity: 'medium',
                title: 'Alerta de Tempestade',
                description: 'Previsão de tempestade para os próximos dias.',
                suggestion: 'Avise seus clientes para protegerem unidades condensadoras externas contra ventos e raios.'
            });
        }

        return alerts;
    }
};

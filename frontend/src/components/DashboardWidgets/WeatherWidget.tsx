import React, { useState, useEffect } from 'react';
import { Cloud, CloudRain, CloudSnow, Sun, Wind, Droplets, MapPin, RefreshCw, Thermometer, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import WidgetHeader from './WidgetHeader';
import './DashboardWidgets.css';

interface HourlyData {
  times: string[];
  temperatures: number[];
}

interface DailyData {
  dates: string[];
  maxTemperatures: number[];
  minTemperatures: number[];
  weatherCodes: number[];
  precipitationProbabilities: number[];
}

interface WeatherData {
  temperature: number;
  feelsLike: number;
  weatherCode: number;
  windSpeed: number;
  humidity: number;
  pressure: number;
  uvIndex: number;
  hourly: HourlyData;
  daily: DailyData;
}

interface Location {
  name: string;
  lat: number;
  lon: number;
}

interface WeatherWidgetProps {
  onRemove: () => void;
}

const WEATHER_STORAGE_KEY = 'cflux-weather-location';
const DEFAULT_LOCATION: Location = {
  name: 'Zürich',
  lat: 47.3769,
  lon: 8.5417
};

const WeatherWidget: React.FC<WeatherWidgetProps> = ({ onRemove }) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [location, setLocation] = useState<Location>(DEFAULT_LOCATION);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [locationInput, setLocationInput] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem(WEATHER_STORAGE_KEY);
    if (stored) {
      try {
        const parsedLocation = JSON.parse(stored);
        setLocation(parsedLocation);
      } catch (e) {
        console.error('Error loading location:', e);
      }
    }
  }, []);

  useEffect(() => {
    loadWeather();
  }, [location]);

  const loadWeather = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?` +
        `latitude=${location.lat}&longitude=${location.lon}` +
        `&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,surface_pressure,uv_index` +
        `&hourly=temperature_2m` +
        `&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max` +
        `&timezone=Europe/Zurich` +
        `&forecast_days=7`
      );

      if (!response.ok) throw new Error('Wetterdaten konnten nicht geladen werden');

      const data = await response.json();

      // Get next 24 hours of hourly data from current hour
      const currentHour = new Date().getHours();
      const hourlyTimes: string[] = data.hourly.time.slice(currentHour, currentHour + 24);
      const hourlyTemps: number[] = data.hourly.temperature_2m
        .slice(currentHour, currentHour + 24)
        .map((t: number) => Math.round(t * 10) / 10);

      setWeather({
        temperature: Math.round(data.current.temperature_2m),
        feelsLike: Math.round(data.current.apparent_temperature),
        weatherCode: data.current.weather_code,
        windSpeed: Math.round(data.current.wind_speed_10m),
        humidity: data.current.relative_humidity_2m,
        pressure: Math.round(data.current.surface_pressure),
        uvIndex: Math.round(data.current.uv_index),
        hourly: {
          times: hourlyTimes,
          temperatures: hourlyTemps,
        },
        daily: {
          dates: data.daily.time,
          maxTemperatures: data.daily.temperature_2m_max.map((t: number) => Math.round(t)),
          minTemperatures: data.daily.temperature_2m_min.map((t: number) => Math.round(t)),
          weatherCodes: data.daily.weather_code,
          precipitationProbabilities: data.daily.precipitation_probability_max || [],
        }
      });
    } catch (err) {
      console.error('Error loading weather:', err);
      setError('Fehler beim Laden der Wetterdaten');
    } finally {
      setIsLoading(false);
    }
  };

  const searchLocation = async (query: string) => {
    if (!query.trim()) return;

    try {
      const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=de&format=json`
      );
      
      if (!response.ok) throw new Error('Standort nicht gefunden');
      
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        const newLocation: Location = {
          name: result.name + (result.admin1 ? `, ${result.admin1}` : ''),
          lat: result.latitude,
          lon: result.longitude
        };
        
        setLocation(newLocation);
        localStorage.setItem(WEATHER_STORAGE_KEY, JSON.stringify(newLocation));
        setIsEditingLocation(false);
        setLocationInput('');
      } else {
        setError('Standort nicht gefunden');
      }
    } catch (err) {
      console.error('Error searching location:', err);
      setError('Standort konnte nicht gefunden werden');
    }
  };

  const getWeatherIcon = (code: number, size: number = 48) => {
    if (code === 0) return <Sun size={size} color="#FDB813" />;
    if (code <= 3) return <Cloud size={size} color="#B8B8B8" />;
    if (code >= 45 && code <= 48) return <Cloud size={size} color="#9E9E9E" />;
    if (code >= 51 && code <= 57) return <CloudRain size={size} color="#78B4D0" />;
    if (code >= 61 && code <= 67) return <CloudRain size={size} color="#4A90E2" />;
    if (code >= 71 && code <= 77) return <CloudSnow size={size} color="#A8D8EA" />;
    if (code >= 80 && code <= 82) return <CloudRain size={size} color="#4A90E2" />;
    if (code >= 85 && code <= 86) return <CloudSnow size={size} color="#A8D8EA" />;
    if (code >= 95) return <CloudRain size={size} color="#5B6ABF" />;
    return <Cloud size={size} color="#B8B8B8" />;
  };

  const getWeatherDescription = (code: number): string => {
    if (code === 0) return 'Sonnig';
    if (code === 1) return 'Leicht bewölkt';
    if (code === 2) return 'Bewölkt';
    if (code === 3) return 'Stark bewölkt';
    if (code >= 45 && code <= 48) return 'Nebel';
    if (code >= 51 && code <= 57) return 'Nieselregen';
    if (code >= 61 && code <= 65) return 'Regen';
    if (code === 66 || code === 67) return 'Gefrierender Regen';
    if (code >= 71 && code <= 77) return 'Schnee';
    if (code >= 80 && code <= 82) return 'Regenschauer';
    if (code >= 85 && code <= 86) return 'Schneeschauer';
    if (code >= 95) return 'Gewitter';
    return 'Unbekannt';
  };

  const getDayName = (dateStr: string, index: number): string => {
    if (index === 0) return 'Heute';
    if (index === 1) return 'Morgen';
    const date = new Date(dateStr);
    return date.toLocaleDateString('de-DE', { weekday: 'short' });
  };

  const getHumidityLabel = (humidity: number): string => {
    if (humidity < 30) return 'Trocken';
    if (humidity < 60) return 'Angenehm';
    if (humidity < 80) return 'Feucht';
    return 'Sehr feucht';
  };

  const getUVLabel = (uv: number): string => {
    if (uv <= 2) return 'Niedrig';
    if (uv <= 5) return 'Mässig';
    if (uv <= 7) return 'Hoch';
    if (uv <= 10) return 'Sehr hoch';
    return 'Extrem';
  };

  const getTempTrend = (): { icon: JSX.Element; label: string } => {
    if (!weather || weather.hourly.temperatures.length < 6) {
      return { icon: <Minus size={14} />, label: 'stabil' };
    }
    const now = weather.hourly.temperatures[0];
    const later = weather.hourly.temperatures[5];
    const diff = later - now;
    if (diff > 1.5) return { icon: <TrendingUp size={14} color="#e74c3c" />, label: 'steigend' };
    if (diff < -1.5) return { icon: <TrendingDown size={14} color="#3498db" />, label: 'fallend' };
    return { icon: <Minus size={14} color="#95a5a6" />, label: 'stabil' };
  };

  // Build a simple sparkline from hourly data
  const renderTempChart = () => {
    if (!weather) return null;
    const temps = weather.hourly.temperatures;
    // Show every 3 hours (8 data points)
    const chartTemps: { temp: number; hour: string }[] = [];
    for (let i = 0; i < temps.length && chartTemps.length < 8; i += 3) {
      const timeStr = weather.hourly.times[i];
      const hour = timeStr ? new Date(timeStr).getHours().toString().padStart(2, '0') + ':00' : '';
      chartTemps.push({ temp: temps[i], hour });
    }

    const minTemp = Math.min(...chartTemps.map(d => d.temp));
    const maxTemp = Math.max(...chartTemps.map(d => d.temp));
    const range = maxTemp - minTemp || 1;

    return (
      <div className="weather-temp-chart">
        <div className="weather-temp-chart-header">
          <Thermometer size={14} />
          <span>Temperaturverlauf (24h)</span>
        </div>
        <div className="weather-temp-chart-bars">
          {chartTemps.map((d, i) => {
            const heightPercent = ((d.temp - minTemp) / range) * 100;
            return (
              <div key={i} className="weather-chart-bar-col">
                <div className="weather-chart-bar-value">{Math.round(d.temp)}°</div>
                <div className="weather-chart-bar-wrap">
                  <div
                    className="weather-chart-bar"
                    style={{ height: `${Math.max(heightPercent, 8)}%` }}
                    title={`${d.hour}: ${d.temp}°C`}
                  />
                </div>
                <div className="weather-chart-bar-label">{d.hour.slice(0, 2)}h</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const tempTrend = weather ? getTempTrend() : null;

  return (
    <div className="dashboard-widget">
      <WidgetHeader 
        title="Wetter" 
        icon="🌤️"
        onRemove={onRemove}
      />
      
      <div className="widget-content weather-widget-content">
        {isLoading ? (
          <div className="widget-loading">
            <div className="spinner" />
            <p>Lade Wetterdaten...</p>
          </div>
        ) : error ? (
          <div className="widget-error">
            <Cloud size={32} />
            <p>{error}</p>
            <button className="btn btn-primary btn-small" onClick={loadWeather}>
              Erneut versuchen
            </button>
          </div>
        ) : weather ? (
          <>
            {/* Location Header */}
            <div className="weather-location">
              {isEditingLocation ? (
                <div className="weather-location-edit">
                  <input
                    type="text"
                    className="weather-location-input"
                    value={locationInput}
                    onChange={(e) => setLocationInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && searchLocation(locationInput)}
                    placeholder="Stadt eingeben..."
                    autoFocus
                  />
                  <button 
                    className="btn btn-primary btn-small"
                    onClick={() => searchLocation(locationInput)}
                  >
                    OK
                  </button>
                  <button 
                    className="btn btn-secondary btn-small"
                    onClick={() => {
                      setIsEditingLocation(false);
                      setLocationInput('');
                    }}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="weather-location-display" onClick={() => setIsEditingLocation(true)}>
                  <MapPin size={16} />
                  <span>{location.name}</span>
                </div>
              )}
              <button 
                className="weather-refresh-btn"
                onClick={loadWeather}
                title="Aktualisieren"
              >
                <RefreshCw size={16} />
              </button>
            </div>

            {/* Current Weather */}
            <div className="weather-current">
              <div className="weather-icon">
                {getWeatherIcon(weather.weatherCode)}
              </div>
              <div className="weather-temp">
                {weather.temperature}°C
              </div>
              <div className="weather-description">
                {getWeatherDescription(weather.weatherCode)}
              </div>
              <div className="weather-feels-like">
                Gefühlt {weather.feelsLike}°C
                {tempTrend && (
                  <span className="weather-trend">
                    {tempTrend.icon} {tempTrend.label}
                  </span>
                )}
              </div>
            </div>

            {/* Details Grid */}
            <div className="weather-details-grid">
              <div className="weather-detail-card">
                <Droplets size={18} color="#4A90E2" />
                <div className="weather-detail-info">
                  <span className="weather-detail-value">{weather.humidity}%</span>
                  <span className="weather-detail-label">Luftfeuchtigkeit</span>
                  <span className="weather-detail-sub">{getHumidityLabel(weather.humidity)}</span>
                </div>
              </div>
              <div className="weather-detail-card">
                <Wind size={18} color="#6C757D" />
                <div className="weather-detail-info">
                  <span className="weather-detail-value">{weather.windSpeed} km/h</span>
                  <span className="weather-detail-label">Wind</span>
                </div>
              </div>
              <div className="weather-detail-card">
                <Sun size={18} color="#FDB813" />
                <div className="weather-detail-info">
                  <span className="weather-detail-value">{weather.uvIndex}</span>
                  <span className="weather-detail-label">UV-Index</span>
                  <span className="weather-detail-sub">{getUVLabel(weather.uvIndex)}</span>
                </div>
              </div>
              <div className="weather-detail-card">
                <Thermometer size={18} color="#E74C3C" />
                <div className="weather-detail-info">
                  <span className="weather-detail-value">{weather.pressure} hPa</span>
                  <span className="weather-detail-label">Luftdruck</span>
                </div>
              </div>
            </div>

            {/* Temperature Chart */}
            {renderTempChart()}

            {/* 7-Day Forecast */}
            <div className="weather-forecast-section">
              <div className="weather-forecast-header">7-Tage-Vorhersage</div>
              <div className="weather-forecast-extended">
                {weather.daily.dates.map((date, index) => (
                  <div key={date} className="weather-forecast-row">
                    <div className="forecast-row-day">
                      {getDayName(date, index)}
                    </div>
                    <div className="forecast-row-icon">
                      {getWeatherIcon(weather.daily.weatherCodes[index], 22)}
                    </div>
                    <div className="forecast-row-precip">
                      {weather.daily.precipitationProbabilities[index] != null && (
                        <span className="forecast-precip-badge">
                          <Droplets size={12} />
                          {weather.daily.precipitationProbabilities[index]}%
                        </span>
                      )}
                    </div>
                    <div className="forecast-row-temps">
                      <span className="forecast-temp-min">{weather.daily.minTemperatures[index]}°</span>
                      <div className="forecast-temp-bar-wrap">
                        <div
                          className="forecast-temp-bar"
                          style={{
                            left: `${((weather.daily.minTemperatures[index] - Math.min(...weather.daily.minTemperatures)) / 
                              (Math.max(...weather.daily.maxTemperatures) - Math.min(...weather.daily.minTemperatures) || 1)) * 100}%`,
                            width: `${((weather.daily.maxTemperatures[index] - weather.daily.minTemperatures[index]) / 
                              (Math.max(...weather.daily.maxTemperatures) - Math.min(...weather.daily.minTemperatures) || 1)) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="forecast-temp-max">{weather.daily.maxTemperatures[index]}°</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default WeatherWidget;

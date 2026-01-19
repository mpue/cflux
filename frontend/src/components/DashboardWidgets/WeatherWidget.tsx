import React, { useState, useEffect } from 'react';
import { Cloud, CloudRain, CloudSnow, Sun, Wind, Droplets, MapPin, RefreshCw } from 'lucide-react';
import WidgetHeader from './WidgetHeader';
import './DashboardWidgets.css';

interface WeatherData {
  temperature: number;
  weatherCode: number;
  windSpeed: number;
  humidity: number;
  daily: {
    dates: string[];
    temperatures: number[];
    weatherCodes: number[];
  };
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
    // Load saved location
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
        `&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m` +
        `&daily=temperature_2m_max,weather_code` +
        `&timezone=Europe/Zurich` +
        `&forecast_days=4`
      );

      if (!response.ok) throw new Error('Wetterdaten konnten nicht geladen werden');

      const data = await response.json();
      
      setWeather({
        temperature: Math.round(data.current.temperature_2m),
        weatherCode: data.current.weather_code,
        windSpeed: Math.round(data.current.wind_speed_10m),
        humidity: data.current.relative_humidity_2m,
        daily: {
          dates: data.daily.time,
          temperatures: data.daily.temperature_2m_max.map((t: number) => Math.round(t)),
          weatherCodes: data.daily.weather_code,
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
    // WMO Weather codes
    if (code === 0) return <Sun size={size} color="#FDB813" />; // Clear
    if (code <= 3) return <Cloud size={size} color="#B8B8B8" />; // Cloudy
    if (code >= 61 && code <= 67) return <CloudRain size={size} color="#4A90E2" />; // Rain
    if (code >= 71 && code <= 77) return <CloudSnow size={size} color="#A8D8EA" />; // Snow
    if (code >= 80) return <CloudRain size={size} color="#4A90E2" />; // Showers
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

  return (
    <>
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
            </div>

            {/* Details */}
            <div className="weather-details">
              <div className="weather-detail-item">
                <Wind size={18} />
                <span>{weather.windSpeed} km/h</span>
              </div>
              <div className="weather-detail-item">
                <Droplets size={18} />
                <span>{weather.humidity}%</span>
              </div>
            </div>

            {/* Forecast */}
            <div className="weather-forecast">
              {weather.daily.dates.slice(0, 4).map((date, index) => (
                <div key={date} className="weather-forecast-day">
                  <div className="forecast-day-name">
                    {getDayName(date, index)}
                  </div>
                  <div className="forecast-icon">
                    {getWeatherIcon(weather.daily.weatherCodes[index], 24)}
                  </div>
                  <div className="forecast-temp">
                    {weather.daily.temperatures[index]}°
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </>
  );
};

export default WeatherWidget;

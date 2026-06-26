import { useState, useEffect, useCallback } from 'react';

const WMO = {
  0: { label: 'Clear Sky', icon: '☀️', alert: false },
  1: { label: 'Mainly Clear', icon: '🌤️', alert: false },
  2: { label: 'Partly Cloudy', icon: '⛅', alert: false },
  3: { label: 'Overcast', icon: '☁️', alert: false },
  45: { label: 'Foggy', icon: '🌫️', alert: false },
  48: { label: 'Icy Fog', icon: '🌫️', alert: false },
  51: { label: 'Light Drizzle', icon: '🌦️', alert: true },
  53: { label: 'Drizzle', icon: '🌦️', alert: true },
  55: { label: 'Heavy Drizzle', icon: '🌧️', alert: true },
  61: { label: 'Light Rain', icon: '🌧️', alert: true },
  63: { label: 'Rain', icon: '🌧️', alert: true },
  65: { label: 'Heavy Rain', icon: '🌩️', alert: true },
  71: { label: 'Light Snow', icon: '🌨️', alert: false },
  80: { label: 'Rain Showers', icon: '🌦️', alert: true },
  81: { label: 'Showers', icon: '🌧️', alert: true },
  82: { label: 'Heavy Showers', icon: '⛈️', alert: true },
  95: { label: 'Thunderstorm', icon: '⛈️', alert: true },
  96: { label: 'Thunderstorm+Hail', icon: '⛈️', alert: true },
  99: { label: 'Heavy Thunderstorm', icon: '🌪️', alert: true },
};

function getWMO(code) {
  return WMO[code] || { label: 'Unknown', icon: '🌡️', alert: false };
}

export function useWeather(lat = 16.5062, lon = 80.648) {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch_ = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const url =
        `https://api.open-meteo.com/v1/forecast` +
        `?latitude=${lat}&longitude=${lon}` +
        `&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,apparent_temperature` +
        `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max` +
        `&timezone=Asia%2FKolkata&forecast_days=3`;
      const res = await fetch(url);
      const data = await res.json();
      const c = data.current;
      const wmo = getWMO(c.weather_code);
      setWeather({
        temp: Math.round(c.temperature_2m),
        feelsLike: Math.round(c.apparent_temperature),
        humidity: c.relative_humidity_2m,
        wind: Math.round(c.wind_speed_10m),
        label: wmo.label,
        icon: wmo.icon,
        isRainy: wmo.alert,
        tappingAlert: wmo.alert,
        forecast: (data.daily?.time || []).map((date, i) => ({
          date,
          max: Math.round(data.daily.temperature_2m_max[i]),
          min: Math.round(data.daily.temperature_2m_min[i]),
          rain: data.daily.precipitation_probability_max[i] ?? 0,
          icon: getWMO(data.daily.weather_code[i]).icon,
          label: getWMO(data.daily.weather_code[i]).label,
        })),
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [lat, lon]);

  useEffect(() => {
    fetch_();
  }, [fetch_]);

  return { weather, loading, error, refresh: fetch_ };
}

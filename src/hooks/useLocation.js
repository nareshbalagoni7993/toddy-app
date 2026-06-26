import { useState, useCallback } from 'react';
import { Platform } from 'react-native';

// Haversine distance in km
export function calcDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatAddress(geo) {
  if (!geo) return '';
  const parts = [
    geo.name !== geo.street ? geo.name : null,
    geo.street,
    geo.subregion || geo.district,
    geo.city,
    geo.region,
    geo.postalCode,
  ].filter(Boolean);
  return [...new Set(parts)].join(', ');
}

export function useLocation() {
  const [coords, setCoords] = useState(null);
  const [address, setAddress] = useState(null);
  const [distance, setDistance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const detect = useCallback(async (shopLat, shopLon) => {
    setLoading(true);
    setError(null);
    try {
      if (Platform.OS === 'web') {
        await detectWeb(shopLat, shopLon);
        return;
      }
      const Location = require('expo-location');
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission denied. Please enable location in settings.');
        setLoading(false);
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = pos.coords;
      setCoords({ latitude, longitude });

      const [geo] = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (geo) {
        setAddress({
          ...geo,
          formattedAddress: formatAddress(geo),
          village: geo.subregion || geo.district || geo.city || '',
          mandal: geo.subregion || '',
          district: geo.district || geo.city || '',
          pincode: geo.postalCode || '',
          state: geo.region || '',
        });
      }

      if (shopLat && shopLon) {
        setDistance(calcDistance(latitude, longitude, shopLat, shopLon));
      }
    } catch (e) {
      setError(e.message || 'Failed to detect location');
    } finally {
      setLoading(false);
    }
  }, []);

  const detectWeb = (shopLat, shopLon) =>
    new Promise((resolve) => {
      if (!navigator?.geolocation) {
        setError('Geolocation not supported in this browser');
        setLoading(false);
        resolve();
        return;
      }
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          setCoords({ latitude, longitude });
          if (shopLat && shopLon) {
            setDistance(calcDistance(latitude, longitude, shopLat, shopLon));
          }
          setAddress({
            formattedAddress: `Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`,
            village: '',
            mandal: '',
            district: '',
            pincode: '',
            state: '',
          });
          setLoading(false);
          resolve();
        },
        (err) => {
          setError(err.message);
          setLoading(false);
          resolve();
        },
        { timeout: 10000 }
      );
    });

  const reset = useCallback(() => {
    setCoords(null);
    setAddress(null);
    setDistance(null);
    setError(null);
  }, []);

  return { coords, address, distance, loading, error, detect, reset };
}

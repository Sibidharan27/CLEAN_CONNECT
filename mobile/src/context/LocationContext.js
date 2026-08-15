import React, { createContext, useContext, useState, useRef } from 'react';
import * as Location from 'expo-location';

const LocationContext = createContext(null);

export const LocationProvider = ({ children }) => {
  const [location, setLocation] = useState(null); // { latitude, longitude, address }
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const watcherRef = useRef(null);

  // ─── Request permission ─────────────────────────────────────────────────────
  const requestPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    setPermissionGranted(status === 'granted');
    return status === 'granted';
  };

  // ─── One-shot GPS fix ───────────────────────────────────────────────────────
  const getCurrentLocation = async () => {
    setIsLocating(true);
    try {
      const granted = permissionGranted || (await requestPermission());
      if (!granted) throw new Error('Location permission denied');

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const address = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);

      const loc = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        address,
      };
      setLocation(loc);
      return loc;
    } finally {
      setIsLocating(false);
    }
  };

  // ─── Continuous GPS watch (for drivers) ────────────────────────────────────
  const startWatching = async (onUpdate) => {
    const granted = permissionGranted || (await requestPermission());
    if (!granted) return;

    watcherRef.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 10 },
      async (pos) => {
        const address = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
        const loc = { latitude: pos.coords.latitude, longitude: pos.coords.longitude, address, heading: pos.coords.heading, speed: pos.coords.speed };
        setLocation(loc);
        if (onUpdate) onUpdate(loc);
      }
    );
  };

  const stopWatching = () => {
    if (watcherRef.current) { watcherRef.current.remove(); watcherRef.current = null; }
  };

  // ─── Reverse geocode via OpenStreetMap Nominatim (free, no key) ─────────────
  const reverseGeocode = async (lat, lon) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=17&addressdetails=1`,
        { headers: { 'Accept-Language': 'en', 'User-Agent': 'CleanConnectPlus/1.0' } }
      );
      const data = await res.json();
      if (data.display_name) {
        // Shorten: take first 2 parts (road, suburb)
        const parts = data.display_name.split(', ');
        return parts.slice(0, 3).join(', ');
      }
      return `${lat.toFixed(4)}° N, ${lon.toFixed(4)}° E`;
    } catch {
      return `${lat.toFixed(4)}° N, ${lon.toFixed(4)}° E`;
    }
  };

  // ─── Distance calculation (Haversine formula) ───────────────────────────────
  const distanceTo = (lat2, lon2) => {
    if (!location) return null;
    const R = 6371;
    const dLat = ((lat2 - location.latitude) * Math.PI) / 180;
    const dLon = ((lon2 - location.longitude) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((location.latitude * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  return (
    <LocationContext.Provider value={{
      location, permissionGranted, isLocating,
      requestPermission, getCurrentLocation,
      startWatching, stopWatching, reverseGeocode, distanceTo,
    }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useLocation must be used within LocationProvider');
  return ctx;
};

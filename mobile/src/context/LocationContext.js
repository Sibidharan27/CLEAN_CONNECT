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

  // ─── One-shot GPS fix (fast: Balanced first, then upgrades silently) ─────────
  const getCurrentLocation = async () => {
    setIsLocating(true);
    try {
      const granted = permissionGranted || (await requestPermission());
      if (!granted) throw new Error('Location permission denied');

      // Phase 1: Fast fix using Balanced accuracy (returns in ~1-2 seconds)
      const fastPos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        maximumAge: 10000,   // accept cached position up to 10s old
        timeout: 5000,
      });

      const fastLoc = {
        latitude: fastPos.coords.latitude,
        longitude: fastPos.coords.longitude,
        address: `${fastPos.coords.latitude.toFixed(4)}° N, ${fastPos.coords.longitude.toFixed(4)}° E`,
      };
      setLocation(fastLoc);

      // Phase 2: Silently upgrade to High accuracy in background
      Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        maximumAge: 0,
        timeout: 15000,
      }).then(async (precisePos) => {
        const address = await reverseGeocode(precisePos.coords.latitude, precisePos.coords.longitude);
        setLocation({
          latitude: precisePos.coords.latitude,
          longitude: precisePos.coords.longitude,
          address,
        });
      }).catch(() => {
        // Phase 2 failed silently — Phase 1 result still shown
      });

      return fastLoc;
    } catch (e) {
      // Last resort: try with any cached location
      try {
        const lastKnown = await Location.getLastKnownPositionAsync();
        if (lastKnown) {
          const loc = {
            latitude: lastKnown.coords.latitude,
            longitude: lastKnown.coords.longitude,
            address: `${lastKnown.coords.latitude.toFixed(4)}° N, ${lastKnown.coords.longitude.toFixed(4)}° E`,
          };
          setLocation(loc);
          return loc;
        }
      } catch {}
      throw e;
    } finally {
      setIsLocating(false);
    }
  };

  // ─── Continuous GPS watch (for drivers — uses best accuracy) ────────────────
  const startWatching = async (onUpdate) => {
    const granted = permissionGranted || (await requestPermission());
    if (!granted) return;

    // Stop any existing watcher first
    if (watcherRef.current) {
      watcherRef.current.remove();
      watcherRef.current = null;
    }

    watcherRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 3000,       // update every 3 seconds
        distanceInterval: 5,      // or every 5 meters
      },
      async (pos) => {
        const loc = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          address: `${pos.coords.latitude.toFixed(4)}° N, ${pos.coords.longitude.toFixed(4)}° E`,
          heading: pos.coords.heading,
          speed: pos.coords.speed,
        };
        setLocation(loc);
        // Reverse geocode in background (don't block the update)
        reverseGeocode(pos.coords.latitude, pos.coords.longitude).then(address => {
          setLocation(prev => prev ? { ...prev, address } : loc);
        }).catch(() => {});
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

export const calculateEtaMinutes = (distanceKm, averageSpeedKmh = 25) => Math.ceil((distanceKm / averageSpeedKmh) * 60);

/**
 * Road Routing Service
 *
 * Fetches accurate road-following polylines via OSRM (OpenStreetMap routing engine).
 * Includes:
 *  - Automatic retry with exponential backoff (handles dropped TCP connections)
 *  - Request queue to prevent simultaneous OSRM calls (avoids WSARecv / stream errors)
 *  - Session-level cache so the same leg is never fetched twice
 *  - Graceful multi-segment fallback — never a raw straight line
 *
 * OSRM public base: https://router.project-osrm.org/route/v1/driving
 * NOTE: coords in OSRM are lon,lat (longitude FIRST)
 */

// ─── Haversine distance (no network, instant) ────────────────────────────────
/**
 * Returns the straight-line ("as the crow flies") distance between two coords in km.
 * Used by citizen tracking to estimate truck proximity without any OSRM call.
 *
 * @param {{ latitude: number, longitude: number }} a
 * @param {{ latitude: number, longitude: number }} b
 * @returns {number} Distance in km (2 decimal places)
 */
export function getHaversineDistance(a, b) {
  const R = 6371; // Earth radius in km
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return +(2 * R * Math.asin(Math.sqrt(x))).toFixed(2);
}

const OSRM_BASE = 'https://router.project-osrm.org/route/v1/driving';

// ─── In-memory cache ──────────────────────────────────────────────────────────
const routeCache = new Map();

function coordKey(pt) {
  return `${Number(pt.latitude).toFixed(5)},${Number(pt.longitude).toFixed(5)}`;
}
function legKey(a, b) {
  return `${coordKey(a)}->${coordKey(b)}`;
}

// ─── Sequential request queue ─────────────────────────────────────────────────
// Prevents simultaneous OSRM connections that trigger WSARecv stream errors
let _queueRunning = false;
const _queue = [];

function enqueue(fn) {
  return new Promise((resolve, reject) => {
    _queue.push({ fn, resolve, reject });
    _drainQueue();
  });
}

async function _drainQueue() {
  if (_queueRunning || _queue.length === 0) return;
  _queueRunning = true;
  const { fn, resolve, reject } = _queue.shift();
  try {
    const result = await fn();
    resolve(result);
  } catch (e) {
    reject(e);
  } finally {
    _queueRunning = false;
    if (_queue.length > 0) _drainQueue();
  }
}

// ─── Fetch with retry ─────────────────────────────────────────────────────────
/**
 * Fetch a URL with up to `maxRetries` attempts and exponential backoff.
 * Handles TCP stream errors (WSARecv aborts) transparently.
 */
async function fetchWithRetry(url, options = {}, maxRetries = 2, baseDelayMs = 800) {
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) return res;
      // Non-OK HTTP status — don't retry
      return null;
    } catch (e) {
      clearTimeout(timeoutId);
      lastError = e;
      if (attempt < maxRetries) {
        // Exponential backoff: 800ms, 1600ms, …
        await new Promise(r => setTimeout(r, baseDelayMs * Math.pow(2, attempt)));
      }
    }
  }
  throw lastError;
}

// ─── Fallback path generator ──────────────────────────────────────────────────
/**
 * Generates a realistic multi-bend path when OSRM is unavailable.
 * Uses an L-shaped "nearest street corner" heuristic — never a single vertical line.
 */
export function generateStreetGridPath(start, end, steps = 12) {
  if (!start || !end) return [];

  const latD = end.latitude - start.latitude;
  const lonD = end.longitude - start.longitude;

  // Decide dominant travel axis and create a realistic L-shaped corner
  const horizontalFirst = Math.abs(lonD) >= Math.abs(latD);

  const corner = horizontalFirst
    ? { latitude: start.latitude + latD * 0.15, longitude: start.longitude + lonD * 0.72 }
    : { latitude: start.latitude + latD * 0.72, longitude: start.longitude + lonD * 0.15 };

  const segments = [start, corner, end];
  const pts = [];

  for (let si = 0; si < segments.length - 1; si++) {
    const from = segments[si];
    const to = segments[si + 1];
    const n = Math.max(4, Math.round(steps / (segments.length - 1)));
    for (let i = si === 0 ? 0 : 1; i <= n; i++) {
      const t = i / n;
      pts.push({
        latitude: from.latitude + (to.latitude - from.latitude) * t,
        longitude: from.longitude + (to.longitude - from.longitude) * t,
      });
    }
  }

  return pts;
}

// ─── Single-leg road route ────────────────────────────────────────────────────
/**
 * Returns the real road-following path from origin → destination.
 * Results are cached per unique leg. Queued to avoid parallel OSRM calls.
 *
 * @param {{ latitude: number, longitude: number }} origin
 * @param {{ latitude: number, longitude: number }} destination
 * @returns {Promise<{ coordinates: Array<{latitude,longitude}>, distanceKm: number, durationMin: number }>}
 */
export async function getRoadRoute(origin, destination) {
  if (!origin?.latitude || !origin?.longitude || !destination?.latitude || !destination?.longitude) {
    return { coordinates: [], distanceKm: 0, durationMin: 0 };
  }

  const key = legKey(origin, destination);
  if (routeCache.has(key)) return routeCache.get(key);

  return enqueue(async () => {
    // Re-check cache inside queue (another call may have populated it)
    if (routeCache.has(key)) return routeCache.get(key);

    try {
      const url =
        `${OSRM_BASE}/${origin.longitude},${origin.latitude};` +
        `${destination.longitude},${destination.latitude}` +
        `?overview=full&geometries=geojson`;

      const res = await fetchWithRetry(url);
      if (res) {
        const json = await res.json();
        if (json.code === 'Ok' && json.routes?.length > 0) {
          const route = json.routes[0];
          const coordinates = route.geometry.coordinates.map(([lon, lat]) => ({
            latitude: lat,
            longitude: lon,
          }));
          const distanceKm = +(route.distance / 1000).toFixed(2);
          const durationMin = Math.max(1, Math.round(route.duration / 60));

          const result = { coordinates, distanceKm, durationMin };
          routeCache.set(key, result);
          return result;
        }
      }
    } catch {
      // OSRM unreachable or TCP error — use fallback below
    }

    // Fallback: street-grid L-path
    const fallbackCoords = generateStreetGridPath(origin, destination, 12);
    const dLat = destination.latitude - origin.latitude;
    const dLon = destination.longitude - origin.longitude;
    const approxKm = +(Math.sqrt(dLat * dLat + dLon * dLon) * 111).toFixed(2);
    return {
      coordinates: fallbackCoords,
      distanceKm: approxKm,
      durationMin: Math.max(2, Math.round(approxKm * 4)),
    };
    // Note: fallback is intentionally NOT cached so live route is retried next time
  });
}

// ─── Next-stop road direction route ──────────────────────────────────────────
/**
 * Specific helper for "truck → next collection stop" road intimation.
 * Same as getRoadRoute but semantically named for clarity in call sites.
 */
export async function getNextStopRoute(truckPos, nextStop) {
  if (!truckPos || !nextStop) return { coordinates: [], distanceKm: 0, durationMin: 0 };
  return getRoadRoute(truckPos, nextStop);
}

// ─── Multi-stop road route ────────────────────────────────────────────────────
/**
 * Chains multiple stops via real roads using OSRM's multi-waypoint API.
 * Falls back to stitched street-grid segments if OSRM fails.
 * Capped at 15 waypoints to avoid OSRM timeouts/drops on the public server.
 *
 * @param {Array<{ latitude: number, longitude: number }>} stops
 * @returns {Promise<Array<{ latitude: number, longitude: number }>>}
 */
export async function getMultiStopRoadRoute(stops) {
  const valid = stops.filter(s => s?.latitude && s?.longitude);
  if (valid.length < 2) return valid.map(s => ({ latitude: s.latitude, longitude: s.longitude }));

  // Cap at 15 to keep OSRM calls lightweight
  const pts = valid.slice(0, 15);
  const coordStr = pts.map(s => `${s.longitude},${s.latitude}`).join(';');
  const cacheKey = `multi:${coordStr}`;

  if (routeCache.has(cacheKey)) return routeCache.get(cacheKey);

  return enqueue(async () => {
    if (routeCache.has(cacheKey)) return routeCache.get(cacheKey);

    try {
      const url = `${OSRM_BASE}/${coordStr}?overview=full&geometries=geojson`;
      const res = await fetchWithRetry(url, {}, 1, 1000); // fewer retries for multi-stop
      if (res) {
        const json = await res.json();
        if (json.code === 'Ok' && json.routes?.length > 0) {
          const coordinates = json.routes[0].geometry.coordinates.map(([lon, lat]) => ({
            latitude: lat,
            longitude: lon,
          }));
          routeCache.set(cacheKey, coordinates);
          return coordinates;
        }
      }
    } catch {
      // Fallback below
    }

    // Fallback: stitch each consecutive leg with street-grid paths
    const combined = [];
    for (let i = 0; i < valid.length - 1; i++) {
      const seg = generateStreetGridPath(valid[i], valid[i + 1], 8);
      if (i > 0) seg.shift(); // avoid duplicate join points
      combined.push(...seg);
    }
    return combined;
  });
}

// ─── Shortest Path & Trip Optimization (TSP Solver) ───────────────────────────
const OSRM_TRIP_BASE = 'https://router.project-osrm.org/trip/v1/driving';

/**
 * Calculates distance in km between two lat/lon points using the Haversine formula.
 */
export function getHaversineDistance(a, b) {
  if (!a || !b) return 0;
  const R = 6371; // Earth's radius in km
  const dLat = (b.latitude - a.latitude) * (Math.PI / 180);
  const dLon = (b.longitude - a.longitude) * (Math.PI / 180);
  const sinHalfLat = Math.sin(dLat / 2);
  const sinHalfLon = Math.sin(dLon / 2);
  const h =
    sinHalfLat * sinHalfLat +
    Math.cos(a.latitude * (Math.PI / 180)) *
      Math.cos(b.latitude * (Math.PI / 180)) *
      sinHalfLon * sinHalfLon;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/**
 * Sorts pending stops using a Greedy Nearest Neighbor heuristic from start location.
 * Ensures the next destination chosen is always the closest one to the current position.
 *
 * @param {{ latitude: number, longitude: number }} startLoc
 * @param {Array<object>} stops
 * @returns {Array<object>}
 */
export function sortStopsByNearestNeighbor(startLoc, stops = []) {
  if (!startLoc || stops.length <= 1) return [...stops];

  const unvisited = [...stops];
  const ordered = [];
  let current = startLoc;

  while (unvisited.length > 0) {
    let nearestIdx = 0;
    let minDistance = Infinity;

    for (let i = 0; i < unvisited.length; i++) {
      const dist = getHaversineDistance(current, unvisited[i]);
      if (dist < minDistance) {
        minDistance = dist;
        nearestIdx = i;
      }
    }

    const [nextNearest] = unvisited.splice(nearestIdx, 1);
    ordered.push(nextNearest);
    current = nextNearest;
  }

  return ordered;
}

/**
 * Optimizes the multi-stop route to find the shortest road distance.
 * Uses OSRM Trip API (TSP solver) with fallback to Nearest Neighbor road routing.
 *
 * @param {{ latitude: number, longitude: number }} origin
 * @param {Array<object>} stops
 * @returns {Promise<{ orderedStops: Array<object>, coordinates: Array<{latitude,longitude}>, totalDistanceKm: number, totalDurationMin: number }>}
 */
export async function getOptimizedShortestRoute(origin, stops = []) {
  const validStops = stops.filter(s => s?.latitude && s?.longitude);
  if (!origin || validStops.length === 0) {
    return { orderedStops: validStops, coordinates: [], totalDistanceKm: 0, totalDurationMin: 0 };
  }

  if (validStops.length === 1) {
    const singleLeg = await getRoadRoute(origin, validStops[0]);
    return {
      orderedStops: validStops,
      coordinates: singleLeg.coordinates,
      totalDistanceKm: singleLeg.distanceKm,
      totalDurationMin: singleLeg.durationMin,
    };
  }

  // Multi-stop: Try OSRM Trip API (Fastest/Shortest road TSP path)
  const allWaypoints = [origin, ...validStops.slice(0, 12)];
  const coordStr = allWaypoints.map(s => `${s.longitude},${s.latitude}`).join(';');
  const cacheKey = `trip_opt:${coordStr}`;

  if (routeCache.has(cacheKey)) return routeCache.get(cacheKey);

  return enqueue(async () => {
    if (routeCache.has(cacheKey)) return routeCache.get(cacheKey);

    try {
      // source=first forces starting from the origin (truck location)
      // roundtrip=false does not force returning back to the start
      const url = `${OSRM_TRIP_BASE}/${coordStr}?source=first&roundtrip=false&overview=full&geometries=geojson`;
      const res = await fetchWithRetry(url, {}, 1, 1000);
      if (res) {
        const json = await res.json();
        if (json.code === 'Ok' && json.trips?.length > 0) {
          const trip = json.trips[0];
          const coordinates = trip.geometry.coordinates.map(([lon, lat]) => ({
            latitude: lat,
            longitude: lon,
          }));

          // Reorder stops based on waypoints order
          const waypoints = json.waypoints || [];
          // Waypoint at index 0 is origin, subsequent ones map to validStops
          const sortedStops = [...validStops].sort((a, b) => {
            const idxA = waypoints.findIndex(w => Math.abs(w.location[0] - a.longitude) < 0.001 && Math.abs(w.location[1] - a.latitude) < 0.001);
            const idxB = waypoints.findIndex(w => Math.abs(w.location[0] - b.longitude) < 0.001 && Math.abs(w.location[1] - b.latitude) < 0.001);
            return (idxA >= 0 ? idxA : 99) - (idxB >= 0 ? idxB : 99);
          });

          const result = {
            orderedStops: sortedStops,
            coordinates,
            totalDistanceKm: +(trip.distance / 1000).toFixed(2),
            totalDurationMin: Math.max(1, Math.round(trip.duration / 60)),
          };
          routeCache.set(cacheKey, result);
          return result;
        }
      }
    } catch {
      // Fallback to Nearest Neighbor sorting + road routing
    }

    // Fallback: Sort via Nearest Neighbor algorithm
    const nnSorted = sortStopsByNearestNeighbor(origin, validStops);
    const coords = await getMultiStopRoadRoute([origin, ...nnSorted]);
    let estKm = 0;
    for (let i = 0; i < nnSorted.length; i++) {
      estKm += getHaversineDistance(i === 0 ? origin : nnSorted[i - 1], nnSorted[i]);
    }
    estKm = +(estKm * 1.3).toFixed(2); // 1.3 road curvature factor

    return {
      orderedStops: nnSorted,
      coordinates: coords,
      totalDistanceKm: estKm,
      totalDurationMin: Math.max(2, Math.round(estKm * 3)),
    };
  });
}


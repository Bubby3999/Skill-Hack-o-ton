import type { LatLng } from '../contracts';

const EARTH_RADIUS_MI = 3958.7613;
const rad = (d: number) => (d * Math.PI) / 180;

/** Haversine distance in miles, rounded to one decimal. */
export function distanceMiles(a: LatLng, b: LatLng): number {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  const miles = 2 * EARTH_RADIUS_MI * Math.asin(Math.min(1, Math.sqrt(h)));
  return Math.round(miles * 10) / 10;
}

export type PositionResult =
  | { ok: true; lat: number; lng: number }
  | { ok: false; reason: 'denied' | 'unavailable' | 'timeout' | 'unsupported' };

/** Geolocation as a promise with a typed failure reason. Needs HTTPS or localhost. */
export function getPosition(timeoutMs = 10_000): Promise<PositionResult> {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      resolve({ ok: false, reason: 'unsupported' });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ ok: true, lat: p.coords.latitude, lng: p.coords.longitude }),
      (e) => resolve({ ok: false, reason: e.code === 1 ? 'denied' : e.code === 3 ? 'timeout' : 'unavailable' }),
      { timeout: timeoutMs, maximumAge: 60_000 },
    );
  });
}

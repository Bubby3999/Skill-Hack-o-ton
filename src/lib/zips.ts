import { ZIP_CENTROIDS } from '../data/zips';

export const ZIP_OUT_OF_AREA_MESSAGE = 'This demo covers Oakland-area ZIPs.';
export const ZIP_FORMAT_MESSAGE = 'Enter a 5-digit ZIP code.';

export type ZipResult =
  | { ok: true; zip: string; lat: number; lng: number; label: string }
  | { ok: false; reason: 'format' | 'out-of-area'; message: string };

/** No silent default: a ZIP outside the bundled table is an error. */
export function lookupZip(input: string): ZipResult {
  const zip = input.trim();
  if (!/^\d{5}$/.test(zip)) return { ok: false, reason: 'format', message: ZIP_FORMAT_MESSAGE };
  const c = ZIP_CENTROIDS[zip];
  if (!c) return { ok: false, reason: 'out-of-area', message: ZIP_OUT_OF_AREA_MESSAGE };
  return { ok: true, zip, lat: c[0], lng: c[1], label: `ZIP ${zip}` };
}

import type { FeatureKey, FeatureStatus } from './features';
import { isFeatureKey } from './features';

// ---- Profile ----
export type Priority = 'required' | 'nice';
export const RADII = [5, 10, 15, 25, 50] as const;
export type Radius = (typeof RADII)[number];
export const isRadius = (r: unknown): r is Radius => RADII.includes(r as Radius);

export interface Need {
  key: FeatureKey;
  priority: Priority;
}

export interface LatLng {
  lat: number;
  lng: number;
}

export interface Location extends LatLng {
  source: 'gps' | 'zip';
  zip?: string;
  label: string;
}

export interface LetterDetails {
  name?: string;
  email?: string;
  phone?: string;
}

export interface Profile {
  needs: Need[];
  location: Location;
  radius: Radius;
  letter: LetterDetails;
}

const isNum = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);
const isStr = (s: unknown): s is string => typeof s === 'string';
const isObj = (o: unknown): o is Record<string, unknown> => typeof o === 'object' && o !== null && !Array.isArray(o);

export function parseNeeds(v: unknown): Need[] | null {
  if (!Array.isArray(v)) return null;
  const seen = new Set<string>();
  const out: Need[] = [];
  for (const n of v) {
    if (!isObj(n) || !isFeatureKey(n.key) || (n.priority !== 'required' && n.priority !== 'nice')) return null;
    if (seen.has(n.key)) return null;
    seen.add(n.key);
    out.push({ key: n.key, priority: n.priority });
  }
  return out;
}

/** Trust boundary for localStorage: returns a clean Profile or null. */
export function parseProfile(v: unknown): Profile | null {
  if (!isObj(v)) return null;
  const needs = parseNeeds(v.needs);
  const loc = v.location;
  if (!needs || !isObj(loc) || !isObj(v.letter) || !isRadius(v.radius)) return null;
  if ((loc.source !== 'gps' && loc.source !== 'zip') || !isNum(loc.lat) || !isNum(loc.lng) || !isStr(loc.label)) return null;
  if (loc.zip !== undefined && !isStr(loc.zip)) return null;
  const letter: LetterDetails = {};
  for (const k of ['name', 'email', 'phone'] as const) {
    const x = v.letter[k];
    if (x !== undefined && !isStr(x)) return null;
    if (isStr(x)) letter[k] = x;
  }
  const location: Location = { source: loc.source, lat: loc.lat, lng: loc.lng, label: loc.label };
  if (isStr(loc.zip)) location.zip = loc.zip;
  return { needs, location, radius: v.radius, letter };
}

// ---- Clinic ----
export type ClinicType = 'clinic' | 'hospital' | 'urgent-care' | 'imaging';
export const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
export type Day = (typeof DAYS)[number];
/** Missing day = closed. ["00:00","24:00"] = open 24 hours. 24h clock "HH:MM". */
export type Hours = Partial<Record<Day, [open: string, close: string]>>;

export interface FeatureInfo {
  status: FeatureStatus;
  lastVerified?: string; // YYYY-MM-DD
  source?: string;
}

export interface Doctor {
  name: string;
  specialty: string;
  npi?: string; // left out of demo data: invented NPIs could match real ones
}

export interface Clinic {
  id: string;
  name: string;
  type: ClinicType;
  specialties: string[];
  address: string;
  lat: number;
  lng: number;
  phone: string;
  website: string;
  hours: Hours;
  doctors: Doctor[];
  accessFeatures: Partial<Record<FeatureKey, FeatureInfo>>;
  isDemo: true;
}

// ---- Search + match ----
export type SortMode = 'best' | 'nearest';

export interface SearchFilters {
  care: string;
  radius: Radius;
  needs: Need[];
  sort: SortMode;
  location: LatLng & { label: string };
}

export type Tier = 'strong' | 'possible' | 'poor';

export interface NeedMatch {
  key: FeatureKey;
  priority: Priority;
  /** The clinic's recorded status; a key the clinic lacks is reported as "unknown". */
  status: FeatureStatus;
}

export interface MatchResult {
  /** Needs met / total needs (0 when there are no needs). */
  score: number;
  /** null when the profile has no required needs. */
  tier: Tier | null;
  has: NeedMatch[];
  unknown: NeedMatch[];
  missing: NeedMatch[];
  /** Every need in profile order, required first (fit meter segments). */
  perNeed: NeedMatch[];
  met: number;
  total: number;
  /** Miles from the origin, one decimal. */
  distance: number;
}

// ---- Letter draft (one per clinic, keyed by clinicId) ----
export interface LetterDraft {
  clinicId: string;
  clinicName: string;
  appointmentDate: string; // YYYY-MM-DD or ""
  doctor: string;
  accommodations: FeatureKey[];
  notes: string;
  sender: LetterDetails;
  updatedAt: string; // ISO
}


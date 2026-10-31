import { parseNeeds } from '../contracts';
import type { Need, OnboardingState, OnboardingStep } from '../contracts';
import * as storage from './storage';

const STEPS: OnboardingStep[] = ['needs', 'location', 'done', 'skipped'];

/** Saved setup state, or null when setup never started (or storage is bad). */
export function loadOnboarding(): OnboardingState | null {
  const v = storage.get<unknown>(storage.KEYS.onboarding, null);
  if (typeof v !== 'object' || v === null) return null;
  const { step, needs } = v as Record<string, unknown>;
  const parsed = parseNeeds(needs);
  return STEPS.includes(step as OnboardingStep) && parsed ? { step: step as OnboardingStep, needs: parsed } : null;
}

export function saveOnboarding(step: OnboardingStep, needs: Need[] = []): boolean {
  return storage.set(storage.KEYS.onboarding, { step, needs });
}

/** Where "/" goes: resume setup, Welcome on a fresh device, otherwise Find. */
export function startPath(): string {
  const s = loadOnboarding();
  if (s?.step === 'needs') return '/welcome/needs';
  if (s?.step === 'location') return '/welcome/location';
  if (s || storage.get(storage.KEYS.profile, null) !== null) return '/find';
  return '/welcome';
}

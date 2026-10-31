import type { LetterDraft } from '../contracts';
import * as storage from './storage';

type DraftMap = Record<string, LetterDraft>;

const all = (): DraftMap => {
  const v = storage.get<unknown>(storage.KEYS.drafts, {});
  return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as DraftMap) : {};
};

/** Newest first. */
export const listDrafts = (): LetterDraft[] =>
  Object.values(all()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

export const getDraft = (clinicId: string): LetterDraft | undefined => all()[clinicId];

export function saveDraft(draft: LetterDraft): boolean {
  return storage.set(storage.KEYS.drafts, { ...all(), [draft.clinicId]: draft });
}

export function removeDraft(clinicId: string): void {
  const { [clinicId]: _gone, ...rest } = all();
  storage.set(storage.KEYS.drafts, rest);
}

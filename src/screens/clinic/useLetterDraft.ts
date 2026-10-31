import { useEffect, useState } from 'react';
import type { Clinic, LetterDraft, Profile } from '../../contracts';
import { getDraft, saveDraft } from '../../lib/drafts';
import { restoreDraft } from './letter';

export function useLetterDraft(clinic: Clinic, profile: Profile) {
  const [draft, setDraft] = useState(() => restoreDraft(getDraft(clinic.id), clinic, profile));
  const [saved, setSaved] = useState<boolean | null>(null);

  useEffect(() => { setSaved(saveDraft(draft)); }, [draft]);

  function updateDraft(patch: Partial<LetterDraft>) {
    setDraft((current) => ({ ...current, ...patch, updatedAt: new Date().toISOString() }));
  }

  function persist() {
    const result = saveDraft(draft);
    setSaved(result);
    return result;
  }

  return { draft, updateDraft, saved, persist };
}

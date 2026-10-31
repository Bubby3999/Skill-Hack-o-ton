import { beforeEach, describe, expect, it } from 'vitest';
import { installStorage } from './memoryStorage';
import { loadOnboarding, saveOnboarding, startPath } from '../../src/lib/onboarding';
import { resetDemo, saveProfile } from '../../src/lib/profile';
import { DEMO_PROFILE } from '../../src/data/demoProfile';

let ls: ReturnType<typeof installStorage>;
beforeEach(() => { ls = installStorage(); });

describe('onboarding start path', () => {
  it('opens Welcome on a fresh device', () => {
    expect(startPath()).toBe('/welcome');
  });
  it('resumes at the saved step with the picks so far', () => {
    saveOnboarding('needs', [{ key: 'scale', priority: 'required' }]);
    expect(startPath()).toBe('/welcome/needs');
    expect(loadOnboarding()?.needs).toEqual([{ key: 'scale', priority: 'required' }]);
    saveOnboarding('location', []);
    expect(startPath()).toBe('/welcome/location');
  });
  it('opens Find once setup is done or skipped, or a profile already exists', () => {
    saveOnboarding('done');
    expect(startPath()).toBe('/find');
    saveOnboarding('skipped');
    expect(startPath()).toBe('/find');
    ls.clear();
    saveProfile(DEMO_PROFILE);
    expect(startPath()).toBe('/find');
  });
  it('treats corrupted state as no state, and Reset demo starts over', () => {
    saveOnboarding('done');
    ls.setItem('carefit:onboarding', '{"step":"nope","needs":[]}');
    expect(loadOnboarding()).toBeNull();
    saveOnboarding('done');
    resetDemo();
    expect(startPath()).toBe('/welcome');
  });
});

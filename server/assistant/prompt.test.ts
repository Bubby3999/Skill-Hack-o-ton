import { describe, expect, it } from 'vitest';
import { buildChatRequest, FEATURE_KEYS, parseModelOutput, RADII } from '../../src/contracts';
import { CLINICS } from '../../src/data/clinics';
import { DEMO_PROFILE } from '../../src/data/demoProfile';
import { buildMessages, RESPONSE_SCHEMA, SYSTEM_PROMPT } from './prompt';

describe('assistant prompt and output schema', () => {
  it('includes clinic equipment, evidence and unknown rules, then the conversation verbatim', () => {
    const request = buildChatRequest(DEMO_PROFILE, [{ role: 'user', content: "Is Lakeshore's scale verified?" }]);
    const messages = buildMessages(request, CLINICS);
    expect(messages[0].role).toBe('system');
    expect(messages.slice(1)).toEqual(request.messages);
    const context = messages[0].content;
    expect(context).toContain('2026-09-18');
    expect(context).toContain('Clinic phone call');
    expect(context).toContain('an absent accessFeatures key means unknown');
    expect(context).toContain('patient-reported');
    expect(context).toContain('ZIP: 94612');
    expect(context).toContain(JSON.stringify(DEMO_PROFILE.needs));
    for (const value of Object.values(DEMO_PROFILE.letter)) expect(context).not.toContain(value);
    expect(context).not.toContain(String(DEMO_PROFILE.location.lat));
    expect(context).not.toContain(String(DEMO_PROFILE.location.lng));
    expect(SYSTEM_PROMPT).toContain('Never give medical advice');
    expect(SYSTEM_PROMPT).toContain('without changing the search filters');
  });

  it('identifies unavailable location without inventing a ZIP', () => {
    const profile = { ...DEMO_PROFILE, location: { ...DEMO_PROFILE.location, source: 'gps' as const } };
    const messages = buildMessages(buildChatRequest(profile, [{ role: 'user', content: 'Find a clinic' }]), []);
    expect(messages[0].content).toContain('ZIP and GPS location are not supplied');
    expect(messages[0].content).not.toContain('ZIP: 94612');
  });

  it('limits schema filters to the parser’s supported fields and valid values', () => {
    const filters = RESPONSE_SCHEMA.properties.filters;
    expect(Object.keys(filters.properties)).toEqual(['care', 'radius', 'needs']);
    expect(RESPONSE_SCHEMA.additionalProperties).toBe(false);
    expect(filters.additionalProperties).toBe(false);
    expect(filters.properties.needs.items.additionalProperties).toBe(false);
    expect(filters.properties.needs.items.properties.key.enum).toEqual(FEATURE_KEYS);
    expect(filters.properties.radius.enum).toEqual(RADII);
    for (const radius of RADII) {
      for (const care of filters.properties.care.enum) {
        const response = { reply: 'Search ready.', filters: { care, radius, needs: FEATURE_KEYS.map((key) => ({ key, priority: 'required' })) } };
        expect(parseModelOutput(response, new Set()).ok).toBe(true);
      }
    }
  });
});

// Worker D owns this file: system prompt, filter-schema details, clinic context, answer quality.
// Contract (read-only): the output must still parse with parseModelOutput in src/contracts/assistant.ts.
import { FEATURES, FEATURE_KEYS, RADII } from '../../src/contracts';
import type { ChatRequest, Clinic } from '../../src/contracts';
import type { OllamaMessage } from '../ollama';

const featureList = FEATURE_KEYS.map((k) => `- ${k}: ${FEATURES[k].label}`).join('\n');

export const SYSTEM_PROMPT = `You are CareFit's search assistant. CareFit helps disabled patients find clinics that have the equipment and accommodations they need.

Your job: turn the user's request into search filters, and answer short questions about clinics.

Reply ONLY with JSON: {"reply": string, "filters"?: {"care"?: string, "radius"?: number, "needs"?: [{"key": string, "priority": "required" | "nice"}]}, "clinicIds"?: string[]}

Rules:
- "care" is one of: Primary care, OB-GYN, Imaging, Urgent care.
- "radius" is in miles and must be one of: ${RADII.join(', ')}. Pick the closest allowed value.
- "needs" uses only these keys:
${featureList}
- Mark a need "required" when the user says they must have it or "need" it; otherwise "nice".
- Only include filters the user actually asked for. Leave the rest out.
- Keep "reply" to one or two short, plain sentences.
- Never give medical advice. If asked for it, say you can only help find clinics.
- Never invent clinic facts. If the data does not say, say it is unknown.`;

/** Builds the Ollama message list. D: add clinic data here for clinic questions. */
export function buildMessages(req: ChatRequest, clinics: Clinic[]): OllamaMessage[] {
  const context = `User profile needs: ${JSON.stringify(req.needs)}. Default radius: ${req.radius} mi.${req.zip ? ` ZIP: ${req.zip}.` : ''}
Clinics (id: name): ${clinics.map((c) => `${c.id}: ${c.name}`).join('; ')}`;
  return [{ role: 'system', content: `${SYSTEM_PROMPT}\n\n${context}` }, ...req.messages];
}

/** JSON schema passed to Ollama as `format`. */
export const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    reply: { type: 'string' },
    filters: {
      type: 'object',
      properties: {
        care: { type: 'string' },
        radius: { type: 'integer', enum: [...RADII] },
        needs: {
          type: 'array',
          items: {
            type: 'object',
            properties: { key: { type: 'string', enum: [...FEATURE_KEYS] }, priority: { type: 'string', enum: ['required', 'nice'] } },
            required: ['key', 'priority'],
          },
        },
      },
    },
    clinicIds: { type: 'array', items: { type: 'string' } },
  },
  required: ['reply'],
} as const;

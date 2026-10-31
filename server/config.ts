export type AiMode = 'live' | 'mock';

export interface Config {
  port: number;
  host: string;
  aiMode: AiMode;
  ollamaBaseUrl: string;
  /** Empty means "not set"; live mode then answers with a typed not_configured error. */
  ollamaModel: string;
  ollamaTimeoutMs: number;
}

/** Loads .env if present. Real environment variables win. A missing file is fine. */
export function loadEnv(): void {
  try {
    process.loadEnvFile('.env');
  } catch {
    /* no .env: defaults apply */
  }
}

const int = (v: string | undefined, fallback: number) => {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : fallback;
};

/** Never throws: anything missing or invalid falls back to a safe default (mode defaults to mock). */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const mode = (env.AI_MODE ?? '').trim().toLowerCase();
  if (mode && mode !== 'live' && mode !== 'mock') console.warn(`AI_MODE="${env.AI_MODE}" is not live or mock; using mock.`);
  return {
    port: int(env.PORT, 8787),
    host: env.HOST?.trim() || '127.0.0.1',
    aiMode: mode === 'live' ? 'live' : 'mock',
    ollamaBaseUrl: (env.OLLAMA_BASE_URL?.trim() || 'http://127.0.0.1:11434').replace(/\/+$/, ''),
    ollamaModel: env.OLLAMA_MODEL?.trim() ?? '',
    ollamaTimeoutMs: int(env.OLLAMA_TIMEOUT_MS, 60_000),
  };
}

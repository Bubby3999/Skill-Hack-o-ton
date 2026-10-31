import { useSearchParams } from 'react-router-dom';

/** Only same-app paths: one leading slash, no scheme, no "//" or backslash tricks. */
export function safeFrom(from: string | null | undefined, fallback: string): string {
  if (!from || !from.startsWith('/') || from.startsWith('//') || from.includes('\\') || from.includes('://')) return fallback;
  return from;
}

const withFrom = (path: string, from: string) => `${path}?from=${encodeURIComponent(from)}`;

/** Links into the edit screens (02, 03). Pass the current path+search as `from`. */
export const needsEditPath = (from: string) => withFrom('/profile/needs', from);
export const locationEditPath = (from: string) => withFrom('/profile/location', from);

/** On an edit screen: where Back and Save should return to. */
export function useReturnTo(fallback = '/profile'): string {
  const [params] = useSearchParams();
  return safeFrom(params.get('from'), fallback);
}

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Icon } from './Icon';

/** Toggle chip. Pass `pressed` (true/false) for a toggle; omit it for a plain suggestion button. */
export function Chip({ pressed, children, ...rest }: { pressed?: boolean; children: ReactNode } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className="chip" aria-pressed={pressed} {...rest}>
      {pressed ? <Icon name="check" className="chip__check" /> : null}
      {children}
    </button>
  );
}

export function Tag({ variant = 'default', as: As = 'span', children }: { variant?: 'default' | 'required' | 'nice' | 'filter'; as?: 'span' | 'li'; children: ReactNode }) {
  return <As className={`tag${variant === 'default' ? '' : ` tag--${variant}`}`}>{children}</As>;
}

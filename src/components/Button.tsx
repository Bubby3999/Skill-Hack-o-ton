import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from './Icon';
import type { IconName } from './Icon';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'danger-solid';

interface Common {
  variant?: Variant;
  small?: boolean;
  block?: boolean;
  icon?: IconName;
  children: ReactNode;
}

/** `to` renders an in-app link, `href` an external link, otherwise a <button> (type="button" by default). */
export function Button(
  props: Common & ({ to: string } | { href: string } | ({ to?: undefined; href?: undefined } & ButtonHTMLAttributes<HTMLButtonElement>)),
) {
  const { variant = 'primary', small, block, icon, children, ...rest } = props;
  const className = ['btn', `btn--${variant}`, small && 'btn--sm', block && 'btn--block'].filter(Boolean).join(' ');
  const content = (
    <>
      {icon ? <Icon name={icon} size={small ? 'sm' : undefined} /> : null}
      {children}
    </>
  );
  if ('to' in rest && rest.to !== undefined) return <Link className={className} to={rest.to}>{content}</Link>;
  if ('href' in rest && rest.href !== undefined) return <a className={className} href={rest.href}>{content}</a>;
  const { to: _t, href: _h, type = 'button', ...btn } = rest as ButtonHTMLAttributes<HTMLButtonElement> & { to?: undefined; href?: undefined };
  return <button className={className} type={type} {...btn}>{content}</button>;
}

/** 44x44 icon-only button. `label` becomes the accessible name. */
export function IconButton({
  icon, label, surface, ...rest
}: { icon: IconName; label: string; surface?: boolean } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label'>) {
  return (
    <button type="button" className={`icon-btn${surface ? ' icon-btn--surface' : ''}`} aria-label={label} {...rest}>
      <Icon name={icon} />
    </button>
  );
}

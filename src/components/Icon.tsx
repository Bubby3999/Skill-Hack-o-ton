import {
  Accessibility, ArrowRight, Brain, Building, Calendar, Check, ChevronDown, ChevronLeft, ChevronRight, CircleCheck,
  CircleHelp, CircleX, Clock, Copy, Ear, ExternalLink, FileText, Flag, Globe, HeartHandshake, Info, List, Locate, Lock,
  Mail, Map, MapPin, MessageCircle, Minus, Navigation, Pencil, Phone, Plus, Printer, RotateCcw, Search, Send, Share,
  ShieldCheck, SlidersHorizontal, TriangleAlert, User, UserCheck, Users, WifiOff, X,
} from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';

// Same names as design/master/icons.js. `logo` is the brand mark (below).
const ICONS = {
  accessibility: Accessibility, 'arrow-right': ArrowRight, brain: Brain, building: Building, calendar: Calendar,
  check: Check, 'chevron-down': ChevronDown, 'chevron-left': ChevronLeft, 'chevron-right': ChevronRight,
  'circle-check': CircleCheck, 'circle-help': CircleHelp, 'circle-x': CircleX, clock: Clock, copy: Copy, ear: Ear,
  'external-link': ExternalLink, 'file-text': FileText, flag: Flag, globe: Globe, 'heart-handshake': HeartHandshake,
  info: Info, list: List, locate: Locate, lock: Lock, mail: Mail, map: Map, 'map-pin': MapPin,
  'message-circle': MessageCircle, minus: Minus, navigation: Navigation, pencil: Pencil, phone: Phone, plus: Plus,
  printer: Printer, 'rotate-ccw': RotateCcw, search: Search, send: Send, share: Share, 'shield-check': ShieldCheck,
  sliders: SlidersHorizontal, 'triangle-alert': TriangleAlert, user: User, 'user-check': UserCheck, users: Users,
  'wifi-off': WifiOff, x: X,
} satisfies Record<string, ComponentType<SVGProps<SVGSVGElement>>>;

export type IconName = keyof typeof ICONS | 'logo';

/** Decorative icon (always aria-hidden). Size comes from CSS: `icon`, `icon--sm`, `icon--lg`. */
export function Icon({ name, size, className = '' }: { name: IconName; size?: 'sm' | 'lg'; className?: string }) {
  const cls = `icon${size ? ` icon--${size}` : ''}${className ? ` ${className}` : ''}`;
  if (name === 'logo') {
    return (
      <svg className={cls} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <rect width="24" height="24" rx="7" style={{ fill: 'var(--color-brand)' }} />
        <path d="M6.5 12.5l3.5 3.5 7.5-8" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ stroke: 'var(--color-on-brand)', strokeWidth: 2.6 }} />
        <circle cx="19" cy="5" r="2.6" style={{ fill: 'var(--color-accent)' }} />
      </svg>
    );
  }
  const Cmp = ICONS[name];
  return <Cmp className={cls} aria-hidden="true" focusable="false" />;
}

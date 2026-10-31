import { Button, Icon, Screen } from '../../components';
import type { IconName } from '../../components';
import { FEATURES, STATUS_LABEL } from '../../contracts';
import type { FeatureInfo, FeatureKey, FeatureStatus } from '../../contracts';
import { formatCalendarDate } from './letter';

const STATUS: Record<FeatureStatus, { className: string; icon: IconName }> = {
  verified: { className: 'verified', icon: 'circle-check' },
  'patient-reported': { className: 'reported', icon: 'user-check' },
  unknown: { className: 'unknown', icon: 'circle-help' },
  'not-available': { className: 'missing', icon: 'circle-x' },
};

export function FeatureRow({ feature, info }: { feature: FeatureKey; info?: FeatureInfo }) {
  const status = info?.status ?? 'unknown';
  const appearance = STATUS[status];
  return (
    <li className="feature-row">
      <p className="feature-row__name">{FEATURES[feature].label}</p>
      <div className="feature-row__status">
        <span className={`status status--${appearance.className}`}><Icon name={appearance.icon} />{STATUS_LABEL[status]}</span>
        <span className="small">
          {status === 'unknown' ? 'No information yet. Ask when you book.' : <>
            {info?.lastVerified && <time dateTime={info.lastVerified}>{formatCalendarDate(info.lastVerified, 'short')}</time>}
            {info?.lastVerified && info.source ? ' · ' : ''}{info?.source}
          </>}
        </span>
      </div>
    </li>
  );
}

export function ClinicNotFound() {
  return (
    <Screen title="Clinic not found" back={{ to: '/find', label: 'Find' }}>
      <h1 className="title-1">Clinic not found</h1>
      <p>We couldn't find this clinic. Find a clinic to see its details or request accommodations.</p>
      <Button to="/find">Find a clinic</Button>
    </Screen>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ActionBar, Button, Icon, Screen } from '../../components';
import type { IconName } from '../../components';
import { CATEGORIES, FEATURES, FEATURE_KEYS } from '../../contracts';
import type { Category, FeatureKey, Need, Priority } from '../../contracts';
import { useReturnTo } from '../../lib/returnTo';
import { useProfile } from '../../shell/ProfileProvider';
import './profile.css';

const CATEGORY_ICONS: Record<Category, IconName> = {
  mobility: 'accessibility', communication: 'ear', sensory: 'brain', other: 'heart-handshake',
};

export default function NeedsEditScreen() {
  const { profile, setProfile } = useProfile();
  const [needs, setNeeds] = useState<Need[]>(profile.needs);
  const from = useReturnTo('/profile');
  const navigate = useNavigate();

  function toggleNeed(key: FeatureKey, checked: boolean) {
    setNeeds((current) => checked
      ? [...current, { key, priority: 'required' }]
      : current.filter((need) => need.key !== key));
  }

  function setPriority(key: FeatureKey, priority: Priority) {
    setNeeds((current) => current.map((need) => need.key === key ? { ...need, priority } : need));
  }

  return (
    <Screen title="Access needs" back={{ to: from, label: 'Back' }} noNav dock={
      <ActionBar>
        <p className="meta" role="status">
          {needs.length} {needs.length === 1 ? 'need' : 'needs'} selected · {needs.filter((need) => need.priority === 'required').length} required
        </p>
        <Button type="submit" form="needs-form" block>Save</Button>
      </ActionBar>
    }>
      <div className="stack">
        <h1 className="title-1">What do you need at a visit?</h1>
        <p className="lead">Check any that apply, then mark each one <strong>required</strong> or <strong>nice to have</strong>. You can change these later.</p>
      </div>

      <form id="needs-form" className="stack" onSubmit={(event) => {
        event.preventDefault();
        setProfile({ ...profile, needs });
        navigate(from);
      }}>
        {CATEGORIES.map((category) => {
          const keys = FEATURE_KEYS.filter((key) => FEATURES[key].category === category.id);
          const count = needs.filter((need) => FEATURES[need.key].category === category.id).length;
          return (
            <details className="group profile-needs-group" key={category.id} open={category.id === 'mobility'}>
              <summary>
                <span className="group__icon"><Icon name={CATEGORY_ICONS[category.id]} /></span>
                <span className="group__title">{category.label}<span className="group__count">{count ? `${count} selected` : 'None'}</span></span>
                <Icon name="chevron-down" className="group__chev" />
              </summary>
              <div className="group__body">
                <ul className="check-list">
                  {keys.map((key) => {
                    const need = needs.find((item) => item.key === key);
                    return (
                      <li className="need" key={key}>
                        <label className="check">
                          <input type="checkbox" name="needs" value={key} checked={!!need} onChange={(event) => toggleNeed(key, event.target.checked)} />
                          <span>{FEATURES[key].label}</span>
                        </label>
                        {need && (
                          <fieldset className="segmented need__priority">
                            <legend className="visually-hidden">{FEATURES[key].label}: how important?</legend>
                            {(['required', 'nice'] as const).map((priority) => (
                              <label className="segmented__opt" key={priority}>
                                <input type="radio" name={`priority-${key}`} value={priority} checked={need.priority === priority} onChange={() => setPriority(key, priority)} />
                                <span><Icon name="check" />{priority === 'required' ? 'Required' : 'Nice to have'}</span>
                              </label>
                            ))}
                          </fieldset>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </details>
          );
        })}
      </form>
    </Screen>
  );
}

import 'leaflet/dist/leaflet.css';
import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { ClinicCard, IconButton, Screen } from '../../components';
import { getPosition } from '../../lib/geo';
import { useProfile } from '../../shell/ProfileProvider';
import type { RankedClinic } from '../../lib/match';
import type { Tier } from '../../contracts';
import { spreadPoints } from './declutter';
import { EmptyState } from './EmptyState';
import { ResultsHead } from './ResultsHead';
import { useResultsSearch } from './useResultsSearch';
import './find.css';

// Screen 06. Tiles come straight from OpenStreetMap; nothing is prefetched or cached.
const CENTER_ERRORS = {
  denied: 'Location permission was denied.',
  unavailable: 'Your current location is unavailable.',
  timeout: 'Finding your location took too long.',
  unsupported: 'This browser cannot use your current location.',
};
// Prev/Next wrap around, so neither button disables under keyboard focus.
const TIER_TEXT: Record<Tier, string> = { strong: 'strong fit', possible: 'possible fit', poor: 'poor fit' };

/** "1, Lakeshore Women's Health, strong fit, 4.8 miles" */
function pinLabel(rank: number, { clinic, match }: RankedClinic) {
  const fit = match.tier ? TIER_TEXT[match.tier] : match.total ? `${match.met} of ${match.total} needs` : '';
  return [rank, clinic.name, fit, `${match.distance} miles`].filter(Boolean).join(', ');
}

function Pin({ rank, item, at, selected, onSelect }: { rank: number; item: RankedClinic; at: L.LatLng; selected: boolean; onSelect: () => void }) {
  const marker = useRef<L.Marker>(null);
  const select = useRef(onSelect);
  select.current = onSelect;
  const label = pinLabel(rank, item);

  // A real <button> inside the Leaflet icon. Built once, so selecting never swaps the DOM node (keyboard focus stays).
  const icon = useMemo(() => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pin';
    btn.setAttribute('aria-pressed', 'false');
    btn.setAttribute('aria-label', label);
    btn.addEventListener('click', () => select.current());
    const body = document.createElement('span');
    body.className = 'pin__body';
    body.setAttribute('aria-hidden', 'true');
    body.textContent = String(rank);
    btn.append(body);
    return L.divIcon({ className: 'pin-icon', html: btn, iconSize: [48, 48], iconAnchor: [24, 24] });
  }, [label, rank]);

  useEffect(() => {
    marker.current?.getElement()?.querySelector('button')?.setAttribute('aria-pressed', String(selected));
  }, [selected, icon]);

  return (
    <Marker ref={marker} position={at} icon={icon} keyboard={false} zIndexOffset={selected ? 1000 : 0} />
  );
}

/** Pins at the map's current zoom, nudged apart so none overlap (each is a 48px tap target). */
function Pins({ items, sel, onSelect }: { items: RankedClinic[]; sel: number; onSelect: (i: number) => void }) {
  const map = useMap();
  const place = () => {
    const pts = items.map((i) => map.latLngToLayerPoint([i.clinic.lat, i.clinic.lng]));
    return spreadPoints(pts, 48).map((p) => map.layerPointToLatLng([p.x, p.y]));
  };
  const [at, setAt] = useState(place);
  useMapEvents({ zoomend: () => setAt(place()) });
  return items.map((it, i) => <Pin key={it.clinic.id} rank={i + 1} item={it} at={at[i] ?? map.getCenter()} selected={i === sel} onSelect={() => onSelect(i)} />);
}

const meIcon = L.divIcon({
  className: 'me-icon',
  html: '<span class="me-dot" role="img" aria-label="Your location"></span>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

export default function MapScreen() {
  const s = useResultsSearch();
  const { profile, setProfile } = useProfile();
  const [centerMsg, setCenterMsg] = useState('');
  const [locating, setLocating] = useState(false);
  const { lat, lng } = s.filters.location;
  const [map, setMap] = useState<L.Map | null>(null);
  const [sel, setSel] = useState(0);
  const items = s.items;
  const at = Math.min(sel, Math.max(items.length - 1, 0));

  const bounds = useMemo(() => L.latLngBounds([[lat, lng], ...items.map((i): [number, number] => [i.clinic.lat, i.clinic.lng])]), [lat, lng, items]);
  const key = items.map((i) => i.clinic.id).join('|');

  useEffect(() => {
    map?.getContainer().setAttribute('aria-label', 'Map of clinics. Use the numbered buttons to pick a clinic.');
  }, [map]);

  const choose = (i: number) => {
    setSel(i);
    const c = items[i]?.clinic;
    if (c && map) map.panTo([c.lat, c.lng]);
  };
  const current = items[at];
  const n = items.length;
  const gps = profile.location.source === 'gps';
  const zipText = profile.location.zip ? `ZIP ${profile.location.zip}` : 'my ZIP code';

  /** GPS profiles get a fresh fix (saved, so distances follow); ZIP profiles center on the ZIP. */
  async function center() {
    if (!map) return;
    const zoom = Math.max(map.getZoom(), 13);
    if (!gps) {
      map.setView([lat, lng], zoom);
      setCenterMsg(`Centered on ${zipText}.`);
      return;
    }
    setLocating(true);
    setCenterMsg('Finding your current location…');
    const r = await getPosition();
    setLocating(false);
    if (r.ok) {
      setProfile({ ...profile, location: { source: 'gps', label: 'Current location', lat: r.lat, lng: r.lng } });
      map.setView([r.lat, r.lng], zoom);
      setCenterMsg('Centered on your current location. Distances are updated.');
    } else {
      map.setView([lat, lng], zoom);
      setCenterMsg(`${CENTER_ERRORS[r.reason]} Centered on your saved location.`);
    }
  }

  return (
    <Screen title={s.title} back={{ to: '/find', label: 'Find' }} flush>
      <div className="results-head stack">
        <ResultsHead s={s} view="map" />
        {s.showEmpty ? <EmptyState s={s} /> : null}
        <p className={centerMsg ? 'hint' : 'visually-hidden'} role="status">{centerMsg}</p>
      </div>
      {s.showEmpty ? null : (
        <div className="map-view">
          <div className="map-view__canvas">
            <MapContainer
              key={key} ref={setMap} bounds={bounds} boundsOptions={{ paddingTopLeft: [48, 72], paddingBottomRight: [88, 64], maxZoom: 14 }}
              zoomControl={false} attributionControl={false} className="map-view__map"
            >
              <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={19} />
              <Marker position={[lat, lng]} icon={meIcon} interactive={false} keyboard={false} zIndexOffset={-500} />
              <Pins items={items} sel={at} onSelect={choose} />
            </MapContainer>
            <a className="map-view__attr" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">
              © OpenStreetMap contributors<span className="visually-hidden"> (opens in a new tab)</span>
            </a>
            <div className="map-view__controls">
              <IconButton surface icon="plus" label="Zoom in" onClick={() => map?.zoomIn()} />
              <IconButton surface icon="minus" label="Zoom out" onClick={() => map?.zoomOut()} />
              <IconButton
                surface icon="locate" label={gps ? 'Center on my location' : `Center on ${zipText}`}
                aria-busy={locating} onClick={center}
              />
            </div>
          </div>
          {current ? (
            <section className="sheet" aria-labelledby="sheet-h">
              <div className="sheet__handle" aria-hidden="true" />
              <div className="sheet__nav">
                <IconButton icon="chevron-left" label="Previous clinic" disabled={n < 2} onClick={() => choose((at - 1 + n) % n)} />
                <h2 className="meta strong" id="sheet-h" aria-live="polite">Clinic {at + 1} of {n}</h2>
                <IconButton icon="chevron-right" label="Next clinic" disabled={n < 2} onClick={() => choose((at + 1) % n)} />
              </div>
              <ClinicCard rank={at + 1} clinic={current.clinic} match={current.match} as="h3" variant="compact" />
            </section>
          ) : null}
        </div>
      )}
    </Screen>
  );
}

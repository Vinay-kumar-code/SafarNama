import { useState } from 'react';
import { ArrowUpRight, Check, Compass, Landmark, Map as MapIcon, MapPin, Stamp } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useCommunity } from '../../context/CommunityContext';
import { useSocial } from '../../context/SocialContext';
import { formatVisitDate } from '../../lib/passport';
import type { DestinationHub } from '../../types';
import { EmptyState, TravelImage } from './Primitives';
import { VisitEditor } from './VisitEditor';

const milestones = [
  { label: 'First stamp', goal: 1, unit: 'destinations', Icon: Stamp },
  { label: 'Five destinations', goal: 5, unit: 'destinations', Icon: Compass },
  { label: 'Ten destinations', goal: 10, unit: 'destinations', Icon: Landmark },
  { label: 'Across India', goal: 5, unit: 'states & UTs', Icon: MapIcon },
] as const;

type StampDestination = Pick<DestinationHub, 'id' | 'name' | 'state'>;

export function PassportView() {
  const { passport } = useSocial();
  const { destinations } = useCommunity();
  const { setActiveTab, setActiveDestination } = useApp();
  const [editing, setEditing] = useState<StampDestination>();
  const catalogue = new Map(destinations.map(place => [place.id, place]));
  const states = new Set(passport.map(visit => (catalogue.get(visit.destinationId)?.state ?? visit.state).trim().toLowerCase()).filter(Boolean));
  const totals = { destinations: passport.length, 'states & UTs': states.size };
  const earnedCount = milestones.filter(milestone => totals[milestone.unit] >= milestone.goal).length;

  return <section className="sn-passport" aria-labelledby="passport-title">
    <div className="sn-passport-cover">
      <div><h2 id="passport-title">Traveller Passport</h2><p>Collect a stamp for each place you’ve visited.</p></div>
      <Stamp className="sn-passport-cover-mark" size={49} strokeWidth={1.25} aria-hidden="true" />
      <dl className="sn-passport-totals">
        <div><dt>Destinations visited</dt><dd>{totals.destinations}</dd></div>
        <div><dt>States &amp; UTs</dt><dd>{totals['states & UTs']}</dd></div>
        <div><dt>Badges earned</dt><dd>{earnedCount}</dd></div>
      </dl>
    </div>

    <section className="sn-secondary-stack" aria-labelledby="stamps-title">
      <div className="sn-row-heading"><h3 id="stamps-title">Your stamps</h3>{passport.length > 0 &&
        <button className="sn-button secondary" onClick={() => setActiveTab('explore')}><MapPin size={15} /> Explore places</button>}</div>
      {passport.length ? <ul className="sn-panel sn-passport-stamps">{passport.map(visit => {
        const place = catalogue.get(visit.destinationId);
        const destination = place ?? { id: visit.destinationId, name: visit.name, state: visit.state };
        return <li className="sn-list-row" key={visit.destinationId}>
          {place?.coverImage
            ? <TravelImage src={place.coverImage} alt="" className="sn-stamp-photo" />
            : <span className="sn-soft-icon sn-stamp-photo"><Stamp size={20} /></span>}
          <div className="sn-list-text">
            {place ? <button className="sn-stamp-place" onClick={() => setActiveDestination(place)}>{place.name}<ArrowUpRight size={14} /></button>
              : <strong>{destination.name}</strong>}
            <p>{destination.state}{visit.visitedOn && <> · <time dateTime={visit.visitedOn}>{formatVisitDate(visit.visitedOn)}</time></>}</p>
          </div>
          <button className="sn-button secondary" aria-label={`Edit passport stamp for ${destination.name}`} onClick={() => setEditing(destination)}>Edit</button>
        </li>;
      })}</ul> : <EmptyState title="Add your first stamp" description="Open a destination you’ve been to and choose Mark visited."
        action={<button className="sn-button" onClick={() => setActiveTab('explore')}>Explore destinations</button>} />}
    </section>

    <section className="sn-secondary-stack" aria-labelledby="badges-title">
      <h3 id="badges-title">Badges</h3>
      <ul className="sn-passport-badges">{milestones.map(({ label, goal, unit, Icon }) => {
        const progress = Math.min(totals[unit], goal);
        const earned = progress === goal;
        return <li className="sn-panel sn-passport-badge" key={label} data-earned={earned}>
          <span className="sn-soft-icon"><Icon size={18} aria-hidden="true" /></span>
          <div><strong>{label}</strong>
            <p>{earned ? <><Check size={13} /> Earned</> : `${progress} of ${goal} ${goal === 1 ? 'destination' : unit}`}</p>
          </div>
        </li>;
      })}</ul>
    </section>
    {editing && <VisitEditor destination={editing} onClose={() => setEditing(undefined)} />}
  </section>;
}

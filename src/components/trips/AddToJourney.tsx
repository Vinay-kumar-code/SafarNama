import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useSocial } from '../../context/SocialContext';
import { samePlace, type JourneyStopInput } from '../../context/useJourneys';
import { Modal } from '../social/Primitives';

export function AddToJourney({ stop, onClose }: { stop: JourneyStopInput; onClose: () => void }) {
  const { journeys } = useApp();
  const { notify } = useSocial();
  const available = journeys.trips.filter(trip => !trip.stops.some(item => samePlace(item, stop)) && trip.stops.length < 250);
  const [tripId, setTripId] = useState(() => available.find(trip => trip.id === journeys.current?.id)?.id ?? available[0]?.id ?? '');
  const [title, setTitle] = useState('');
  const [day, setDay] = useState('1');
  const target = journeys.trips.find(trip => trip.id === tripId);
  const canCreate = journeys.trips.length < 20;
  const canAdd = target ? available.some(trip => trip.id === tripId) : !tripId && canCreate && Boolean(title.trim());
  const problem = target?.stops.some(item => samePlace(item, stop)) ? 'This place is already in this journey.'
    : target && target.stops.length >= 250 ? 'This journey already has 250 stops.'
    : !target && !canCreate ? 'You can keep up to 20 journeys. Choose an existing journey.' : '';

  return <Modal title="Add to journey" onClose={() => { if (!journeys.saving) onClose(); }}>
    <form className="sn-secondary-form" onSubmit={async event => {
      event.preventDefault();
      if (!journeys.ready || !canAdd) return;
      const added = target ? await journeys.addStop(target.id, stop, Number(day)) : await journeys.createTrip(title, stop, Number(day));
      if (!added) return;
      if (target) journeys.selectTrip(target.id);
      notify(`Added ${stop.spotName} to ${target?.title ?? title.trim()}.`);
      onClose();
    }}>
      <p className="sn-secondary-body">{stop.spotName}, {stop.state}</p>
      {journeys.trips.length > 0 && <label className="sn-secondary-label">Journey
        <select className="sn-field" value={tripId} onChange={event => setTripId(event.target.value)}>
          <option value="" disabled={!canCreate}>New journey</option>
          {journeys.trips.map(trip => <option key={trip.id} value={trip.id}>{trip.title}</option>)}
        </select>
      </label>}
      {!tripId && canCreate && <label className="sn-secondary-label">Journey name
        <input className="sn-field" value={title} onChange={event => setTitle(event.target.value)} maxLength={100} required autoFocus />
      </label>}
      <label className="sn-secondary-label">Day
        <input className="sn-field" type="number" min={1} max={99} required value={day} onChange={event => setDay(event.target.value)} />
      </label>
      {problem && <p className="sn-secondary-body" role="status">{problem}</p>}
      <div className="sn-secondary-actions">
        <button className="sn-button" disabled={!canAdd || !journeys.ready || journeys.saving}>{journeys.saving ? 'Saving…' : 'Add stop'}</button>
      </div>
    </form>
  </Modal>;
}

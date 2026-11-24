import { useState, type FormEvent } from 'react';
import { Stamp } from 'lucide-react';
import { useSocial } from '../../context/SocialContext';
import { todayLocal } from '../../lib/passport';
import type { DestinationHub } from '../../types';
import { Modal } from './Primitives';

export function VisitEditor({ destination, onClose }: {
  destination: Pick<DestinationHub, 'id' | 'name' | 'state'>;
  onClose: () => void;
}) {
  const { passport, saveVisit, removeVisit, notify } = useSocial();
  const stamp = passport.find(visit => visit.destinationId === destination.id);
  const [date, setDate] = useState(stamp?.visitedOn ?? '');
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      if (removing) {
        await removeVisit(destination.id);
        notify('Passport stamp removed.');
      } else {
        await saveVisit(destination, date);
        notify(stamp ? 'Passport stamp updated.' : 'Stamp added to your passport.');
      }
      onClose();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Could not save your passport.');
    } finally { setBusy(false); }
  }

  return <Modal title={removing ? 'Remove this stamp?' : stamp ? 'Edit passport stamp' : 'Stamp your passport'} onClose={() => { if (!busy) onClose(); }}>
    <form className="sn-secondary-form" onSubmit={submit}>
      <div className="sn-passport-destination">
        <span className="sn-soft-icon"><Stamp size={20} /></span>
        <div><strong>{destination.name}</strong><p>{destination.state}</p></div>
      </div>
      {removing ? <p>Remove this destination from your visited places?</p> :
        <label className="sn-secondary-label">Visit date <small>Optional</small>
          <input className="sn-field" type="date" value={date} max={todayLocal()} onChange={event => setDate(event.target.value)} />
        </label>}
      {error && <p className="sn-form-feedback" role="alert">{error}</p>}
      <div className="sn-secondary-actions">
        {stamp && <button type="button" disabled={busy} className="sn-button secondary" onClick={() => { setRemoving(!removing); setError(''); }}>
          {removing ? 'Keep stamp' : 'Remove stamp'}
        </button>}
        <button className="sn-button" disabled={busy}>{busy ? 'Saving…' : removing ? 'Remove stamp' : stamp ? 'Save changes' : 'Add stamp'}</button>
      </div>
    </form>
  </Modal>;
}

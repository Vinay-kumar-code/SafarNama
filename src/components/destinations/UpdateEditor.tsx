import { useState, type FormEvent } from 'react';
import { useCommunity } from '../../context/CommunityContext';
import type { DestinationHub, DestinationUpdate } from '../../types';
import { Modal } from '../social/Primitives';

const updateCategories: DestinationUpdate['category'][] = ['Weather', 'Opening hours', 'Travel advisory', 'Local news'];

export function UpdateEditor({ destination, onClose, onSave }: { destination: DestinationHub; onClose: () => void; onSave: () => void }) {
  const { publishUpdate } = useCommunity();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function publish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    const fields = new FormData(event.currentTarget);
    try {
      await publishUpdate(destination.id, {
        category: fields.get('category') as DestinationUpdate['category'],
        title: String(fields.get('title')), detail: String(fields.get('detail')),
      });
      onSave();
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Could not publish the update.'); }
    finally { setBusy(false); }
  }
  return <Modal title={`Update ${destination.name}`} onClose={() => { if (!busy) onClose(); }}>
    <form className="sn-secondary-form" onSubmit={publish}>
      <label className="sn-secondary-label">Update type<select className="sn-field" name="category">{updateCategories.map(category => <option key={category}>{category}</option>)}</select></label>
      <label className="sn-secondary-label">Title<input className="sn-field" name="title" maxLength={120} required autoFocus /></label>
      <label className="sn-secondary-label">What should travelers know?<textarea className="sn-field" name="detail" maxLength={2000} rows={5} required /></label>
      {error && <p className="sn-form-feedback" role="alert">{error}</p>}
      <div className="sn-secondary-actions"><button className="sn-button" disabled={busy}>{busy ? 'Publishing…' : 'Publish update'}</button></div>
    </form>
  </Modal>;
}

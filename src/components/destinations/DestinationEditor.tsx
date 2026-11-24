import { useState, type FormEvent } from 'react';
import { MapPin } from 'lucide-react';
import { useCommunity, type DestinationInput } from '../../context/CommunityContext';
import type { DestinationHub } from '../../types';
import type { SearchLocation } from '../map/locationSearch';
import { Modal } from '../social/Primitives';
import { storeMedia, removeMedia } from '../../lib/localMedia';

export function DestinationEditor({ place, location, onClose, onSave }: {
  place?: DestinationHub;
  location?: SearchLocation;
  onClose: () => void;
  onSave: (destination: DestinationHub) => void;
}) {
  const { saveDestination } = useCommunity();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setError('');
    const fields = new FormData(event.currentTarget);
    const read = (key: string) => String(fields.get(key) ?? '').trim();
    const latitude = Number(read('latitude'));
    const longitude = Number(read('longitude'));
    const coverImage = read('cover') || read('existing-cover');
    const photo = fields.get('cover-file');
    let uploaded: string | undefined;
    setBusy(true);
    try {
      if (photo instanceof File && photo.size > 0) {
        if (!photo.type.startsWith('image/') || photo.size > 8 * 1024 * 1024) throw new Error('Choose an image under 8 MB.');
        uploaded = await storeMedia(photo);
      } else if (coverImage && coverImage !== place?.coverImage && !['https:', 'http:'].includes(new URL(coverImage).protocol)) {
        throw new Error('Use a web address for the cover photo.');
      }
      const input: DestinationInput = {
        name: read('name'), state: read('state'), region: read('region') || read('state'), overview: read('overview'),
        tagline: read('tagline') || read('overview').slice(0, 120), coverImage: uploaded ?? coverImage,
        latitude, longitude, bestTimeToVisit: read('season'), openingHours: read('hours'),
        estimatedDailyBudgetInr: Number(read('budget')) || 0,
      };
      onSave(await saveDestination(input, place?.id));
    } catch (failure) {
      if (uploaded) await removeMedia(uploaded).catch(() => {});
      setError(failure instanceof Error ? failure.message : 'Could not save the destination.');
    } finally { setBusy(false); }
  }

  return <Modal title={place ? 'Edit destination' : 'Add a destination'} onClose={() => { if (!busy) onClose(); }}>
    <form className="sn-secondary-form" onSubmit={save}>
      <label className="sn-secondary-label">Destination name<input className="sn-field" name="name" defaultValue={place?.name} maxLength={90} required autoFocus /></label>
      <div className="sn-account-fields">
        <label className="sn-secondary-label">State or territory<input className="sn-field" name="state" defaultValue={place?.state ?? location?.state} maxLength={65} required /></label>
        <label className="sn-secondary-label">Region<input className="sn-field" name="region" defaultValue={place?.region} maxLength={65} /></label>
      </div>
      <fieldset className="sn-editor-location">
        <legend><MapPin size={15} /> Map location</legend>
        <div className="sn-account-fields">
          <label className="sn-secondary-label">Latitude<input className="sn-field" name="latitude" type="number" min="-90" max="90" step="any" defaultValue={place?.latitude ?? (!location?.fromGoogle ? location?.latitude : undefined)} required /></label>
          <label className="sn-secondary-label">Longitude<input className="sn-field" name="longitude" type="number" min="-180" max="180" step="any" defaultValue={place?.longitude ?? (!location?.fromGoogle ? location?.longitude : undefined)} required /></label>
        </div>
        {!place && <small className="sn-secondary-body">Use the destination’s exact pin coordinates. You can search coordinates on the map to start from that point.</small>}
      </fieldset>
      <label className="sn-secondary-label">Short introduction<input className="sn-field" name="tagline" defaultValue={place?.tagline} maxLength={120} /></label>
      <label className="sn-secondary-label">About the destination<textarea className="sn-field" name="overview" defaultValue={place?.overview} rows={4} maxLength={2500} required /></label>
      <label className="sn-secondary-label">Cover photo<input className="sn-field" name="cover-file" type="file" accept="image/*" /></label>
      <label className="sn-secondary-label">Or use a photo URL<input className="sn-field" name="cover" placeholder="https://…" defaultValue={place?.coverImage.startsWith('local-media:') ? '' : place?.coverImage} /></label>
      {place?.coverImage.startsWith('local-media:') && <input type="hidden" name="existing-cover" value={place.coverImage} />}
      <div className="sn-account-fields">
        <label className="sn-secondary-label">Opening hours<input className="sn-field" name="hours" defaultValue={place?.openingHours} maxLength={180} /></label>
        <label className="sn-secondary-label">Best time to visit<input className="sn-field" name="season" defaultValue={place?.bestTimeToVisit} maxLength={180} /></label>
      </div>
      <label className="sn-secondary-label">Estimated daily budget (₹)<input className="sn-field" name="budget" type="number" min="0" step="1" defaultValue={place?.estimatedDailyBudgetInr || ''} /></label>
      {error && <p className="sn-form-feedback" role="alert">{error}</p>}
      <div className="sn-secondary-actions"><button className="sn-button" disabled={busy}>{busy ? 'Saving…' : place ? 'Save changes' : 'Publish destination'}</button></div>
    </form>
  </Modal>;
}

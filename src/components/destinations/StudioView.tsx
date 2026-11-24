import { useState, type FormEvent } from 'react';
import { BellPlus, Building2, MapPin, Pencil, Plus, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useCommunity } from '../../context/CommunityContext';
import { useSocial } from '../../context/SocialContext';
import { accountLabels } from '../../lib/authHelpers';
import type { DestinationHub, DestinationListing } from '../../types';
import { UpdateEditor } from './UpdateEditor';
import { DestinationEditor } from './DestinationEditor';
import { ListingCard, UpdateCard } from './CommunityCards';
import { EmptyState, Modal } from '../social/Primitives';

const businessCategories: DestinationListing['category'][] = ['Hotel or stay', 'Travel agency', 'Food and drink', 'Local service'];

function ListingEditor({ tour, listing, onClose, onSave }: { tour: boolean; listing?: DestinationListing; onClose: () => void; onSave: () => void }) {
  const { destinations, publishListing } = useCommunity();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function publish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    const values = new FormData(event.currentTarget);
    const read = (key: string) => String(values.get(key) ?? '').trim();
    const price = read('price');
    try {
      await publishListing({
        destinationId: read('destination'),
        category: tour ? 'Tour package' : read('category') as DestinationListing['category'],
        title: read('title'), detail: read('detail'), duration: tour ? read('duration') : undefined,
        priceInr: price ? Number(price) : undefined, contactUrl: read('website') || undefined,
      }, listing?.id);
      onSave();
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Could not save this listing.'); }
    finally { setBusy(false); }
  }
  return <Modal title={listing ? 'Edit listing' : tour ? 'Add a tour package' : 'Promote your business'} onClose={() => { if (!busy) onClose(); }}>
    <form className="sn-secondary-form" onSubmit={publish}>
      <label className="sn-secondary-label">{tour ? 'Tour name' : 'Business name'}<input className="sn-field" name="title" defaultValue={listing?.title} required maxLength={100} autoFocus /></label>
      <label className="sn-secondary-label">Destination<select className="sn-field" name="destination" defaultValue={listing?.destinationId ?? ''} required><option value="">Choose a destination</option>{destinations.map(place => <option key={place.id} value={place.id}>{place.name}</option>)}</select></label>
      {!tour && <label className="sn-secondary-label">Business category<select className="sn-field" name="category" defaultValue={listing?.category}>{businessCategories.map(category => <option key={category}>{category}</option>)}</select></label>}
      <label className="sn-secondary-label">{tour ? 'Itinerary and what’s included' : 'What do you offer?'}<textarea className="sn-field" name="detail" rows={5} defaultValue={listing?.detail} required maxLength={2800} /></label>
      <div className="sn-account-fields">
        {tour && <label className="sn-secondary-label">Duration<input name="duration" className="sn-field" placeholder="e.g. 3 days" maxLength={60} defaultValue={listing?.duration} /></label>}
        <label className="sn-secondary-label">Starting price (₹)<input className="sn-field" name="price" type="number" min="0" step="1" defaultValue={listing?.priceInr} /></label>
      </div>
      <label className="sn-secondary-label">Website or booking link<input className="sn-field" name="website" type="url" placeholder="https://…" defaultValue={listing?.contactUrl} /></label>
      {error && <p className="sn-form-feedback" role="alert">{error}</p>}
      <div className="sn-secondary-actions"><button className="sn-button" disabled={busy}>{busy ? 'Saving…' : listing ? 'Save changes' : 'Publish listing'}</button></div>
    </form>
  </Modal>;
}

type Editor = { type: 'place'; place?: DestinationHub } | { type: 'update'; place: DestinationHub } | { type: 'listing'; tour: boolean; listing?: DestinationListing };

export function StudioView() {
  const { profile, openAuthModal } = useAuth();
  const { setActiveTab, setActiveDestination } = useApp();
  const { destinations, canManage, updates, listings, removeListing, removeUpdate } = useCommunity();
  const { notify } = useSocial();
  const [editor, setEditor] = useState<Editor>();
  const [remove, setRemove] = useState<{ id: string; title: string; type: 'listing' | 'update' }>();
  const [removing, setRemoving] = useState(false);
  if (!profile) return <section className="sn-secondary-page">
    <EmptyState title="Sign in to manage your work" description="Create destination pages, publish tours, or list your business." action={<button className="sn-button" onClick={() => openAuthModal()}>Sign in</button>} />
  </section>;
  const managed = destinations.filter(place => canManage(place.id));
  const managedIds = new Set(managed.map(place => place.id));
  const ownListings = listings.filter(listing => listing.author.id === profile.id);
  const ownUpdates = updates.filter(update => managedIds.has(update.destinationId));
  const tour = profile.activeRole === 'local_guide';
  const canList = tour || profile.activeRole === 'business';
  function done(message: string) { setEditor(undefined); notify(message); }

  return <section className="sn-secondary-page sn-studio" aria-labelledby="studio-title">
    <header className="sn-page-heading"><div><h1 id="studio-title">Publishing studio<span>.</span></h1><p>{profile.activeRole === 'admin' || profile.activeRole === 'creator' ? profile.fullName : accountLabels[profile.activeRole]}</p></div></header>
    <div className="sn-secondary-stack">
      <section className="sn-secondary-stack" aria-label="Your destinations">
        <div className="sn-row-heading"><h2>Destinations</h2><div className="sn-secondary-actions">
          <button className="sn-button secondary" onClick={() => setActiveTab('map')}><MapPin size={15} /> Place on map</button>
          <button className="sn-button" onClick={() => setEditor({ type: 'place' })}><Plus size={16} /> Add destination</button>
        </div></div>
        {managed.length ? <div className="sn-panel">{managed.map(place => <article className="sn-list-row sn-studio-place" key={place.id}>
          <div className="sn-list-text"><button className="sn-community-link" onClick={() => setActiveDestination(place)}>{place.name}</button><p className="sn-secondary-body">{place.state}</p></div>
          <div className="sn-secondary-actions">
            <button className="sn-button secondary" onClick={() => setEditor({ type: 'place', place })}><Pencil size={15} /> Edit page</button>
            <button className="sn-button secondary" onClick={() => setEditor({ type: 'update', place })}><BellPlus size={15} /> Post update</button>
          </div>
        </article>)}</div> : <p className="sn-panel sn-panel-padding sn-secondary-body">Destinations you add or are assigned to manage will appear here.</p>}
      </section>
      {(canList || ownListings.length > 0) && <section className="sn-secondary-stack" aria-label="Your listings">
        <div className="sn-row-heading"><h2>{tour ? 'Tour packages' : 'Business listings'}</h2>{canList && <button className="sn-button" onClick={() => setEditor({ type: 'listing', tour })}><Building2 size={16} />{tour ? 'New tour' : 'New listing'}</button>}</div>
        {ownListings.length ? <div className="sn-community-grid">{ownListings.map(listing => <div className="sn-studio-item" key={listing.id}><ListingCard listing={listing} showDestination /><div className="sn-secondary-actions">
          {(listing.category === 'Tour package' ? tour : profile.activeRole === 'business') && <button className="sn-button secondary" onClick={() => setEditor({ type: 'listing', tour: listing.category === 'Tour package', listing })}><Pencil size={15} /> Edit</button>}
          <button className="sn-icon" aria-label={`Remove ${listing.title}`} onClick={() => setRemove({ id: listing.id, title: listing.title, type: 'listing' })}><Trash2 size={16} /></button>
        </div></div>)}</div> : <p className="sn-panel sn-panel-padding sn-secondary-body">Listings appear on the destination’s page and in Explore search.</p>}
      </section>}
      {ownUpdates.length > 0 && <section className="sn-secondary-stack" aria-label="Published updates"><h2>Published updates</h2>
        <div className="sn-community-grid">{ownUpdates.map(update => <div className="sn-studio-item" key={update.id}><UpdateCard update={update} showDestination /><button className="sn-icon" aria-label={`Remove ${update.title}`} onClick={() => setRemove({ id: update.id, title: update.title, type: 'update' })}><Trash2 size={16} /></button></div>)}</div>
      </section>}
    </div>
    {editor?.type === 'place' && <DestinationEditor place={editor.place} onClose={() => setEditor(undefined)} onSave={() => done('Destination saved.')} />}
    {editor?.type === 'update' && <UpdateEditor destination={editor.place} onClose={() => setEditor(undefined)} onSave={() => done('Update published.')} />}
    {editor?.type === 'listing' && <ListingEditor tour={editor.tour} listing={editor.listing} onClose={() => setEditor(undefined)} onSave={() => done('Listing published.')} />}
    {remove && <Modal title="Remove from publication?" onClose={() => { if (!removing) setRemove(undefined); }}>
      <div className="sn-secondary-form"><p>{remove.title} will be removed from its destination page.</p><div className="sn-secondary-actions">
        <button className="sn-button secondary" disabled={removing} onClick={() => setRemove(undefined)}>Cancel</button>
        <button className="sn-button" disabled={removing} onClick={async () => {
          setRemoving(true);
          try {
            if (remove.type === 'listing') await removeListing(remove.id);
            else await removeUpdate(remove.id);
            notify('Removed.');
            setRemove(undefined);
          } catch (failure) { notify(failure instanceof Error ? failure.message : 'Could not remove this item.'); }
          finally { setRemoving(false); }
        }}>Remove</button>
      </div></div>
    </Modal>}
  </section>;
}

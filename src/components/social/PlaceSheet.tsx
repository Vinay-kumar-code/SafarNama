import { useState } from 'react';
import { BellPlus, Bookmark, CalendarDays, Check, Clock, HeartHandshake, IndianRupee, MapPin, Pencil, Plus, Share2, Stamp } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useCommunity } from '../../context/CommunityContext';
import { useSocial } from '../../context/SocialContext';
import { DestinationEditor } from '../destinations/DestinationEditor';
import { FollowAccount, FollowPlace, ListingCard, UpdateCard } from '../destinations/CommunityCards';
import { UpdateEditor } from '../destinations/UpdateEditor';
import { AddToJourney } from '../trips/AddToJourney';
import { formatINR } from '../../lib/utils';
import { Modal, TravelImage, EmptyState } from './Primitives';
import { PostCard } from './PostCard';
import { VisitEditor } from './VisitEditor';
import type { DestinationHub } from '../../types';
import { hasServerStorage, placeShareUrl } from '../../lib/serverStorage';
import { isNative } from '../../lib/device';
import { shareLink } from '../../lib/share';

const tabs = ['Overview', 'Updates', 'Stories', 'Tours', 'Businesses', 'Reviews'] as const;

export function PlaceSheet({ destination, onClose }: { destination: DestinationHub; onClose: () => void }) {
  const { posts, openSpotOnMap, getReviewsForDestination, addDestinationReview, journeys } = useApp();
  const { profile, openAuthModal } = useAuth();
  const { destinations, canManage, findManager, updates, listings } = useCommunity();
  const { state, togglePlace, notify, passport, openComposer, isVisible } = useSocial();
  const [tab, setTab] = useState<typeof tabs[number]>('Overview');
  const [editor, setEditor] = useState<'place' | 'update' | 'visit' | 'journey'>();
  const [review, setReview] = useState('');
  const [rating, setRating] = useState('5');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [shareStatus, setShareStatus] = useState('');
  const place = destinations.find(item => item.id === destination.id) ?? destination;
  const stories = posts.filter(post => post.destinationId === place.id && isVisible(post));
  const reviews = getReviewsForDestination(place.id);
  const placeUpdates = updates.filter(update => update.destinationId === place.id);
  const placeListings = listings.filter(item => item.destinationId === place.id && (tab === 'Tours' ? item.category === 'Tour package' : item.category !== 'Tour package'));
  const managerId = findManager(place.id) ?? placeUpdates[0]?.author.id;
  const saved = state.savedPlaces.includes(place.id);
  const visited = passport.some(visit => visit.destinationId === place.id);

  return <Modal title={place.name} onClose={onClose} className="sn-place-modal">
    <div className={`sn-place-hero ${place.coverImage ? '' : 'sn-place-no-photo'}`}>
      {place.coverImage && <TravelImage src={place.coverImage} alt={place.name} />}
      <div><span>{place.state}{place.region !== place.state && ` · ${place.region}`}</span><h1>{place.name}</h1><p>{place.tagline}</p></div>
    </div>
    <div className="sn-place-content">
      <div className="sn-place-controls">
        <button className="sn-button" onClick={() => { openSpotOnMap(place.latitude, place.longitude, place.name); onClose(); }}><MapPin size={16} />Find on map</button>
        <button className="sn-button secondary" onClick={async () => {
          setShareStatus('');
          try {
            const url = isNative && !hasServerStorage ? `https://www.google.com/maps/search/?api=1&query=${place.latitude},${place.longitude}` : placeShareUrl(place.id);
            if (await shareLink(place.name, url) === 'copied') setShareStatus('Place link copied.');
          } catch (failure) { if (!(failure instanceof DOMException && failure.name === 'AbortError')) setShareStatus('Could not share this place.'); }
        }}><Share2 size={16} /> Share place</button>
        <FollowPlace id={place.id} />
        <button className="sn-button secondary" aria-pressed={saved} onClick={() => togglePlace(place.id)}><Bookmark size={16} fill={saved ? 'currentColor' : 'none'} />{saved ? 'Saved' : 'Save place'}</button>
        {(!profile || profile.activeRole === 'traveler') && <button className={`sn-button secondary sn-visit-action${visited ? ' is-visited' : ''}`} onClick={() => profile ? setEditor('visit') : openAuthModal()}>
          {visited ? <Check size={16} /> : <Stamp size={16} />}{visited ? 'Visited · Edit stamp' : 'Mark visited'}
        </button>}
        <button className="sn-button secondary" onClick={() => { if (journeys.requireAccount()) { journeys.clearError(); setEditor('journey'); } }}><Plus size={16} /> Add to journey</button>
        {managerId && <FollowAccount id={managerId} label="Follow manager" />}
      </div>
      {shareStatus && <p className="sn-secondary-body" role="status">{shareStatus}</p>}
      {canManage(place.id) && <div className="sn-secondary-actions sn-place-manage">
        <button className="sn-button secondary" onClick={() => setEditor('place')}><Pencil size={15} /> Edit page</button>
        <button className="sn-button secondary" onClick={() => setEditor('update')}><BellPlus size={15} /> Post update</button>
      </div>}
      <div className="sn-feed-tabs sn-place-tabs" role="group" aria-label="Destination sections">{tabs.map(name => <button key={name} aria-pressed={tab === name} className={tab === name ? 'active' : ''} onClick={() => setTab(name)}>{name}</button>)}</div>
      {tab === 'Overview' && <>
        <p className="sn-place-overview">{place.overview}</p>
        {place.sourceUrl && <a className="sn-community-link" href={place.sourceUrl} target="_blank" rel="noopener noreferrer">Destination reference</a>}
        {place.photoCredit && <p className="sn-secondary-body sn-photo-credit">
          <a href={place.photoCredit.source} target="_blank" rel="noopener noreferrer">Photo by {place.photoCredit.author}</a> · <a href={place.photoCredit.licenseUrl} target="_blank" rel="noopener noreferrer">{place.photoCredit.license}</a> · resized and converted to WebP
        </p>}
        {(place.estimatedDailyBudgetInr > 0 || place.bestTimeToVisit || place.openingHours) && <div className="sn-place-facts">
          {place.estimatedDailyBudgetInr > 0 && <div><IndianRupee size={20} /><span>Daily budget<strong>~ {formatINR(place.estimatedDailyBudgetInr)}</strong></span></div>}
          {place.bestTimeToVisit && <div><CalendarDays size={20} /><span>When to go<strong>{place.bestTimeToVisit}</strong></span></div>}
          {place.openingHours && <div><Clock size={20} /><span>Opening hours<strong>{place.openingHours}</strong></span></div>}
        </div>}
        {placeUpdates[0] && <div className="sn-secondary-stack"><div className="sn-row-heading"><h3>Latest update</h3><button className="sn-community-link" onClick={() => setTab('Updates')}>See all</button></div><UpdateCard update={placeUpdates[0]} /></div>}
        {place.culturalEtiquette && <section className="sn-culture-note"><HeartHandshake size={22} /><div><h3>Local customs</h3><p>{place.culturalEtiquette}</p></div></section>}
        {place.galleryImages.length > 0 && <div className="sn-place-gallery">{place.galleryImages.slice(0, 3).map((src, index) => <TravelImage key={src} src={src} alt={`${place.name}, view ${index + 1}`} />)}</div>}
      </>}
      {tab === 'Updates' && <>
        {!state.followedPlaces.includes(place.id) && <p className="sn-secondary-body sn-place-update-note">Follow this place to see its updates under Following on Home.</p>}
        {placeUpdates.length ? <div className="sn-secondary-stack">{placeUpdates.map(item => <UpdateCard update={item} key={item.id} />)}</div>
          : <EmptyState title="No updates yet" description="Weather, opening hours, and local news from the destination’s manager will appear here." />}
      </>}
      {tab === 'Stories' && <>
        <div className="sn-secondary-actions sn-place-manage"><button className="sn-button secondary" onClick={() => openComposer('carousel_note', place.id)}><Plus size={16} /> Share a story here</button></div>
        {stories.length ? stories.map(post => <PostCard key={post.id} post={post} compact onNavigate={target => { if (target === 'map') onClose(); }} />)
          : <EmptyState title="No stories from here yet" description="Share what you saw or a tip for the next traveler." />}
      </>}
      {(tab === 'Tours' || tab === 'Businesses') && (placeListings.length ? <div className="sn-community-grid">{placeListings.map(listing => <ListingCard listing={listing} key={listing.id} />)}</div> : <EmptyState title={tab === 'Tours' ? 'No tours listed yet' : 'No businesses listed yet'} description={tab === 'Tours' ? 'Tour packages published by local guides will appear here.' : 'Stays, agencies, and services listed for this destination will appear here.'} />)}
      {tab === 'Reviews' && <>
        {profile ? <form className="sn-review-form" onSubmit={async event => {
          event.preventDefault(); if (!review.trim() || busy) return; setBusy(true); setError('');
          try { await addDestinationReview({ destinationId: place.id, destinationName: place.name, rating: Number(rating), title: 'My experience', reviewText: review.trim() }); setReview(''); }
          catch (failure) { setError(failure instanceof Error ? failure.message : 'Could not save your review.'); }
          finally { setBusy(false); }
        }}><label>Rating<select aria-label="Your rating" value={rating} onChange={event => setRating(event.target.value)}>{[5, 4, 3, 2, 1].map(value => <option value={value} key={value}>{value} {value === 1 ? 'star' : 'stars'}</option>)}</select></label>
          <textarea aria-label="Your experience" placeholder="What should another traveler know?" value={review} maxLength={1500} required onChange={event => setReview(event.target.value)} />
          <button className="sn-button" disabled={!review.trim() || busy}>{busy ? 'Saving…' : 'Add review'}</button>{error && <p role="alert">{error}</p>}
        </form> : <button className="sn-button secondary" onClick={() => openAuthModal()}>Sign in to review</button>}
        {reviews.map(item => <article className="sn-review" key={item.id}><strong>{item.author.fullName}<span>{'★'.repeat(item.rating)}</span></strong><p>{item.reviewText}</p></article>)}
      </>}
    </div>
    {editor === 'place' && <DestinationEditor place={place} onClose={() => setEditor(undefined)} onSave={() => { setEditor(undefined); notify('Destination updated.'); }} />}
    {editor === 'update' && <UpdateEditor destination={place} onClose={() => setEditor(undefined)} onSave={() => { setEditor(undefined); setTab('Updates'); notify('Update published.'); }} />}
    {editor === 'visit' && <VisitEditor destination={place} onClose={() => setEditor(undefined)} />}
    {editor === 'journey' && <AddToJourney stop={{ spotName: place.name, state: place.state, latitude: place.latitude, longitude: place.longitude,
      costInInr: place.estimatedDailyBudgetInr, thumbnailUrl: place.coverImage }} onClose={() => setEditor(undefined)} />}
  </Modal>;
}

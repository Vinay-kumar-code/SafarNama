import { useState } from 'react';
import { ArrowUpRight, Bookmark, Map, MapPin, Plus, Search, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useCommunity } from '../../context/CommunityContext';
import { useSocial } from '../../context/SocialContext';
import { formatINR } from '../../lib/utils';
import { ListingCard, UpdateCard } from '../destinations/CommunityCards';
import { DestinationEditor } from '../destinations/DestinationEditor';
import { TravelImage, EmptyState } from './Primitives';

const views = ['Destinations', 'Tours', 'Businesses', 'Updates'] as const;

export function ExploreView() {
  const { setActiveDestination, setActiveTab } = useApp();
  const { profile, openAuthModal } = useAuth();
  const { destinations, listings, updates } = useCommunity();
  const { state, togglePlace, notify } = useSocial();
  const [query, setQuery] = useState('');
  const [view, setView] = useState<typeof views[number]>('Destinations');
  const [adding, setAdding] = useState(false);
  const keyword = query.trim().toLowerCase();
  const matches = (...values: Array<string | undefined>) => values.some(value => value?.toLowerCase().includes(keyword));
  const places = destinations.filter(place => matches(place.name, place.state, place.region, place.overview));
  const destinationName = (id: string) => destinations.find(place => place.id === id)?.name;
  const shownListings = listings.filter(listing => (view === 'Tours' ? listing.category === 'Tour package' : listing.category !== 'Tour package') &&
    matches(listing.title, listing.category, listing.author.fullName, destinationName(listing.destinationId), listing.detail));
  const shownUpdates = updates.filter(update => matches(update.title, update.detail, update.category, destinationName(update.destinationId)));
  const count = view === 'Destinations' ? places.length : view === 'Updates' ? shownUpdates.length : shownListings.length;
  return <section className="sn-explore">
    <header className="sn-page-heading sn-explore-heading"><div><h1>Find your kind of India<span>.</span></h1><p>Explore destinations, local updates, tours, and stays.</p></div>
      <div className="sn-secondary-actions"><button className="sn-button secondary" onClick={() => setActiveTab('map')}><Map size={17} /> Map view</button>
        <button className="sn-button" onClick={() => profile ? setAdding(true) : openAuthModal()}><Plus size={16} /> Add destination</button></div>
    </header>
    <div className="sn-search"><Search size={20} /><input type="search" aria-label="Search Explore" placeholder="Search a name, place, or state" value={query} onChange={event => setQuery(event.target.value)} />
      {query && <button aria-label="Clear search" onClick={() => setQuery('')}><X size={18} /></button>}</div>
    <div className="sn-segment" role="group" aria-label="Explore categories">{views.map(item => <button key={item} aria-pressed={view === item} onClick={() => setView(item)}>{item}</button>)}</div>
    <div className="sn-section-heading sn-explore-section"><h2>{view}</h2><span role="status">{count} {count === 1 ? 'result' : 'results'}</span></div>
    {view === 'Destinations' && <div className="sn-place-grid">{places.map(place => <article className="sn-place-card" key={place.id}>
      <button className="sn-place-photo" onClick={() => setActiveDestination(place)}><TravelImage src={place.coverImage} alt={place.name} /><span><MapPin size={13} />{place.state}</span></button>
      <button className={`sn-place-bookmark ${state.savedPlaces.includes(place.id) ? 'saved' : ''}`} aria-label={`${state.savedPlaces.includes(place.id) ? 'Unsave' : 'Save'} ${place.name}`} aria-pressed={state.savedPlaces.includes(place.id)} onClick={() => togglePlace(place.id)}><Bookmark size={18} fill={state.savedPlaces.includes(place.id) ? 'currentColor' : 'none'} /></button>
      <button className="sn-place-title" onClick={() => setActiveDestination(place)}><h3>{place.name}</h3><ArrowUpRight size={19} /></button><p>{place.tagline}</p>
      {place.estimatedDailyBudgetInr > 0 && <footer><span>~ {formatINR(place.estimatedDailyBudgetInr)} <small>/ day</small></span></footer>}
    </article>)}</div>}
    {view === 'Updates' && <div className="sn-community-grid">{shownUpdates.map(update => <UpdateCard key={update.id} update={update} showDestination />)}</div>}
    {view !== 'Destinations' && view !== 'Updates' && <div className="sn-community-grid">{shownListings.map(listing => <ListingCard key={listing.id} listing={listing} showDestination />)}</div>}
    {count === 0 && <EmptyState title={keyword ? 'No matches' : `No ${view.toLowerCase()} yet`} description={keyword ? 'Try a different place or name.' : 'Published information will appear here.'}
      action={keyword ? <button className="sn-button secondary" onClick={() => setQuery('')}>Clear search</button> : undefined} />}
    {adding && <DestinationEditor onClose={() => setAdding(false)} onSave={place => {
      setAdding(false); setQuery(''); setView('Destinations'); setActiveDestination(place); notify('Destination added.');
    }} />}
  </section>;
}

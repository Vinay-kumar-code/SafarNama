import { useState } from 'react';
import { ArrowUpRight, Bookmark, Map as MapIcon, MapPin, Plus, Search, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useCommunity } from '../../context/CommunityContext';
import { useSocial } from '../../context/SocialContext';
import { formatINR, matchesSearch, normalizeSearch } from '../../lib/utils';
import { ListingCard, UpdateCard } from '../destinations/CommunityCards';
import { DestinationEditor } from '../destinations/DestinationEditor';
import { TravelImage, EmptyState } from './Primitives';
import { StoryResults } from './CommunitySheets';

const views = ['Destinations', 'Stories', 'Tours', 'Businesses', 'Updates'] as const;
const DEST_PAGE_SIZE = 30;

export function ExploreView() {
  const { setActiveDestination, setActiveTab, posts } = useApp();
  const { profile, openAuthModal } = useAuth();
  const { destinations, listings, updates } = useCommunity();
  const { state, togglePlace, notify, isVisible } = useSocial();
  const [query, setQuery] = useState('');
  const [view, setView] = useState<typeof views[number]>('Destinations');
  const [adding, setAdding] = useState(false);
  const [stateFilter, setStateFilter] = useState('');
  const [sort, setSort] = useState('featured');
  const [visibleCount, setVisibleCount] = useState(DEST_PAGE_SIZE);
  const terms = normalizeSearch(query).split(' ').filter(Boolean);
  const matches = (...values: Array<string | undefined>) => matchesSearch(terms, ...values);
  const states = [...new Set(destinations.map(place => place.state).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  const places = destinations.filter(place => (!stateFilter || place.state === stateFilter) && matches(place.name, place.state, place.region, place.overview));
  const budget = (amount: number) => amount > 0 ? amount : Infinity;
  if (sort === 'name') places.sort((a, b) => a.name.localeCompare(b.name));
  if (sort === 'budget') places.sort((a, b) => budget(a.estimatedDailyBudgetInr) - budget(b.estimatedDailyBudgetInr) || a.name.localeCompare(b.name));
  const catalogue = new Map(destinations.map(place => [place.id, place]));
  const destinationName = (id: string) => catalogue.get(id)?.name;
  const shownListings = listings.filter(listing => (view === 'Tours' ? listing.category === 'Tour package' : listing.category !== 'Tour package') &&
    matches(listing.title, listing.category, listing.author.fullName, destinationName(listing.destinationId), listing.detail));
  const shownUpdates = updates.filter(update => matches(update.title, update.detail, update.category, destinationName(update.destinationId)));
  const stories = view === 'Stories' ? posts.filter(post => isVisible(post) && matches(post.caption, post.spotName, post.state,
    post.author.fullName, post.author.username, post.sticker)) : [];
  const count = view === 'Destinations' ? places.length : view === 'Stories' ? stories.length : view === 'Updates' ? shownUpdates.length : shownListings.length;
  const filtered = Boolean(terms.length || (view === 'Destinations' && stateFilter));
  return <section className="sn-explore">
    <header className="sn-page-heading sn-explore-heading"><div><h1>Find your kind of India<span>.</span></h1><p>Explore destinations, local updates, tours, and stays.</p></div>
      <div className="sn-secondary-actions"><button className="sn-button secondary" onClick={() => setActiveTab('map')}><MapIcon size={17} /> Map view</button>
        <button className="sn-button" onClick={() => profile ? setAdding(true) : openAuthModal()}><Plus size={16} /> Add destination</button></div>
    </header>
    <div className="sn-search"><Search size={20} /><input type="search" aria-label="Search Explore" placeholder={view === 'Stories' ? 'Search by place, creator, or hashtag' : 'Search a name, place, or state'} value={query} onChange={event => { setQuery(event.target.value); setVisibleCount(DEST_PAGE_SIZE); }} />
      {query && <button aria-label="Clear search" onClick={() => { setQuery(''); setVisibleCount(DEST_PAGE_SIZE); }}><X size={18} /></button>}</div>
    <div className="sn-segment" role="group" aria-label="Explore categories">{views.map(item => <button key={item} aria-pressed={view === item} onClick={() => setView(item)}>{item}</button>)}</div>
    {view === 'Destinations' && <div className="sn-directory-filters">
      <label className="sn-secondary-label">State or territory<select className="sn-field" value={stateFilter} onChange={event => { setStateFilter(event.target.value); setVisibleCount(DEST_PAGE_SIZE); }}>
        <option value="">All states and territories</option>{states.map(state => <option key={state}>{state}</option>)}
      </select></label>
      <label className="sn-secondary-label">Sort by<select className="sn-field" value={sort} onChange={event => { setSort(event.target.value); setVisibleCount(DEST_PAGE_SIZE); }}>
        <option value="featured">Featured</option><option value="name">Name (A–Z)</option><option value="budget">Lowest daily budget</option>
      </select></label>
    </div>}
    <div className="sn-section-heading sn-explore-section"><h2>{view}</h2><span role="status">{count} {count === 1 ? 'result' : 'results'}</span></div>
    {view === 'Destinations' && <>
      <div className="sn-place-grid">{places.slice(0, visibleCount).map(place => <article className="sn-place-card" key={place.id}>
        <button className="sn-place-photo" onClick={() => setActiveDestination(place)}><TravelImage src={place.coverImage} alt={place.name} /><span><MapPin size={13} />{place.state}</span></button>
        <button className={`sn-place-bookmark ${state.savedPlaces.includes(place.id) ? 'saved' : ''}`} aria-label={`${state.savedPlaces.includes(place.id) ? 'Unsave' : 'Save'} ${place.name}`} aria-pressed={state.savedPlaces.includes(place.id)} onClick={() => togglePlace(place.id)}><Bookmark size={18} fill={state.savedPlaces.includes(place.id) ? 'currentColor' : 'none'} /></button>
        <button className="sn-place-title" onClick={() => setActiveDestination(place)}><h3>{place.name}</h3><ArrowUpRight size={19} /></button><p>{place.tagline}</p>
        {place.estimatedDailyBudgetInr > 0 && <footer><span>~ {formatINR(place.estimatedDailyBudgetInr)} <small>/ day</small></span></footer>}
      </article>)}</div>
      {places.length > visibleCount && <div className="sn-secondary-actions" style={{ marginTop: 16, justifyContent: 'center' }}>
        <button type="button" className="sn-button secondary" onClick={() => setVisibleCount(current => current + DEST_PAGE_SIZE)}>
          Show more destinations ({places.length - visibleCount} remaining)
        </button>
      </div>}
    </>}
    {view === 'Updates' && <div className="sn-community-grid">{shownUpdates.map(update => <UpdateCard key={update.id} update={update} showDestination />)}</div>}
    {view === 'Stories' && stories.length > 0 && <StoryResults posts={stories} />}
    {(view === 'Tours' || view === 'Businesses') && <div className="sn-community-grid">{shownListings.map(listing => <ListingCard key={listing.id} listing={listing} showDestination />)}</div>}
    {count === 0 && <EmptyState title={filtered ? 'No matches' : `No ${view.toLowerCase()} yet`} description={filtered ? 'Change or clear your filters to see more results.' : 'Published information will appear here.'}
      action={filtered ? <button className="sn-button secondary" onClick={() => { setQuery(''); if (view === 'Destinations') setStateFilter(''); }}>Clear filters</button> : undefined} />}
    {adding && <DestinationEditor onClose={() => setAdding(false)} onSave={place => {
      setAdding(false); setQuery(''); setStateFilter(''); setView('Destinations'); setActiveDestination(place); notify('Destination added.');
    }} />}
  </section>;
}

import { useMemo, useState } from 'react';
import { Search, MapPin, ArrowUpRight, Bookmark, Map, X } from 'lucide-react';
import { DESTINATION_HUBS } from '../../data/mockData';
import { useApp } from '../../context/AppContext';
import { useSocial } from '../../context/SocialContext';
import { TravelImage, EmptyState } from './Primitives';
import { formatINR } from '../../lib/utils';
const categories: Record<string, string[]> = { Mountains: ['dest-spiti'], Culture: ['dest-varanasi', 'dest-hampi'], Nature: ['dest-meghalaya', 'dest-spiti'], 'Food & streets': ['dest-old-delhi'], 'Slow travel': ['dest-varanasi', 'dest-hampi', 'dest-meghalaya'] };
export function ExploreView() {
  const { setActiveDestination, setActiveTab, posts } = useApp(); const { state, togglePlace } = useSocial();
  const [query, setQuery] = useState(''); const [category, setCategory] = useState('All places');
  const places = useMemo(() => DESTINATION_HUBS.filter(place => `${place.name} ${place.state} ${place.region} ${place.overview}`.toLowerCase().includes(query.toLowerCase().trim()) && (category === 'All places' || categories[category]?.includes(place.id))), [query, category]);
  return <div className="sn-explore"><header className="sn-page-heading"><div><span className="sn-eyebrow">A COUNTRY. A MILLION LITTLE WORLDS.</span><h1>Find your kind of India<span>.</span></h1><p>Go beyond the postcard. Get to know the place.</p></div><button className="sn-button secondary" onClick={() => setActiveTab('map')}><Map size={17} />Map view</button></header>
    <div className="sn-search"><Search size={21} /><input aria-label="Search places" placeholder="A place, a state, a little inspiration…" value={query} onChange={event => setQuery(event.target.value)} />{query && <button aria-label="Clear search" onClick={() => setQuery('')}><X size={18} /></button>}<kbd>INDIA</kbd></div>
    <div className="sn-chips" aria-label="Destination categories">{['All places', ...Object.keys(categories)].map(name => <button key={name} aria-pressed={category === name} className={category === name ? 'active' : ''} onClick={() => setCategory(name)}>{name}</button>)}</div>
    <div className="sn-section-heading"><h2>{query ? `Places matching “${query}”` : 'Somewhere you’ll remember'}</h2><span>{places.length} destinations</span></div>
    <div className="sn-place-grid">{places.map(place => <article className="sn-place-card" key={place.id}><button className="sn-place-photo" onClick={() => setActiveDestination(place)}><TravelImage src={place.coverImage} alt={place.name} /><span><MapPin size={13} />{place.state}</span></button><button className={`sn-place-bookmark ${state.savedPlaces.includes(place.id) ? 'saved' : ''}`} aria-label={`${state.savedPlaces.includes(place.id) ? 'Unsave' : 'Save'} ${place.name}`} aria-pressed={state.savedPlaces.includes(place.id)} onClick={() => togglePlace(place.id)}><Bookmark size={18} fill={state.savedPlaces.includes(place.id) ? 'currentColor' : 'none'} /></button><button className="sn-place-title" onClick={() => setActiveDestination(place)}><h3>{place.name.split(' &')[0]}</h3><ArrowUpRight size={19} /></button><p>{place.tagline}</p><footer><span>~ {formatINR(place.estimatedDailyBudgetInr)} <small>/ day</small></span><span>{posts.filter(post => post.destinationId === place.id).length} stories</span></footer></article>)}</div>
    {!places.length && <EmptyState title="A little off our map, for now" description="Try a destination or state like Hampi, Delhi, or Himachal Pradesh." action={<button className="sn-button secondary" onClick={() => { setQuery(''); setCategory('All places'); }}>Show all places</button>} />}
    <div className="sn-explore-footer"><span>✳</span><p><strong>India is best discovered through its people.</strong><br />These sample guides are a starting point. Check current local conditions before setting off.</p></div>
  </div>;
}

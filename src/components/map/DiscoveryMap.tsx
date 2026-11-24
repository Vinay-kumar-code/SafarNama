import { useRef, useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowUpRight, ChevronDown, ChevronUp, LocateFixed, MapPin, Navigation, Plus, Search, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useCommunity } from '../../context/CommunityContext';
import { useSocial } from '../../context/SocialContext';
import type { DestinationHub, Post } from '../../types';
import { haversineDistanceKm } from '../../lib/utils';
import { DestinationEditor } from '../destinations/DestinationEditor';
import { EmptyState, Modal, TravelImage } from '../social/Primitives';
import { PostCard } from '../social/PostCard';
import { GoogleMapView, type MapPinItem } from './GoogleMapView';
import { searchLocation, type SearchLocation } from './locationSearch';
import './discovery.css';

type MapEntry = MapPinItem & { guide?: DestinationHub; story?: Post; distance?: number };

export function DiscoveryMap() {
  const { posts, selectedMapSpot, clearSelectedMapSpot, setActiveDestination, closeMap, openSpotOnMap } = useApp();
  const { destinations } = useCommunity();
  const { profile, openAuthModal } = useAuth();
  const { notify } = useSocial();
  const [query, setQuery] = useState('');
  const [keyword, setKeyword] = useState('');
  const [focus, setFocus] = useState<SearchLocation>();
  const [radius, setRadius] = useState(100);
  const [mode, setMode] = useState<'Places' | 'Stories'>('Places');
  const [selectedId, setSelectedId] = useState('');
  const [storyId, setStoryId] = useState('');
  const [expanded, setExpanded] = useState(Boolean(selectedMapSpot));
  const [picking, setPicking] = useState(false);
  const [editor, setEditor] = useState<{ location?: SearchLocation }>();
  const [searching, setSearching] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [overviewRevision, setOverviewRevision] = useState(0);
  const request = useRef(0);

  const places: MapEntry[] = destinations.map(guide => ({ ...guide, guide }));
  const stories: MapEntry[] = posts.filter(post => Number.isFinite(post.latitude) && Number.isFinite(post.longitude))
    .map(story => ({ ...story, name: story.spotName, story }));
  const openedStory = posts.find(post => post.id === storyId);
  const linked: MapEntry | undefined = selectedMapSpot ? [...places, ...stories].find(pin => pin.name === selectedMapSpot.spotName &&
    haversineDistanceKm(pin.latitude, pin.longitude, selectedMapSpot.lat, selectedMapSpot.lng) < 0.2) ??
      { id: 'linked-spot', name: selectedMapSpot.spotName, state: '', latitude: selectedMapSpot.lat, longitude: selectedMapSpot.lng } : undefined;
  const activeMode = linked ? linked.story ? 'Stories' : 'Places' : mode;
  const entries = activeMode === 'Places' ? places : stories;
  const activeFocus = linked ? undefined : focus;
  const results = activeFocus ? entries.map(entry => ({
    ...entry, distance: haversineDistanceKm(activeFocus.latitude, activeFocus.longitude, entry.latitude, entry.longitude),
  })).filter(entry => entry.distance <= radius).sort((a, b) => a.distance - b.distance)
    : entries.filter(entry => linked || !keyword || `${entry.name} ${entry.state} ${entry.guide?.region ?? ''}`.toLowerCase().includes(keyword));
  const selected = linked ?? results.find(entry => entry.id === selectedId);
  const pins: MapEntry[] = linked && !results.some(entry => entry.id === linked.id) ? [linked, ...results] : results;
  const searchPin = activeFocus ? { ...activeFocus, id: 'search-center', anchor: true } : undefined;

  function clearSearch() {
    request.current++;
    setSearching(false);
    setQuery('');
    setKeyword('');
    setFocus(undefined);
    setSelectedId('');
    setFeedback('');
    clearSelectedMapSpot();
    setOverviewRevision(value => value + 1);
  }

  async function find(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const term = query.trim();
    if (!term) { clearSearch(); return; }
    const current = ++request.current;
    setMode(activeMode);
    clearSelectedMapSpot();
    setSelectedId('');
    setFeedback('');
    setSearching(true);
    let location: SearchLocation | undefined;
    try { location = await searchLocation(term, destinations); }
    catch { /* Catalogue text search is still available. */ }
    if (current !== request.current) return;
    setSearching(false);
    setFocus(location);
    setKeyword(location ? '' : term.toLowerCase());
    if (!location) setFeedback('No location found. Try a city, a destination name, or latitude and longitude.');
    setExpanded(true);
  }

  function select(id: string) {
    if (id === 'search-center') { setSelectedId(''); setOverviewRevision(value => value + 1); return; }
    if (linked?.id === id) { setExpanded(true); return; }
    setMode(activeMode);
    clearSelectedMapSpot();
    setSelectedId(id);
    setExpanded(true);
  }

  function addPlace(dropPin: boolean) {
    if (!profile) { openAuthModal(); return; }
    if (dropPin) setPicking(true);
    else setEditor({ location: focus });
  }

  function open(entry: MapEntry) {
    if (entry.guide) setActiveDestination(entry.guide);
    else if (entry.story) setStoryId(entry.story.id);
  }

  return <section className="sn-map-full" aria-label="Explore the map">
    <GoogleMapView
      pins={searchPin ? [searchPin, ...pins] : pins}
      selected={selected}
      focus={searchPin}
      radius={radius}
      onSelectPin={select}
      onPick={picking ? (latitude, longitude) => { setPicking(false); setEditor({ location: { name: '', state: focus?.state ?? '', latitude, longitude } }); } : undefined}
      overviewRevision={overviewRevision}
    />
    <header className="sn-map-top">
      <button className="sn-map-control" aria-label="Exit map" onClick={closeMap}><ArrowLeft size={21} /></button>
      <form className="sn-map-search-form" onSubmit={find}>
        <input type="search" aria-label="Search the map" placeholder="Search a city or destination" value={query} onChange={event => setQuery(event.target.value)} />
        {query && <button className="sn-icon" type="button" aria-label="Clear map search" onClick={clearSearch}><X size={17} /></button>}
        <button className="sn-map-search-submit" aria-label="Find location" disabled={searching}><Search size={18} /><span>{searching ? 'Searching…' : 'Find'}</span></button>
      </form>
      <button className="sn-map-control sn-map-add" type="button" aria-label="Add a destination" onClick={() => addPlace(false)}><Plus size={20} /><span>Add place</span></button>
    </header>
    <div className="sn-map-tools">
      <button className="sn-map-control" aria-label="Show overview" title="Show overview" onClick={clearSearch}><LocateFixed size={20} /></button>
      <button className="sn-map-control" aria-label={picking ? 'Cancel dropping a pin' : 'Drop a pin'} title={picking ? 'Cancel' : 'Drop a pin'} aria-pressed={picking} onClick={() => picking ? setPicking(false) : addPlace(true)}>{picking ? <X size={20} /> : <MapPin size={20} />}</button>
    </div>
    {picking && <div className="sn-map-pick-note" role="status">Tap the map where the destination belongs.</div>}
    <section className="sn-map-tray" data-expanded={expanded} aria-label="Map results">
      <div className="sn-map-tray-top">
        <div><h1>{activeFocus ? 'Destinations nearby' : 'Explore the map'}</h1><p>{activeFocus ? activeFocus.name : `${results.length} ${activeMode.toLowerCase()}`}</p></div>
        <button className="sn-icon sn-map-tray-toggle" aria-expanded={expanded} aria-label={expanded ? 'Collapse map results' : 'Expand map results'} onClick={() => setExpanded(!expanded)}>{expanded ? <ChevronDown size={22} /> : <ChevronUp size={22} />}</button>
      </div>
      <div className="sn-map-tray-content">
        <div className="sn-row-heading">
          <div className="sn-segment" role="group" aria-label="Show on the map">
            {(['Places', 'Stories'] as const).map(label => <button key={label} aria-pressed={activeMode === label} onClick={() => {
              setMode(label); clearSelectedMapSpot(); setSelectedId(''); setExpanded(true);
            }}>{label}</button>)}
          </div>
          {activeFocus && <select className="sn-field sn-map-radius" aria-label="Search radius" value={radius} onChange={event => setRadius(Number(event.target.value))}>{[25, 50, 100, 250, 500].map(km => <option key={km} value={km}>{km} km</option>)}</select>}
        </div>
        {feedback && <p className="sn-secondary-body" role="status">{feedback}</p>}
        {selected && <div className="sn-map-selection">
          <div className="sn-map-selection-title"><div><span className="sn-map-state">{selected.state || 'Selected pin'}</span><h2>{selected.name}</h2></div><button className="sn-icon" aria-label="Clear selected location" onClick={() => { setMode(activeMode); clearSelectedMapSpot(); setSelectedId(''); }}><X size={17} /></button></div>
          <div className="sn-secondary-actions">
            {(selected.guide || selected.story) && <button className="sn-button" onClick={() => open(selected)}>{selected.guide ? 'Open place guide' : 'Read story'}<ArrowUpRight size={15} /></button>}
            <a className="sn-button secondary" href={`https://www.google.com/maps/dir/?api=1&destination=${selected.latitude},${selected.longitude}`} target="_blank" rel="noopener noreferrer"><Navigation size={15} /> Directions</a>
          </div>
        </div>}
        {results.length ? <div className="sn-map-cards" role="list">{results.map(entry => <article key={entry.id} className="sn-map-card" data-selected={selected?.id === entry.id} role="listitem">
          <button className="sn-map-card-pick" aria-pressed={selected?.id === entry.id} aria-label={`Show ${entry.name} on map`} onClick={() => select(entry.id)}>
            <TravelImage src={entry.guide?.coverImage ?? entry.story?.thumbnailUrl} alt="" className="sn-map-card-image" />
            <span><span className="sn-map-state">{entry.state}{entry.distance !== undefined && ` · ${entry.distance < 1 ? '<1' : Math.round(entry.distance)} km`}</span><strong>{entry.name}</strong></span>
          </button>
          <button className="sn-map-link" aria-label={`Open ${entry.name}`} onClick={() => open(entry)}><ArrowUpRight size={18} /></button>
        </article>)}</div> : <EmptyState title={activeFocus ? 'No results in this radius' : 'No results'} description={activeFocus ? 'Try a wider search radius or add a destination you know.' : 'Search another location or switch to Places.'} />}
      </div>
    </section>
    {editor && <DestinationEditor location={editor.location} onClose={() => setEditor(undefined)} onSave={place => {
      setEditor(undefined);
      setFocus(undefined);
      setKeyword('');
      setExpanded(true);
      openSpotOnMap(place.latitude, place.longitude, place.name);
      notify('Destination published.');
    }} />}
    {openedStory && <Modal title={openedStory.spotName} onClose={() => setStoryId('')} className="sn-map-story"><PostCard post={openedStory} onNavigate={() => setStoryId('')} /></Modal>}
  </section>;
}

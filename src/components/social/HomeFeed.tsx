import { useState } from 'react';
import { ArrowRight, ArrowUpRight, Clapperboard, Image, MapPin, PenLine, Plus, Search } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useCommunity } from '../../context/CommunityContext';
import { useSocial } from '../../context/SocialContext';
import { UpdateCard } from '../destinations/CommunityCards';
import { PostCard } from './PostCard';
import { EmptyState, TravelImage } from './Primitives';

export function HomeFeed() {
  const { posts, currentUser, setActiveTab, setActiveDestination } = useApp();
  const { destinations, updates } = useCommunity();
  const { state, setComposerOpen, openComposer } = useSocial();
  const [filter, setFilter] = useState('For you');
  const [placeId, setPlaceId] = useState('');
  const place = destinations.find(item => item.id === placeId);
  const visiblePosts = posts.filter(post => (!place || post.destinationId === place.id) &&
    (filter === 'For you' || (filter === 'Following' ? state.following.includes(post.author.id) : post.format === 'quick_tip')));
  const visibleUpdates = updates.filter(update => (!place || update.destinationId === place.id) &&
    (filter === 'For you' || filter === 'Following' && state.following.includes(update.author.id)));
  const timeline = [
    ...visiblePosts.map(post => ({ id: post.id, date: post.createdAt, component: <PostCard key={post.id} post={post} /> })),
    ...visibleUpdates.map(update => ({ id: update.id, date: update.createdAt, component: <UpdateCard key={update.id} update={update} showDestination /> })),
  ].sort((a, b) => b.date.localeCompare(a.date));
  const featured = destinations.find(item => item.id === 'dest-hampi');
  const storyPlaces = destinations.filter(item => posts.some(post => post.destinationId === item.id) || updates.some(update => update.destinationId === item.id));

  return <div className="sn-home"><div className="sn-feed-column">
    <header className="sn-page-heading"><div><h1>India, through your eyes<span>.</span></h1><p>Travel stories and updates from the places you love.</p></div><button className="sn-icon" aria-label="Search destinations" onClick={() => setActiveTab('explore')}><Search size={22} /></button></header>
    {storyPlaces.length > 0 && <section className="sn-stories" aria-label="Stories by destination">
      {storyPlaces.map(item => <button key={item.id} className={`sn-story ${placeId === item.id ? 'selected' : ''}`} aria-pressed={placeId === item.id} onClick={() => setPlaceId(placeId === item.id ? '' : item.id)}>
        <span className="sn-story-ring"><TravelImage src={item.coverImage} alt="" /></span><strong>{item.name}</strong>
      </button>)}
    </section>}
    <div className="sn-composer-prompt"><div className="sn-profile-initial">{currentUser.id ? currentUser.fullName.slice(0, 1).toUpperCase() : <Plus size={17} />}</div><button onClick={() => setComposerOpen(true)}>Share something from your journey…</button><div className="sn-composer-shortcuts">
      <button aria-label="Create a photo story" onClick={() => openComposer('carousel_note')}><Image size={19} /></button>
      <button aria-label="Write a travel note" onClick={() => openComposer('quick_tip')}><PenLine size={18} /></button>
      <button aria-label="Create a reel" onClick={() => openComposer('reel')}><Clapperboard size={19} /></button>
    </div></div>
    <div className="sn-feed-tabs" role="group" aria-label="Feed filter">{['For you', 'Following', 'Travel notes'].map(tab => <button aria-pressed={filter === tab} key={tab} className={filter === tab ? 'active' : ''} onClick={() => setFilter(tab)}>{tab}</button>)}</div>
    {place && <div className="sn-filter-summary">From {place.name}<button onClick={() => setPlaceId('')}>Clear filter</button></div>}
    {timeline.length ? <div className="sn-community-timeline">{timeline.map(item => item.component)}</div>
      : <EmptyState title={filter === 'Following' ? 'Keep up with your favorite places' : 'Tell us where you went'} description={filter === 'Following' ? 'Follow a traveler or a destination manager to see their posts here.' : 'Share a photo, a travel note, or a reel from your journey.'}
        action={<button className="sn-button secondary" onClick={() => filter === 'Following' ? setActiveTab('explore') : setComposerOpen(true)}>{filter === 'Following' ? 'Find places to follow' : 'Create a story'}</button>} />}
    <p className="sn-feed-end"><a href="/media/credits.html" target="_blank" rel="noreferrer">Photo credits</a></p>
  </div><aside className="sn-right-rail">
    {featured && <button className="sn-featured-place" onClick={() => setActiveDestination(featured)}><TravelImage src={featured.coverImage} alt="Hampi landscape" /><div><h2>{featured.name}</h2><p><MapPin size={13} />{featured.state}, India</p><strong>Open place guide <ArrowUpRight size={16} /></strong></div></button>}
    <section className="sn-rail-section"><h3>Explore India<button onClick={() => setActiveTab('explore')} aria-label="Explore all destinations"><ArrowRight size={17} /></button></h3>
      {destinations.slice(0, 4).map(item => <button className="sn-mini-place" key={item.id} onClick={() => setActiveDestination(item)}><TravelImage src={item.coverImage} alt="" /><span><strong>{item.name}</strong><small>{item.state}</small></span><ArrowUpRight size={15} /></button>)}
    </section>
  </aside></div>;
}

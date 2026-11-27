import { useState } from 'react';
import { ArrowRight, ArrowUpRight, Clapperboard, Image, MapPin, PenLine, Plus, Search } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useCommunity } from '../../context/CommunityContext';
import { useSocial } from '../../context/SocialContext';
import { useServerData } from '../../context/ServerDataContext';
import { hasServerStorage } from '../../lib/serverStorage';
import { UpdateCard } from '../destinations/CommunityCards';
import { PostCard } from './PostCard';
import { EmptyState, TravelImage } from './Primitives';

export function HomeFeed() {
  const { posts, currentUser, setActiveTab, setActiveDestination } = useApp();
  const { openAuthModal } = useAuth();
  const { destinations, updates } = useCommunity();
  const { state, setComposerOpen, openComposer } = useSocial();
  const { snapshot, error } = useServerData();
  const [filter, setFilter] = useState('For you');
  const [placeId, setPlaceId] = useState('');
  const place = destinations.find(item => item.id === placeId);
  const visiblePosts = posts.filter(post => (!place || post.destinationId === place.id) &&
    (filter === 'For you' || (filter === 'Following' ? state.following.includes(post.author.id) : post.format === 'quick_tip')));
  const visibleUpdates = updates.filter(update => (!place || update.destinationId === place.id) &&
    (filter === 'For you' || filter === 'Following' && (state.following.includes(update.author.id) || state.followedPlaces.includes(update.destinationId))));
  const timeline = [
    ...visiblePosts.map(post => ({ date: post.createdAt, component: <PostCard key={`post-${post.id}`} post={post} /> })),
    ...visibleUpdates.map(update => ({ date: update.createdAt, component: <UpdateCard key={`update-${update.id}`} update={update} showDestination /> })),
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
    {hasServerStorage && !snapshot ? !error && <p className="sn-loading" role="status">Loading the feed…</p>
      : timeline.length ? <div className="sn-community-timeline">{timeline.map(item => item.component)}</div>
      : place ? <EmptyState title="No matching posts or updates" description={`There’s nothing in this feed for ${place.name} yet.`}
        action={<button className="sn-button secondary" onClick={() => setPlaceId('')}>Show all places</button>} />
      : filter === 'Following' ? <EmptyState title="Keep up with your favorite places" description={currentUser.id
        ? 'Follow places for local updates, or follow travelers for their stories.' : 'Sign in to follow people and get updates from the places you choose.'}
        action={currentUser.id ? <button className="sn-button secondary" onClick={() => setActiveTab('explore')}>Find places to follow</button>
          : <button className="sn-button secondary" onClick={() => openAuthModal()}>Sign in</button>} />
      : <EmptyState title={filter === 'Travel notes' ? 'No travel notes yet' : 'Tell us where you went'} description={filter === 'Travel notes'
        ? 'Share a tip or a moment from your journey.' : 'Share a photo, a travel note, or a reel from your journey.'}
        action={filter === 'Travel notes' ? <button className="sn-button secondary" onClick={() => openComposer('quick_tip')}>Write a travel note</button>
          : <button className="sn-button secondary" onClick={() => setComposerOpen(true)}>Create a story</button>} />}
    <p className="sn-feed-end"><a href="/media/credits.html" target="_blank" rel="noreferrer">Photo credits</a></p>
  </div><aside className="sn-right-rail">
    {featured && <button className="sn-featured-place" onClick={() => setActiveDestination(featured)}><TravelImage src={featured.coverImage} alt="Hampi landscape" /><div><h2>{featured.name}</h2><p><MapPin size={13} />{featured.state}, India</p><strong>Open place guide <ArrowUpRight size={16} /></strong></div></button>}
    <section className="sn-rail-section"><h3>Explore India<button onClick={() => setActiveTab('explore')} aria-label="Explore all destinations"><ArrowRight size={17} /></button></h3>
      {destinations.slice(0, 4).map(item => <button className="sn-mini-place" key={item.id} onClick={() => setActiveDestination(item)}><TravelImage src={item.coverImage} alt="" /><span><strong>{item.name}</strong><small>{item.state}</small></span><ArrowUpRight size={15} /></button>)}
    </section>
  </aside></div>;
}

import { useState } from 'react';
import { ArrowUpRight, Image, MapPin, Plus, PenLine, Clapperboard, ArrowRight, Search } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useSocial } from '../../context/SocialContext';
import { DESTINATION_HUBS } from '../../data/mockData';
import { PostCard } from './PostCard';
import { TravelImage, EmptyState } from './Primitives';
import { formatINR } from '../../lib/utils';

export function HomeFeed() {
  const { posts, currentUser, setActiveTab, setActiveDestination } = useApp();
  const { state, setComposerOpen, openComposer, toggleFollow } = useSocial();
  const [filter, setFilter] = useState('For you'); const [placeId, setPlaceId] = useState('');
  const visible = posts.filter(post => (!placeId || post.destinationId === placeId) && (filter === 'For you' || (filter === 'Following' ? state.following.includes(post.author.id) : post.format === 'quick_tip')));
  const creators = [...new Map(posts.filter(post => post.author.id !== currentUser.id).map(post => [post.author.id, post.author])).values()].slice(0, 3);
  return <div className="sn-home"><div className="sn-feed-column">
    <header className="sn-page-heading"><div><span className="sn-eyebrow">THE JOY IS IN THE JOURNEY</span><h1>India, through your eyes<span>.</span></h1><p>Little discoveries. Local voices. Stories worth sharing.</p></div><button className="sn-icon" aria-label="Search destinations" onClick={() => setActiveTab('explore')}><Search size={22} /></button></header>
    <section className="sn-stories" aria-label="Stories by destination"><button className="sn-story" onClick={() => setComposerOpen(true)}><span className="sn-story-add"><TravelImage src={currentUser.avatarUrl} alt="" /><i><Plus size={14} /></i></span><strong>Your story</strong></button>{DESTINATION_HUBS.map(place => <button className={`sn-story ${placeId === place.id ? 'selected' : ''}`} aria-pressed={placeId === place.id} key={place.id} onClick={() => setPlaceId(placeId === place.id ? '' : place.id)}><span className="sn-story-ring"><TravelImage src={place.coverImage} alt="" /></span><strong>{place.name.split(' &')[0]}</strong></button>)}</section>
    <div className="sn-composer-prompt"><TravelImage className="sn-avatar" src={currentUser.avatarUrl} alt="" /><button onClick={() => setComposerOpen(true)}>Where has your heart wandered?</button><div className="sn-composer-shortcuts"><button aria-label="Create a photo story" onClick={() => openComposer('carousel_note')}><Image size={19} /></button><button aria-label="Write a travel note" onClick={() => openComposer('quick_tip')}><PenLine size={18} /></button><button aria-label="Create a reel" onClick={() => openComposer('reel')}><Clapperboard size={19} /></button></div></div>
    <div className="sn-feed-tabs" role="group" aria-label="Feed filter">{['For you', 'Following', 'Travel notes'].map(tab => <button aria-pressed={filter === tab} key={tab} className={filter === tab ? 'active' : ''} onClick={() => setFilter(tab)}>{tab}</button>)}<span>Made of real moments</span></div>
    {placeId && <div className="sn-filter-summary">Stories from {DESTINATION_HUBS.find(place => place.id === placeId)?.name}<button onClick={() => setPlaceId('')}>Clear filter</button></div>}
    {visible.length ? visible.map(post => <PostCard key={post.id} post={post} />) : <EmptyState title={filter === 'Following' ? 'Your people, your kind of travel' : 'The next story could be yours'} description={filter === 'Following' ? 'Follow travelers from their posts to bring their journeys into this feed.' : 'Share a moment from this place or explore another destination.'} action={<button className="sn-button secondary" onClick={() => { setFilter('For you'); setPlaceId(''); }}>Explore all stories</button>} />}
    <p className="sn-feed-end">You’re all caught up. There’s a whole country out there. <span>✳</span><a href="/media/credits.html" target="_blank" rel="noreferrer">Photo credits · Community preview</a></p>
  </div><aside className="sn-right-rail">
    <div className="sn-rail-heading"><span>YOUR NEXT “LET’S GO”</span><ArrowUpRight size={16} /></div>
    <button className="sn-featured-place" onClick={() => setActiveDestination(DESTINATION_HUBS[4])}><TravelImage src={DESTINATION_HUBS[4].coverImage} alt="Hampi landscape" /><div><span>HISTORY, WITH A LITTLE WONDER</span><h2>Get a little lost<br />in Hampi.</h2><p><MapPin size={13} />Karnataka, India</p><strong>Meet the place <ArrowUpRight size={16} /></strong></div></button>
    <section className="sn-rail-section"><h3>A place for every kind of you<button onClick={() => setActiveTab('explore')} aria-label="Explore all destinations"><ArrowRight size={17} /></button></h3>{DESTINATION_HUBS.slice(0, 3).map(place => <button className="sn-mini-place" key={place.id} onClick={() => setActiveDestination(place)}><TravelImage src={place.coverImage} alt="" /><span><strong>{place.name.split(' &')[0]}</strong><small>{place.state}</small><em>~ {formatINR(place.estimatedDailyBudgetInr)} / day</em></span><ArrowUpRight size={15} /></button>)}</section>
    <section className="sn-rail-section"><h3>Good people. Great stories.</h3>{creators.map(creator => <div className="sn-creator" key={creator.id}><TravelImage className="sn-avatar" src={creator.avatarUrl} alt="" /><span><strong>{creator.fullName}</strong><small>{creator.isVerifiedGuide ? 'A local perspective' : 'Fellow wanderer'}</small></span><button className="sn-follow" onClick={() => toggleFollow(creator.id)}>{state.following.includes(creator.id) ? 'Following' : 'Follow'}</button></div>)}</section>
    <div className="sn-kind-travel"><span>LEAVE ONLY GOOD STORIES</span><p>Travel slowly. Ask before you photograph. Make room for local voices.</p><span>With love, from India <span className="sn-orange">↗</span></span></div><p className="sn-preview-label">Community preview · Stories and changes stay in this browser.</p>
  </aside></div>;
}

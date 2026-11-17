import { useState } from 'react';
import { MapPin, Settings, Plus, BookOpen, Bookmark, LogIn, LogOut, MessageCircle, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useSocial } from '../../context/SocialContext';
import { DESTINATION_HUBS } from '../../data/mockData';
import { TravelImage, EmptyState } from './Primitives';
import { PostCard } from './PostCard';
export function JournalView() {
  const { currentUser, posts, setActiveTab, setActiveDestination, currentTrip } = useApp();
  const { state, setComposerOpen } = useSocial(); const { openOnboarding, openAuthModal, isAuthenticated, signOut } = useAuth();
  const [tab, setTab] = useState('My stories');
  const own = posts.filter(post => post.author.id === currentUser.id); const saved = posts.filter(post => post.isSaved);
  const shown = tab === 'My stories' ? own : saved;
  const places = DESTINATION_HUBS.filter(place => state.savedPlaces.includes(place.id));
  return <div className="sn-journal"><div className="sn-journal-cover"><span>COLLECT MOMENTS, NOT MILES.</span><span>सफ़रनामा</span></div><header className="sn-profile"><TravelImage className="sn-profile-avatar" src={currentUser.avatarUrl} alt={currentUser.fullName} /><div className="sn-profile-actions"><button className="sn-button secondary" onClick={isAuthenticated ? openOnboarding : () => openAuthModal('signin')}><Settings size={15} />Edit profile</button><button className="sn-button" onClick={() => setComposerOpen(true)}><Plus size={16} />New story</button></div><h1>{currentUser.fullName}</h1><p className="sn-handle">@{currentUser.username}</p><p className="sn-bio">{currentUser.bio}</p><p className="sn-profile-location"><MapPin size={14} />{currentUser.homeCity}</p><div className="sn-profile-stats"><span><strong>{own.length}</strong> stories shared</span><span><strong>{new Set(own.map(post => post.state)).size}</strong> states in your stories</span><span><strong>{saved.length + places.length}</strong> saved for later</span></div></header>
    <div className="sn-journal-shortcuts"><button onClick={() => setActiveTab('trips')}><BookOpen size={21} /><span><strong>My journeys</strong><small>{currentTrip.stops.length} places in your plan</small></span></button><button onClick={() => setActiveTab('qa')}><MessageCircle size={21} /><span><strong>Conversations</strong><small>Ask the travel community</small></span></button><button onClick={() => setActiveTab('campaigns')}><Sparkles size={21} /><span><strong>Celebrate India</strong><small>Discover regional stories</small></span></button></div>
    <div className="sn-feed-tabs">{['My stories', 'Saved stories', 'Saved places'].map(name => <button key={name} className={tab === name ? 'active' : ''} aria-pressed={tab === name} onClick={() => setTab(name)}>{name}</button>)}</div>
    {tab === 'Saved places' ? places.length ? <div className="sn-saved-places">{places.map(place => <button key={place.id} onClick={() => setActiveDestination(place)}><TravelImage src={place.coverImage} alt="" /><strong>{place.name}</strong><small>{place.state}</small></button>)}</div> : <EmptyState title="Someday starts with a save" description="Bookmark places in Explore India to build your own collection." action={<button className="sn-button secondary" onClick={() => setActiveTab('explore')}>Explore India</button>} /> : shown.length ? shown.map(post => <PostCard post={post} key={post.id} />) : <EmptyState title={tab === 'My stories' ? 'Your next chapter starts here' : 'Keep the stories that move you'} description={tab === 'My stories' ? 'A photo, a small discovery, a note from the road. Make it yours.' : 'Tap the bookmark on a story to find it here later.'} action={<button className="sn-button secondary" onClick={() => tab === 'My stories' ? setComposerOpen(true) : setActiveTab('feed')}>{tab === 'My stories' ? 'Share a story' : 'Find inspiration'}</button>} />}
    <div className="sn-account-footer"><span>{isAuthenticated ? 'Your profile' : 'You’re exploring with a sample traveler profile.'}</span><button onClick={isAuthenticated ? signOut : () => openAuthModal('signin')}>{isAuthenticated ? <LogOut size={15} /> : <LogIn size={15} />}{isAuthenticated ? 'Sign out' : 'Sign in / join'}</button></div>
  </div>;
}

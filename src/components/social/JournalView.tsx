import { useState } from 'react';
import { ArrowUpRight, BookOpen, LogIn, LogOut, MapPin, MessageCircle, Plus, Settings, Sparkles, Workflow } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useCommunity } from '../../context/CommunityContext';
import { useSocial } from '../../context/SocialContext';
import { accountLabels, isAccountType } from '../../lib/authHelpers';
import { EmptyState, ProfileAvatar, TravelImage } from './Primitives';
import { PostCard } from './PostCard';
import { PassportView } from './PassportView';
import { FollowPlace } from '../destinations/CommunityCards';

const journalTabs = ['My stories', 'Saved stories', 'Saved places', 'Followed places'] as const;
type JournalTab = typeof journalTabs[number] | 'Passport';

export function JournalView() {
  const { posts, setActiveTab, setActiveDestination } = useApp();
  const { destinations } = useCommunity();
  const { state, setComposerOpen, passport } = useSocial();
  const { openOnboarding, openAuthModal, profile, signOut } = useAuth();
  const [selectedTab, setTab] = useState<JournalTab>('My stories');
  const isTraveler = profile?.activeRole === 'traveler';
  const tab = selectedTab === 'Passport' && !isTraveler ? 'My stories' : selectedTab;
  const availableTabs: readonly JournalTab[] = isTraveler ? ['Passport', ...journalTabs] : journalTabs;
  const own = profile ? posts.filter(post => post.author.id === profile.id) : [];
  const saved = posts.filter(post => post.isSaved);
  const displayed = tab === 'My stories' ? own : saved;
  const savedPlaces = destinations.filter(place => state.savedPlaces.includes(place.id));
  const followedPlaces = destinations.filter(place => state.followedPlaces.includes(place.id));

  return <section className="sn-journal">
    {profile ? <>
      <div className="sn-journal-cover" aria-hidden="true"><img src="/logo.svg" width={54} height={54} alt="" /></div>
      <header className="sn-profile">
        <ProfileAvatar profile={profile} className="sn-profile-avatar" />
        <div className="sn-profile-actions"><button className="sn-button secondary" onClick={openOnboarding}><Settings size={15} /> Settings</button><button className="sn-button" onClick={() => setComposerOpen(true)}><Plus size={15} /> New story</button></div>
        <h1>{profile.fullName}</h1><p className="sn-handle">@{profile.username}{isAccountType(profile.activeRole) && ` · ${accountLabels[profile.activeRole]}`}</p>
        {profile.bio && <p className="sn-bio">{profile.bio}</p>}
        {profile.homeCity && <p className="sn-profile-location"><MapPin size={14} />{profile.homeCity}</p>}
        <div className="sn-profile-stats"><span><strong>{own.length}</strong> stories shared</span>
          {isTraveler && <button type="button" className="sn-passport-stat" onClick={() => setTab('Passport')} aria-label={`Open passport, ${passport.length} destinations visited`}><strong>{passport.length}</strong> destinations visited</button>}
          <span><strong>{saved.length + savedPlaces.length}</strong> saved for later</span>
        </div>
      </header>
    </> : <header className="sn-page-heading"><div><h1>My journal<span>.</span></h1><p>Keep your stories, favorite places, and journeys together.</p></div></header>}
    <div className="sn-journal-shortcuts">
      <button onClick={() => setActiveTab('trips')}><BookOpen size={20} /><span><strong>My journeys</strong></span></button>
      <button onClick={() => setActiveTab('qa')}><MessageCircle size={20} /><span><strong>Conversations</strong></span></button>
      <button onClick={() => setActiveTab('campaigns')}><Sparkles size={20} /><span><strong>Celebrate India</strong></span></button>
      {profile && <button onClick={() => setActiveTab('studio')}><Workflow size={20} /><span><strong>Publishing studio</strong></span></button>}
    </div>
    {!profile ? <EmptyState title="Make this journal yours" description="Sign in or create an account to publish stories and save or follow places." action={<div className="sn-secondary-actions">
      <button className="sn-button" onClick={() => openAuthModal('signup')}>Create account</button><button className="sn-button secondary" onClick={() => openAuthModal()}><LogIn size={15} /> Sign in</button>
    </div>} /> : <>
      <div className="sn-feed-tabs sn-journal-tabs" role="group" aria-label="Your journal tabs">{availableTabs.map(name => <button key={name} aria-pressed={tab === name} className={tab === name ? 'active' : ''} onClick={() => setTab(name)}>{name}</button>)}</div>
      {tab === 'Followed places' && (followedPlaces.length ? <ul className="sn-panel">
        {followedPlaces.map(place => <li className="sn-list-row sn-followed-place" key={place.id}>
          <button className="sn-followed-place-guide" onClick={() => setActiveDestination(place)}>
            <TravelImage src={place.coverImage} alt="" />
            <span><strong>{place.name}</strong><small>{place.state}</small></span><ArrowUpRight size={15} />
          </button>
          <FollowPlace id={place.id} />
        </li>)}
      </ul> : <EmptyState title="Follow places you care about" description="Follow a destination to get its local updates in your Following feed."
        action={<button className="sn-button secondary" onClick={() => setActiveTab('explore')}>Explore India</button>} />)}
      {tab === 'Passport' && <PassportView />}
      {tab === 'Saved places' && (savedPlaces.length ? <div className="sn-saved-places">{savedPlaces.map(place => <button key={place.id} onClick={() => setActiveDestination(place)}><TravelImage src={place.coverImage} alt="" /><strong>{place.name}</strong><small>{place.state}</small></button>)}</div>
        : <EmptyState title="Save places you want to visit" description="Bookmark destinations to find them here." action={<button className="sn-button secondary" onClick={() => setActiveTab('explore')}>Explore India</button>} />
      )}
      {(tab === 'My stories' || tab === 'Saved stories') && (displayed.length ? displayed.map(post => <PostCard post={post} key={post.id} />)
        : <EmptyState title={tab === 'My stories' ? 'Your first story starts here' : 'Save stories you want to revisit'} description={tab === 'My stories' ? 'Share a photo, note, or reel from a place you’ve explored.' : 'Tap the bookmark on a story to find it again.'} action={<button className="sn-button secondary" onClick={() => tab === 'My stories' ? setComposerOpen(true) : setActiveTab('feed')}>{tab === 'My stories' ? 'Share a story' : 'Browse stories'}</button>} />)}
      <div className="sn-account-footer"><button onClick={signOut}><LogOut size={15} />Sign out</button></div>
    </>}
  </section>;
}

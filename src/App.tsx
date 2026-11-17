import { lazy, Suspense, useEffect, useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import { SocialProvider, useSocial } from './context/SocialContext';
import { SocialNav } from './components/social/SocialNav';
import { HomeFeed } from './components/social/HomeFeed';
import { ExploreView } from './components/social/ExploreView';
import { JournalView } from './components/social/JournalView';
import { ReelsView } from './components/social/ReelsView';
import { CreateStory } from './components/social/CreateStory';
import { PlaceSheet } from './components/social/PlaceSheet';
import { PostCard } from './components/social/PostCard';
import { Modal } from './components/social/Primitives';
import { AuthModal } from './components/auth/AuthModal';
import { OnboardingModal } from './components/auth/OnboardingModal';
import { TravelNoteModal } from './components/feed/TravelNoteModal';
import { GearShopModal } from './components/common/GearShopModal';
import { WriteReviewModal } from './components/destinations/WriteReviewModal';
import './social.css';
const DiscoveryMap = lazy(() => import('./components/map/DiscoveryMap').then(module => ({ default: module.DiscoveryMap })));
const TripBuilder = lazy(() => import('./components/trips/TripBuilder').then(module => ({ default: module.TripBuilder })));
const QAFeed = lazy(() => import('./components/qa/QAFeed').then(module => ({ default: module.QAFeed })));
const CampaignHub = lazy(() => import('./components/campaigns/CampaignHub').then(module => ({ default: module.CampaignHub })));
const AdminPortal = lazy(() => import('./components/admin/AdminPortal').then(module => ({ default: module.AdminPortal })));
function MainScreen() {
  const { activeTab, setActiveTab, activeDestination, posts, isOffline } = useApp();
  const { composerOpen, notice, notify } = useSocial(); const [sharedPostId, setSharedPostId] = useState('');
  useEffect(() => { if (!notice) return; const timeout = setTimeout(() => notify(''), 6000); return () => clearTimeout(timeout); }, [notice]);
  useEffect(() => { window.scrollTo(0, 0); }, [activeTab]);
  useEffect(() => { function readLink() { const params = new URLSearchParams(window.location.hash.slice(1)); const id = params.get('post'); if (id) { setActiveTab('feed'); setSharedPostId(id); } } readLink(); window.addEventListener('hashchange', readLink); return () => window.removeEventListener('hashchange', readLink); }, []);
  const sharedPost = posts.find(post => post.id === sharedPostId);
  return <div className="sn-app"><a className="sn-skip-link" href="#main-content">Skip to content</a><SocialNav /><main id="main-content" className={`sn-main sn-main-${activeTab}`} tabIndex={-1}>{isOffline && <div className="sn-offline" role="status">You’re offline. Your saved local stories are still here; online media may not load.</div>}<Suspense fallback={<div className="sn-loading" role="status">Finding your next adventure…</div>}>
    {activeTab === 'feed' && <HomeFeed />}{activeTab === 'explore' && <ExploreView />}{activeTab === 'reels' && <ReelsView />}{activeTab === 'profile' && <JournalView />}
    {activeTab === 'map' && <DiscoveryMap />}{activeTab === 'trips' && <TripBuilder />}{activeTab === 'qa' && <QAFeed />}{activeTab === 'campaigns' && <CampaignHub />}
  </Suspense></main><AuthModal /><OnboardingModal /><TravelNoteModal /><GearShopModal /><WriteReviewModal /><Suspense fallback={null}><AdminPortal /></Suspense>
    {activeDestination && <PlaceSheet key={activeDestination.id} />}{composerOpen && <CreateStory />}{notice && <div className="sn-toast" role="status">{notice}<button aria-label="Dismiss notification" onClick={() => notify('')}>×</button></div>}
    {sharedPostId && <Modal title="A story from the road" onClose={() => { setSharedPostId(''); history.replaceState(null, '', window.location.pathname + window.location.search); }}>{sharedPost ? <PostCard post={sharedPost} /> : <div className="sn-empty"><h3>This story isn’t on this device</h3><p>Preview stories are stored in the browser where they were created.</p></div>}</Modal>}
  </div>;
}
export default function App() { return <AuthProvider><AppProvider><SocialProvider><MainScreen /></SocialProvider></AppProvider></AuthProvider>; }

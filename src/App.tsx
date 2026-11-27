import { lazy, Suspense, useEffect, useEffectEvent, useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocialProvider, useSocial } from './context/SocialContext';
import { CommunityProvider } from './context/CommunityContext';
import { ServerDataProvider, useServerData } from './context/ServerDataContext';
import { hasServerStorage } from './lib/serverStorage';
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
import './secondary.css';
import './mobile.css';
import './community.css';
import './passport.css';
import { isNative, nativeAction } from './lib/device';
const DiscoveryMap = lazy(() => import('./components/map/DiscoveryMap').then(module => ({ default: module.DiscoveryMap })));
const TripBuilder = lazy(() => import('./components/trips/TripBuilder').then(module => ({ default: module.TripBuilder })));
const QAFeed = lazy(() => import('./components/qa/QAFeed').then(module => ({ default: module.QAFeed })));
const CampaignHub = lazy(() => import('./components/campaigns/CampaignHub').then(module => ({ default: module.CampaignHub })));
const AdminPortal = lazy(() => import('./components/admin/AdminPortal').then(module => ({ default: module.AdminPortal })));
const StudioView = lazy(() => import('./components/destinations/StudioView').then(module => ({ default: module.StudioView })));
function MainScreen() {
  const storage = useServerData();
  const {
    activeTab, setActiveTab, closeMap, activeDestination, posts, isOffline,
    activeGearModal, setActiveGearModal, activeTravelNote, setActiveTravelNote,
    isWriteReviewModalOpen, closeWriteReviewModal,
  } = useApp();
  const { isAuthModalOpen, closeAuthModal, isOnboardingOpen, closeOnboarding, isAdminPortalOpen, closeAdminPortal } = useAuth();
  const { composerOpen, notice, notify } = useSocial();
  const [sharedPostId, setSharedPostId] = useState('');
  const openFeed = useEffectEvent(() => setActiveTab('feed'));
  useEffect(() => {
    const showNotice = (event: Event) => notify((event as CustomEvent<string>).detail);
    window.addEventListener('safarnama:notice', showNotice);
    // The host may have been launched with an auth callback. Wait for the provider's effect.
    const ready = isNative ? window.setTimeout(() => void nativeAction({ action: 'ready' }).catch(() => {}), 0) : undefined;
    return () => {
      window.clearTimeout(ready);
      window.removeEventListener('safarnama:notice', showNotice);
    };
  }, [notify]);

  useEffect(() => {
    if (!isNative) return;
    window.safarnamaBack = () => {
      const modal = Array.from(document.querySelectorAll<HTMLDialogElement>('dialog[open]')).at(-1);
      if (modal) modal.dispatchEvent(new Event('cancel', { cancelable: true }));
      else if (isAdminPortalOpen) closeAdminPortal();
      else if (isOnboardingOpen) closeOnboarding();
      else if (isAuthModalOpen) closeAuthModal();
      else if (isWriteReviewModalOpen) closeWriteReviewModal();
      else if (activeGearModal) setActiveGearModal(null);
      else if (activeTravelNote) setActiveTravelNote(null);
      else if (activeTab === 'map') closeMap();
      else if (activeTab !== 'feed') setActiveTab(['trips', 'qa', 'campaigns', 'studio'].includes(activeTab) ? 'profile' : 'feed');
      else return false;
      return true;
    };
    return () => { delete window.safarnamaBack; };
  });
  useEffect(() => { if (!notice) return; const timeout = setTimeout(() => notify(''), 6000); return () => clearTimeout(timeout); }, [notice, notify]);
  useEffect(() => { window.scrollTo(0, 0); }, [activeTab]);
  useEffect(() => {
    function readLink() {
      const id = new URLSearchParams(window.location.hash.slice(1)).get('post') ?? '';
      setSharedPostId(id);
      if (id) openFeed();
    }
    readLink();
    window.addEventListener('hashchange', readLink);
    return () => window.removeEventListener('hashchange', readLink);
  }, []);
  function closeSharedPost() {
    setSharedPostId('');
    window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search);
  }
  const sharedPost = posts.find(post => post.id === sharedPostId);
  return <div className={`sn-app${isNative ? ' sn-android' : ''}`}><a className="sn-skip-link" href="#main-content">Skip to content</a>{activeTab !== 'map' && <SocialNav />}<main id="main-content" className={`sn-main sn-main-${activeTab}`} tabIndex={-1}>{isOffline && activeTab !== 'map' && <div className="sn-offline" role="status">{hasServerStorage ? 'You’re offline. Updates will reload when you reconnect.' : 'You’re offline.'}</div>}<Suspense fallback={<div className="sn-loading" role="status">Finding your next adventure…</div>}>
    {storage.error && activeTab !== 'map' && <div className="sn-offline" role="status">{storage.error} <button disabled={storage.loading} onClick={() => void storage.refresh()}>{storage.loading ? 'Retrying…' : 'Retry'}</button></div>}
    {activeTab === 'feed' && <HomeFeed />}{activeTab === 'explore' && <ExploreView />}{activeTab === 'reels' && <ReelsView />}{activeTab === 'profile' && <JournalView />}
    {activeTab === 'map' && <DiscoveryMap />}{activeTab === 'trips' && <TripBuilder />}{activeTab === 'qa' && <QAFeed />}{activeTab === 'campaigns' && <CampaignHub />}
    {activeTab === 'studio' && <StudioView />}
  </Suspense></main><AuthModal /><OnboardingModal /><TravelNoteModal /><GearShopModal /><WriteReviewModal /><Suspense fallback={null}><AdminPortal /></Suspense>
    {activeDestination && <PlaceSheet key={activeDestination.id} />}{composerOpen && <CreateStory />}{notice && <div className="sn-toast" role="status">{notice}<button aria-label="Dismiss notification" onClick={() => notify('')}>×</button></div>}
    {sharedPostId && <Modal title="A story from the road" onClose={closeSharedPost}>
      {sharedPost ? <PostCard key={sharedPost.id} post={sharedPost} onNavigate={closeSharedPost} /> : <div className="sn-empty"><h3>{hasServerStorage && !storage.snapshot && !storage.error ? 'Loading story…' : 'Story unavailable'}</h3><p>{storage.error || (hasServerStorage ? '' : 'Local preview stories are available on the device where they were created.')}</p></div>}
    </Modal>}
  </div>;
}
function UserWorkspace() {
  const { user } = useAuth();
  return <AppProvider key={user?.id ?? 'guest'}><SocialProvider><MainScreen /></SocialProvider></AppProvider>;
}
export default function App() { return <AuthProvider><ServerDataProvider><CommunityProvider><UserWorkspace /></CommunityProvider></ServerDataProvider></AuthProvider>; }

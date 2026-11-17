import React, { useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DesktopNav } from './components/layout/DesktopNav';
import { TopHeader } from './components/layout/TopHeader';
import { BottomNav } from './components/layout/BottomNav';
import { ReelsFeed } from './components/feed/ReelsFeed';
import { DiscoveryMap } from './components/map/DiscoveryMap';
import { TripBuilder } from './components/trips/TripBuilder';
import { QAFeed } from './components/qa/QAFeed';
import { CampaignHub } from './components/campaigns/CampaignHub';
import { ProfileView } from './components/profile/ProfileView';
import { TravelNoteModal } from './components/feed/TravelNoteModal';
import { GearShopModal } from './components/common/GearShopModal';
import { DestinationHubModal } from './components/destinations/DestinationHubModal';
import { WriteReviewModal } from './components/destinations/WriteReviewModal';
import { AuthModal } from './components/auth/AuthModal';
import { OnboardingModal } from './components/auth/OnboardingModal';
import { AdminPortal } from './components/admin/AdminPortal';
import { initMobileApp } from './lib/device';

const MainScreen: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab,
    activeTravelNote,
    setActiveTravelNote,
    activeGearModal,
    setActiveGearModal,
    activeDestination,
    setActiveDestination,
    isWriteReviewModalOpen,
    closeWriteReviewModal,
  } = useApp();

  const {
    isAuthModalOpen,
    closeAuthModal,
    isOnboardingOpen,
    closeOnboarding,
    isAdminPortalOpen,
    closeAdminPortal,
  } = useAuth();

  // Hardware back-button & native status bar handling for Android
  useEffect(() => {
    initMobileApp({
      hasOpenModal: () => {
        return !!(
          activeTravelNote ||
          activeGearModal ||
          activeDestination ||
          isWriteReviewModalOpen ||
          isAuthModalOpen ||
          isOnboardingOpen ||
          isAdminPortalOpen
        );
      },
      closeActiveModal: () => {
        if (isAdminPortalOpen) {
          closeAdminPortal();
          return;
        }
        if (isWriteReviewModalOpen) {
          closeWriteReviewModal();
          return;
        }
        if (activeGearModal) {
          setActiveGearModal(null);
          return;
        }
        if (activeTravelNote) {
          setActiveTravelNote(null);
          return;
        }
        if (activeDestination) {
          setActiveDestination(null);
          return;
        }
        if (isOnboardingOpen) {
          closeOnboarding();
          return;
        }
        if (isAuthModalOpen) {
          closeAuthModal();
          return;
        }
      },
      activeTab,
      setActiveTab,
    });
  }, [
    activeTab,
    activeTravelNote,
    activeGearModal,
    activeDestination,
    isWriteReviewModalOpen,
    isAuthModalOpen,
    isOnboardingOpen,
    isAdminPortalOpen,
    setActiveTab,
    setActiveTravelNote,
    setActiveGearModal,
    setActiveDestination,
    closeWriteReviewModal,
    closeAuthModal,
    closeOnboarding,
    closeAdminPortal,
  ]);

  return (
    <div className="relative w-full h-full min-h-screen bg-[#fafafa] text-zinc-900 flex flex-col overflow-hidden select-none">
      {/* Desktop Navigation (visible on md+ screens, hidden on mobile) */}
      <DesktopNav />

      {/* Mobile Top Header (hidden on md+ screens, visible on mobile) */}
      <TopHeader />

      {/* Main View Area */}
      <main className="flex-1 w-full overflow-hidden">
        {activeTab === 'feed' && <ReelsFeed />}
        {activeTab === 'map' && <DiscoveryMap />}
        {activeTab === 'trips' && <TripBuilder />}
        {activeTab === 'qa' && <QAFeed />}
        {activeTab === 'campaigns' && <CampaignHub />}
        {activeTab === 'profile' && <ProfileView />}
      </main>

      {/* Global Modals */}
      <TravelNoteModal />
      <GearShopModal />
      <DestinationHubModal />
      <AuthModal />
      <OnboardingModal />
      <WriteReviewModal />
      <AdminPortal />

      {/* Instagram-Simple Bottom Navigation (mobile only) */}
      <BottomNav />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <MainScreen />
      </AppProvider>
    </AuthProvider>
  );
}

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
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
import { OTABanner } from './components/common/OTABanner';

const MainScreen: React.FC = () => {
  const { activeTab } = useApp();

  return (
    <div className="relative w-full h-full min-h-screen bg-[#090a0f] text-slate-100 flex flex-col overflow-hidden select-none">
      {/* Top Header */}
      <TopHeader />

      {/* Auto OTA Update Banner */}
      <OTABanner />

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
      <WriteReviewModal />

      {/* Instagram-Simple Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainScreen />
    </AppProvider>
  );
}

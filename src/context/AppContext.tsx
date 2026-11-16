import React, { createContext, useContext, useState, useEffect } from 'react';
import { Post, Profile, DestinationHub, QAThread, Campaign, Trip, GearTag, UserRole } from '../types';
import { 
  CURRENT_USER_TRAVELER, 
  CURRENT_USER_GUIDE, 
  MOCK_POSTS, 
  DESTINATION_HUBS, 
  MOCK_QA_THREADS, 
  MOCK_CAMPAIGNS, 
  INITIAL_USER_TRIP 
} from '../data/mockData';
import { getStoredData, setStoredData } from '../lib/utils';

export type NavTab = 'feed' | 'map' | 'trips' | 'qa' | 'campaigns' | 'profile';

interface AppContextType {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  currentUser: Profile;
  activeRole: UserRole;
  switchRole: (role: UserRole) => void;
  posts: Post[];
  toggleLikePost: (postId: string) => void;
  toggleSavePost: (postId: string) => void;
  activeTravelNote: Post | null;
  setActiveTravelNote: (post: Post | null) => void;
  activeGearModal: GearTag | null;
  setActiveGearModal: (gear: GearTag | null) => void;
  activeDestination: DestinationHub | null;
  setActiveDestination: (dest: DestinationHub | null) => void;
  openSpotOnMap: (lat: number, lng: number, spotName: string) => void;
  selectedMapSpot: { lat: number; lng: number; spotName: string } | null;
  clearSelectedMapSpot: () => void;
  currentTrip: Trip;
  addSpotToTrip: (post: Post) => void;
  removeStopFromTrip: (stopId: string) => void;
  qaThreads: QAThread[];
  addQAQuestion: (title: string, destinationName: string, category: QAThread['category']) => void;
  addQAReply: (threadId: string, replyText: string) => void;
  upvoteQAThread: (threadId: string) => void;
  upvoteQAReply: (threadId: string, replyId: string) => void;
  campaigns: Campaign[];
  checkInCampaignCheckpoint: (campaignId: string, checkpointId: string) => void;
  isOffline: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<NavTab>('feed');
  const [activeRole, setActiveRole] = useState<UserRole>(() => 
    getStoredData<UserRole>('active_role', 'traveler')
  );

  const currentUser = activeRole === 'traveler' ? CURRENT_USER_TRAVELER : CURRENT_USER_GUIDE;

  const [posts, setPosts] = useState<Post[]>(() => 
    getStoredData<Post[]>('posts_cache', MOCK_POSTS)
  );

  const [qaThreads, setQaThreads] = useState<QAThread[]>(() => 
    getStoredData<QAThread[]>('qa_cache', MOCK_QA_THREADS)
  );

  const [campaigns, setCampaigns] = useState<Campaign[]>(() => 
    getStoredData<Campaign[]>('campaigns_cache', MOCK_CAMPAIGNS)
  );

  const [currentTrip, setCurrentTrip] = useState<Trip>(() => 
    getStoredData<Trip>('active_trip', INITIAL_USER_TRIP)
  );

  const [activeTravelNote, setActiveTravelNote] = useState<Post | null>(null);
  const [activeGearModal, setActiveGearModal] = useState<GearTag | null>(null);
  const [activeDestination, setActiveDestination] = useState<DestinationHub | null>(null);
  const [selectedMapSpot, setSelectedMapSpot] = useState<{ lat: number; lng: number; spotName: string } | null>(null);
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const switchRole = (newRole: UserRole) => {
    setActiveRole(newRole);
    setStoredData('active_role', newRole);
  };

  const toggleLikePost = (postId: string) => {
    setPosts(prev => {
      const updated = prev.map(p => {
        if (p.id === postId) {
          const isLiked = !p.isLiked;
          return {
            ...p,
            isLiked,
            likesCount: isLiked ? p.likesCount + 1 : Math.max(0, p.likesCount - 1),
          };
        }
        return p;
      });
      setStoredData('posts_cache', updated);
      return updated;
    });
  };

  const toggleSavePost = (postId: string) => {
    setPosts(prev => {
      const updated = prev.map(p => {
        if (p.id === postId) {
          const isSaved = !p.isSaved;
          return {
            ...p,
            isSaved,
            savesCount: isSaved ? p.savesCount + 1 : Math.max(0, p.savesCount - 1),
          };
        }
        return p;
      });
      setStoredData('posts_cache', updated);
      return updated;
    });

    // Also auto-add to smart trip planner if saving
    const targetPost = posts.find(p => p.id === postId);
    if (targetPost && !targetPost.isSaved) {
      addSpotToTrip(targetPost);
    }
  };

  const openSpotOnMap = (lat: number, lng: number, spotName: string) => {
    setSelectedMapSpot({ lat, lng, spotName });
    setActiveTab('map');
  };

  const clearSelectedMapSpot = () => {
    setSelectedMapSpot(null);
  };

  const addSpotToTrip = (post: Post) => {
    setCurrentTrip(prev => {
      // Check if spot already exists in trip
      if (prev.stops.some(s => s.spotName === post.spotName)) {
        return prev;
      }
      const newStop = {
        id: `stop-${Date.now()}`,
        tripId: prev.id,
        postId: post.id,
        spotName: post.spotName,
        state: post.state,
        dayNumber: Math.max(1, Math.ceil((prev.stops.length + 1) / 2)),
        orderInDay: (prev.stops.length % 2) + 1,
        stayMinutes: 90,
        latitude: post.latitude,
        longitude: post.longitude,
        costInInr: post.costInInr || 200,
        thumbnailUrl: post.thumbnailUrl,
        notes: post.safetyTips || 'Acclimatize and carry water bottle.',
      };
      const updated = {
        ...prev,
        totalBudgetInr: prev.totalBudgetInr + (post.costInInr || 200),
        stops: [...prev.stops, newStop],
      };
      setStoredData('active_trip', updated);
      return updated;
    });
  };

  const removeStopFromTrip = (stopId: string) => {
    setCurrentTrip(prev => {
      const stopToRemove = prev.stops.find(s => s.id === stopId);
      const updatedStops = prev.stops.filter(s => s.id !== stopId);
      const updated = {
        ...prev,
        totalBudgetInr: Math.max(0, prev.totalBudgetInr - (stopToRemove?.costInInr || 0)),
        stops: updatedStops,
      };
      setStoredData('active_trip', updated);
      return updated;
    });
  };

  const addQAQuestion = (title: string, destinationName: string, category: QAThread['category']) => {
    const newThread: QAThread = {
      id: `qa-${Date.now()}`,
      author: currentUser,
      destinationName,
      title,
      category,
      latitude: 28.6139,
      longitude: 77.2090,
      status: 'active',
      upvotesCount: 1,
      repliesCount: 0,
      isUpvoted: true,
      createdAt: new Date().toISOString(),
      replies: [],
    };
    setQaThreads(prev => {
      const updated = [newThread, ...prev];
      setStoredData('qa_cache', updated);
      return updated;
    });
  };

  const addQAReply = (threadId: string, replyText: string) => {
    setQaThreads(prev => {
      const updated = prev.map(t => {
        if (t.id === threadId) {
          const newReply = {
            id: `reply-${Date.now()}`,
            threadId,
            author: currentUser,
            replyText,
            isVerifiedLocalReply: currentUser.isVerifiedGuide,
            upvotesCount: 1,
            isUpvoted: true,
            createdAt: new Date().toISOString(),
          };
          return {
            ...t,
            repliesCount: t.repliesCount + 1,
            replies: [...t.replies, newReply],
          };
        }
        return t;
      });
      setStoredData('qa_cache', updated);
      return updated;
    });
  };

  const upvoteQAThread = (threadId: string) => {
    setQaThreads(prev => {
      const updated = prev.map(t => {
        if (t.id === threadId) {
          const isUpvoted = !t.isUpvoted;
          return {
            ...t,
            isUpvoted,
            upvotesCount: isUpvoted ? t.upvotesCount + 1 : Math.max(0, t.upvotesCount - 1),
          };
        }
        return t;
      });
      setStoredData('qa_cache', updated);
      return updated;
    });
  };

  const upvoteQAReply = (threadId: string, replyId: string) => {
    setQaThreads(prev => {
      const updated = prev.map(t => {
        if (t.id === threadId) {
          return {
            ...t,
            replies: t.replies.map(r => {
              if (r.id === replyId) {
                const isUpvoted = !r.isUpvoted;
                return {
                  ...r,
                  isUpvoted,
                  upvotesCount: isUpvoted ? r.upvotesCount + 1 : Math.max(0, r.upvotesCount - 1),
                };
              }
              return r;
            }),
          };
        }
        return t;
      });
      setStoredData('qa_cache', updated);
      return updated;
    });
  };

  const checkInCampaignCheckpoint = (campaignId: string, checkpointId: string) => {
    setCampaigns(prev => {
      const updated = prev.map(c => {
        if (c.id === campaignId) {
          return {
            ...c,
            totalCheckins: c.totalCheckins + 1,
            checkpoints: c.checkpoints.map(cp => {
              if (cp.id === checkpointId) {
                return { ...cp, isCompleted: true };
              }
              return cp;
            }),
          };
        }
        return c;
      });
      setStoredData('campaigns_cache', updated);
      return updated;
    });
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        currentUser,
        activeRole,
        switchRole,
        posts,
        toggleLikePost,
        toggleSavePost,
        activeTravelNote,
        setActiveTravelNote,
        activeGearModal,
        setActiveGearModal,
        activeDestination,
        setActiveDestination,
        openSpotOnMap,
        selectedMapSpot,
        clearSelectedMapSpot,
        currentTrip,
        addSpotToTrip,
        removeStopFromTrip,
        qaThreads,
        addQAQuestion,
        addQAReply,
        upvoteQAThread,
        upvoteQAReply,
        campaigns,
        checkInCampaignCheckpoint,
        isOffline,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

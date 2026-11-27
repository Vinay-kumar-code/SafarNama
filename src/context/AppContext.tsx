import React, { createContext, useContext, useState, useEffect } from 'react';
import { Post, Profile, DestinationHub, QAThread, Campaign, GearTag, UserRole, DestinationReview } from '../types';
import { guestProfile } from '../lib/authHelpers';
import { getStoredData, setStoredData } from '../lib/utils';
import { useAuth } from './AuthContext';
import { hasServerStorage } from '../lib/serverStorage';
import { reportStorageError, useServerData } from './ServerDataContext';
import { useJourneys } from './useJourneys';

export type NavTab = 'feed' | 'explore' | 'reels' | 'map' | 'trips' | 'qa' | 'campaigns' | 'profile' | 'studio';

interface AppContextType {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  closeMap: () => void;
  currentUser: Profile;
  activeRole: UserRole;
  switchRole: (role: UserRole) => void;
  posts: Post[];
  createPost: (post: Post) => Promise<void>;
  editPost: (postId: string, caption: string) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  toggleLikePost: (postId: string) => void;
  toggleSavePost: (postId: string) => void;
  activeTravelNote: Post | null;
  setActiveTravelNote: (post: Post | null) => void;
  activeGearModal: GearTag | null;
  setActiveGearModal: (gear: GearTag | null) => void;
  activeDestination: DestinationHub | null;
  setActiveDestination: (dest: DestinationHub | null) => void;
  destinationReviews: DestinationReview[];
  addDestinationReview: (reviewData: {
    destinationId: string;
    destinationName: string;
    rating: number;
    title: string;
    reviewText: string;
    photos?: string[];
    visitMonth?: string;
    travelType?: 'Solo' | 'Family' | 'Couple' | 'Friends';
    travelTips?: string;
  }) => Promise<DestinationReview>;
  toggleReviewHelpful: (reviewId: string) => void;
  getReviewsForDestination: (destinationId: string) => DestinationReview[];
  isWriteReviewModalOpen: boolean;
  setIsWriteReviewModalOpen: (open: boolean) => void;
  reviewTargetDestination: DestinationHub | null;
  openWriteReviewModal: (dest?: DestinationHub | null) => void;
  closeWriteReviewModal: () => void;
  openSpotOnMap: (lat: number, lng: number, spotName: string) => void;
  selectedMapSpot: { lat: number; lng: number; spotName: string } | null;
  clearSelectedMapSpot: () => void;
  journeys: ReturnType<typeof useJourneys>;
  qaThreads: QAThread[];
  addQAQuestion: (title: string, destination: DestinationHub, category: QAThread['category']) => Promise<void>;
  addQAReply: (threadId: string, replyText: string) => Promise<void>;
  upvoteQAThread: (threadId: string) => void;
  upvoteQAReply: (threadId: string, replyId: string) => void;
  campaigns: Campaign[];
  checkInCampaignCheckpoint: (campaignId: string, checkpointId: string) => void;
  isOffline: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);
const fixturePosts = new Set(['post-001', 'post-002', 'post-003', 'post-004', 'post-005', 'note-delhi-001']);
const fixtureAuthor = (id: string) => /^(user-(00[1-9]|admin-001)|demo-.+)$/.test(id);
type Reactions = Record<string, Record<string, { isLiked?: boolean; isSaved?: boolean }>>;

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, openAuthModal, updateProfile: authUpdateProfile } = useAuth();
  const { snapshot, write } = useServerData();
  const [activeTab, navigate] = useState<NavTab>('feed');
  const [mapReturn, setMapReturn] = useState<Exclude<NavTab, 'map'>>('feed');
  const currentUser = profile ?? guestProfile;
  const activeRole = currentUser.activeRole;
  const journeys = useJourneys();
  const [allReactions, setAllReactions] = useState<Reactions>(() => getStoredData('post_reactions', {}));
  const reactions = allReactions[currentUser.id] ?? {};
  const [basePosts, setPosts] = useState<Post[]>(() =>
    getStoredData<Post[]>('posts_cache', []).filter(post => !fixturePosts.has(post.id))
      .map(post => fixtureAuthor(post.author.id) ? {
        ...post, author: { ...guestProfile, id: `archived-${post.author.id}`, fullName: 'Traveler' },
      } : post)
  );
  const posts = hasServerStorage ? (snapshot?.posts ?? []).map(post => ({
    ...post, isLiked: snapshot?.account.likes.includes(post.id), isSaved: snapshot?.account.saves.includes(post.id),
  })) : basePosts.map(post => ({
    ...post, isLiked: Boolean(reactions[post.id]?.isLiked), isSaved: Boolean(reactions[post.id]?.isSaved),
    likesCount: post.likesCount + Object.values(allReactions).filter(account => account[post.id]?.isLiked).length,
    savesCount: post.savesCount + Object.values(allReactions).filter(account => account[post.id]?.isSaved).length,
    author: profile?.id === post.author.id ? profile : post.author,
  }));

  const [localQuestions, setQaThreads] = useState<QAThread[]>(() =>
    getStoredData<QAThread[]>('qa_cache', []).filter(thread => !fixtureAuthor(thread.author.id))
  );
  const qaThreads = hasServerStorage ? snapshot?.questions ?? [] : localQuestions;

  const [campaigns, setCampaigns] = useState<Campaign[]>(() => 
    getStoredData<Campaign[]>('campaigns_cache', []).filter(campaign => !['camp-01', 'camp-02'].includes(campaign.id))
  );

  const [activeTravelNote, setActiveTravelNote] = useState<Post | null>(null);
  const [activeGearModal, setActiveGearModal] = useState<GearTag | null>(null);
  const [activeDestination, setActiveDestination] = useState<DestinationHub | null>(null);
  const [selectedMapSpot, setSelectedMapSpot] = useState<{ lat: number; lng: number; spotName: string } | null>(null);
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);

  // Reviews System State
  const [localReviews, setDestinationReviews] = useState<DestinationReview[]>(() =>
    getStoredData<DestinationReview[]>('destination_reviews_cache', []).filter(review => !fixtureAuthor(review.author.id))
  );
  const destinationReviews = hasServerStorage ? snapshot?.reviews ?? [] : localReviews;
  const [isWriteReviewModalOpen, setIsWriteReviewModalOpen] = useState(false);
  const [reviewTargetDestination, setReviewTargetDestination] = useState<DestinationHub | null>(null);

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
    if (profile) {
      void authUpdateProfile({ activeRole: newRole });
    }
  };

  function toggleReaction(postId: string, reaction: 'isLiked' | 'isSaved') {
    if (!profile) { openAuthModal(); return; }
    if (hasServerStorage) {
      const kind = reaction === 'isLiked' ? 'likes' : 'saves';
      void write('me', kind, postId, snapshot?.account[kind].includes(postId) ? undefined : {}).catch(reportStorageError);
      return;
    }
    const next = { ...allReactions, [profile.id]: {
      ...reactions, [postId]: { ...reactions[postId], [reaction]: !reactions[postId]?.[reaction] },
    } };
    setStoredData('post_reactions', next);
    setAllReactions(next);
  }

  function setActiveTab(tab: NavTab) {
    if (tab === 'map' && activeTab !== 'map') setMapReturn(activeTab);
    if (tab !== 'map') setSelectedMapSpot(null);
    navigate(tab);
  }

  function savePosts(next: Post[]) {
    localStorage.setItem('safarnama_posts_cache', JSON.stringify(next));
    setPosts(next);
  }

  function getOwnPost(id: string) {
    const post = basePosts.find(item => item.id === id);
    if (!profile || post?.author.id !== profile.id) throw new Error('Only the author can change this story.');
    return post;
  }

  async function editPost(id: string, caption: string) {
    if (hasServerStorage) { await write('public', 'posts', id, { caption }); return; }
    const post = getOwnPost(id);
    const text = caption.trim();
    if (!text || text.length > (post.format === 'quick_tip' ? 500 : 2200)) throw new Error('Enter a story within the character limit.');
    savePosts(basePosts.map(item => item.id === id ? { ...item, caption: text } : item));
  }

  async function deletePost(id: string) {
    if (hasServerStorage) { await write('public', 'posts', id); return; }
    getOwnPost(id);
    savePosts(basePosts.filter(item => item.id !== id));
  }

  const openSpotOnMap = (lat: number, lng: number, spotName: string) => {
    setSelectedMapSpot({ lat, lng, spotName });
    setActiveTab('map');
  };

  const clearSelectedMapSpot = () => {
    setSelectedMapSpot(null);
  };

  const addQAQuestion = async (title: string, destination: DestinationHub, category: QAThread['category']) => {
    if (!profile) throw new Error('Sign in to post a question.');
    if (hasServerStorage) { await write('public', 'questions', crypto.randomUUID(), { title, destinationId: destination.id, category }); return; }
    const newThread: QAThread = {
      id: crypto.randomUUID(),
      author: currentUser,
      destinationName: destination.name,
      title,
      category,
      latitude: destination.latitude,
      longitude: destination.longitude,
      status: 'active',
      upvotesCount: 1,
      repliesCount: 0,
      isUpvoted: true,
      createdAt: new Date().toISOString(),
      replies: [],
    };
    const next = [newThread, ...localQuestions];
    localStorage.setItem('safarnama_qa_cache', JSON.stringify(next));
    setQaThreads(next);
  };

  const addQAReply = async (threadId: string, replyText: string) => {
    if (!profile) throw new Error('Sign in to reply.');
    if (hasServerStorage) { await write('public', 'replies', crypto.randomUUID(), { threadId, replyText }); return; }
    if (!localQuestions.some(thread => thread.id === threadId)) throw new Error('This question is unavailable.');
    const reply = { id: crypto.randomUUID(), threadId, author: currentUser, replyText,
      isVerifiedLocalReply: currentUser.isVerifiedGuide, upvotesCount: 1, isUpvoted: true, createdAt: new Date().toISOString() };
    const next = localQuestions.map(thread => thread.id === threadId
      ? { ...thread, repliesCount: thread.replies.length + 1, replies: [...thread.replies, reply] } : thread);
    localStorage.setItem('safarnama_qa_cache', JSON.stringify(next));
    setQaThreads(next);
  };

  const upvoteQAThread = (threadId: string) => {
    if (!profile) { openAuthModal(); return; }
    if (hasServerStorage) {
      void write('me', 'questionVotes', threadId, qaThreads.find(thread => thread.id === threadId)?.isUpvoted ? undefined : {}).catch(reportStorageError);
      return;
    }
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
    if (!profile) { openAuthModal(); return; }
    if (hasServerStorage) {
      const voted = qaThreads.find(thread => thread.id === threadId)?.replies.find(reply => reply.id === replyId)?.isUpvoted;
      void write('me', 'replyVotes', replyId, voted ? undefined : {}).catch(reportStorageError);
      return;
    }
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
        if (c.id === campaignId && c.checkpoints.some(cp => cp.id === checkpointId && !cp.isCompleted)) {
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

  const openWriteReviewModal = (dest?: DestinationHub | null) => {
    if (dest) {
      setReviewTargetDestination(dest);
    } else if (activeDestination) {
      setReviewTargetDestination(activeDestination);
    }
    setIsWriteReviewModalOpen(true);
  };

  const closeWriteReviewModal = () => {
    setIsWriteReviewModalOpen(false);
    setReviewTargetDestination(null);
  };

  const getReviewsForDestination = (destinationId: string) => {
    return destinationReviews.filter(r => r.destinationId === destinationId);
  };

  const addDestinationReview = async (reviewData: {
    destinationId: string;
    destinationName: string;
    rating: number;
    title: string;
    reviewText: string;
    photos?: string[];
    visitMonth?: string;
    travelType?: 'Solo' | 'Family' | 'Couple' | 'Friends';
    travelTips?: string;
  }): Promise<DestinationReview> => {
    if (!profile) throw new Error('Sign in to write a review.');
    if (hasServerStorage) {
      const id = crypto.randomUUID();
      const result = await write('public', 'reviews', id, reviewData);
      const saved = result.reviews.find(review => review.id === id);
      if (!saved) throw new Error('Could not load the saved review.');
      return saved;
    }
    const newReview: DestinationReview = {
      id: `rev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      destinationId: reviewData.destinationId,
      destinationName: reviewData.destinationName,
      author: currentUser,
      rating: reviewData.rating,
      title: reviewData.title,
      reviewText: reviewData.reviewText,
      photos: reviewData.photos && reviewData.photos.length > 0 ? reviewData.photos : undefined,
      visitMonth: reviewData.visitMonth,
      travelType: reviewData.travelType,
      travelTips: reviewData.travelTips,
      helpfulCount: 0,
      isHelpful: false,
      createdAt: new Date().toISOString(),
    };

    setDestinationReviews(prev => {
      const updated = [newReview, ...prev];
      setStoredData('destination_reviews_cache', updated);
      return updated;
    });

    return newReview;
  };

  const toggleReviewHelpful = (reviewId: string) => {
    if (!profile) { openAuthModal(); return; }
    if (hasServerStorage) {
      void write('me', 'helpful', reviewId, destinationReviews.find(review => review.id === reviewId)?.isHelpful ? undefined : {}).catch(reportStorageError);
      return;
    }
    setDestinationReviews(prev => {
      const updated = prev.map(r => {
        if (r.id === reviewId) {
          const isHelpful = !r.isHelpful;
          return {
            ...r,
            isHelpful,
            helpfulCount: isHelpful ? r.helpfulCount + 1 : Math.max(0, r.helpfulCount - 1),
          };
        }
        return r;
      });
      setStoredData('destination_reviews_cache', updated);
      return updated;
    });
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        closeMap: () => setActiveTab(mapReturn),
        currentUser,
        activeRole,
        switchRole,
        posts,
        createPost: async (post: Post) => {
          if (!profile || post.author.id !== profile.id) throw new Error('Sign in to publish a story.');
          if (hasServerStorage) { await write('public', 'posts', post.id, post); return; }
          savePosts([post, ...basePosts]);
        },
        editPost,
        deletePost,
        toggleLikePost: id => toggleReaction(id, 'isLiked'),
        toggleSavePost: id => toggleReaction(id, 'isSaved'),
        activeTravelNote,
        setActiveTravelNote,
        activeGearModal,
        setActiveGearModal,
        activeDestination,
        setActiveDestination,
        destinationReviews,
        addDestinationReview,
        toggleReviewHelpful,
        getReviewsForDestination,
        isWriteReviewModalOpen,
        setIsWriteReviewModalOpen,
        reviewTargetDestination,
        openWriteReviewModal,
        closeWriteReviewModal,
        openSpotOnMap,
        selectedMapSpot,
        clearSelectedMapSpot,
        journeys,
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

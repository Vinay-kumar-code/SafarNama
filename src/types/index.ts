export type UserRole = 'traveler' | 'creator' | 'local_guide' | 'business' | 'destination_manager' | 'admin';
export type AccountType = 'traveler' | 'local_guide' | 'business' | 'destination_manager';

export interface GuideVerificationRequest {
  id: string;
  guideName: string;
  username: string;
  avatarUrl: string;
  circuits: string[];
  idProofType: string;
  idProofNumber: string;
  experienceYears: number;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  phone: string;
  homeCity: string;
  bio?: string;
  rejectionReason?: string;
}

export interface FlaggedContentItem {
  id: string;
  contentType: 'reel' | 'question' | 'review';
  contentId: string;
  titleOrCaption: string;
  authorUsername: string;
  reportedBy: string;
  reason: string;
  reportedAt: string;
  status: 'pending' | 'dismissed' | 'removed';
  destinationName?: string;
}

export type ContentFormat = 'reel' | 'carousel_note' | 'quick_tip';

export interface GearTag {
  id: string;
  name: string;
  brand: string;
  priceInr: number;
  affiliateUrl: string;
  imageUrl: string;
  category: 'Rucksack' | 'Riding Gear' | 'Camera & Drone' | 'Footwear' | 'Electronics';
}

export interface Profile {
  id: string;
  username: string;
  fullName: string;
  avatarUrl: string;
  bio: string;
  activeRole: UserRole;
  homeCity: string;
  isVerifiedGuide: boolean;
  guideCircuits: string[]; // e.g. ['Spiti Valley', 'Old Delhi Street Food', 'Ziro Valley']
  credibilityScore: number; // upvotes & helpfulness
  passportStampsCount: number;
  languagesSpoken: string[];
  contactPhone?: string;
  visitedStates: string[];
  stats: {
    tripsCompleted: number;
    spotsSaved: number;
    contributions: number;
    guideToursLed?: number;
  };
}

export interface Post {
  id: string;
  author: Profile;
  destinationId?: string;
  spotName: string;
  state: string;
  region: string;
  caption: string;
  sticker?: string;
  format: ContentFormat;
  videoUrl?: string; // Cloudflare Stream adaptive HLS or fallback MP4
  thumbnailUrl?: string;
  carouselImages?: string[];
  costInInr?: number;
  bestTimeToVisit?: string;
  safetyTips?: string;
  howToReach?: string;
  connectivitySignal?: string;
  latitude: number;
  longitude: number;
  taggedGear?: GearTag[];
  likesCount: number;
  savesCount: number;
  sharesCount: number;
  viewsCount: number;
  commentsCount: number;
  isLiked?: boolean;
  isSaved?: boolean;
  isStaffPick?: boolean;
  createdAt: string;
}

export interface DestinationHub {
  id: string;
  slug: string;
  name: string;
  state: string;
  region: string;
  tagline: string;
  coverImage: string;
  galleryImages: string[];
  latitude: number;
  longitude: number;
  overview: string;
  bestTimeToVisit: string;
  seasonalWeather: {
    summer: string;
    monsoon?: string;
    winter: string;
  };
  permitsRequired?: string;
  culturalEtiquette?: string;
  scamAlerts?: string;
  emergencyContacts: {
    police: string;
    medical: string;
    disaster?: string;
    touristHelpline?: string;
  };
  connectivityInfo: {
    jio: string;
    airtel: string;
    bsnl: string;
  };
  estimatedDailyBudgetInr: number;
  isFeatured?: boolean;
  topSpotsCount: number;
  guideCount: number;
  averageRating?: number;
  reviewsCount?: number;
  openingHours?: string;
  sourceUrl?: string;
  photoCredit?: { author: string; source: string; license: string; licenseUrl: string };
}

export interface DestinationUpdate {
  id: string;
  destinationId: string;
  author: Profile;
  category: 'Weather' | 'Opening hours' | 'Travel advisory' | 'Local news';
  title: string;
  detail: string;
  createdAt: string;
}

export interface DestinationListing {
  id: string;
  destinationId: string;
  author: Profile;
  category: 'Tour package' | 'Hotel or stay' | 'Travel agency' | 'Food and drink' | 'Local service';
  title: string;
  detail: string;
  duration?: string;
  priceInr?: number;
  contactUrl?: string;
  createdAt: string;
}

export interface DestinationReview {
  id: string;
  destinationId: string;
  destinationName: string;
  author: Profile;
  rating: number;
  title: string;
  reviewText: string;
  photos?: string[];
  visitMonth?: string;
  travelType?: 'Solo' | 'Family' | 'Couple' | 'Friends';
  helpfulCount: number;
  isHelpful?: boolean;
  travelTips?: string;
  createdAt: string;
}

export interface QAReply {
  id: string;
  threadId: string;
  author: Profile;
  replyText: string;
  isVerifiedLocalReply: boolean;
  upvotesCount: number;
  isUpvoted?: boolean;
  createdAt: string;
}

export interface QAThread {
  id: string;
  author: Profile;
  destinationName: string;
  title: string;
  category: 'Road Conditions' | 'Safety' | 'Food & Stays' | 'Permits & Weather' | 'Local Culture';
  latitude: number;
  longitude: number;
  status: 'active' | 'resolved';
  upvotesCount: number;
  repliesCount: number;
  isUpvoted?: boolean;
  replies: QAReply[];
  createdAt: string;
}

export interface TripStop {
  id: string;
  tripId: string;
  postId?: string;
  spotName: string;
  state: string;
  dayNumber: number;
  orderInDay: number;
  notes?: string;
  stayMinutes: number;
  latitude: number;
  longitude: number;
  costInInr?: number;
  thumbnailUrl?: string;
}

export interface Trip {
  id: string;
  title: string;
  description: string;
  startDate?: string;
  endDate?: string;
  totalBudgetInr: number;
  isPublic: boolean;
  shareSlug: string;
  stops: TripStop[];
  createdAt: string;
}

export interface CampaignCheckpoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radiusMeters: number;
  badgeName: string;
  isCompleted?: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  fullName: string;
  avatarUrl: string;
  points: number;
  badgesUnlocked: number;
  badgeTier: 'Gold Explorer' | 'Silver Trailblazer' | 'Bronze Wanderer';
}

export interface Campaign {
  id: string;
  title: string;
  slug: string;
  description: string;
  organizerName: string;
  bannerImage: string;
  startDate: string;
  endDate: string;
  daysRemaining: number;
  rewardDescription: string;
  checkpoints: CampaignCheckpoint[];
  status: 'upcoming' | 'active' | 'concluded';
  participantsCount: number;
  totalCheckins: number;
  leaderboard: LeaderboardEntry[];
}

export interface SponsoredStay {
  id: string;
  destinationId: string;
  destinationName: string;
  name: string;
  stayType: 'homestay' | 'boutique_hotel' | 'hostel' | 'campsite' | 'heritage_haveli';
  pricePerNightInr: number;
  rating: number;
  reviewsCount: number;
  bookingUrl: string;
  imageUrl: string;
  amenities: string[];
  isVerifiedPartner: boolean;
  tagline: string;
}

import { Profile, UserRole } from '../types';

// Helper to map DB row from public.profiles table to TypeScript Profile interface
export function mapDbProfileToProfile(dbRow: any, fallbackId?: string, fallbackEmail?: string): Profile {
  const fallbackUsername = fallbackEmail ? fallbackEmail.split('@')[0] : 'traveler';
  return {
    id: dbRow?.id || fallbackId || 'user-001',
    username: dbRow?.username || fallbackUsername,
    fullName: dbRow?.full_name || dbRow?.fullName || (fallbackEmail ? fallbackEmail.split('@')[0] : 'Safar Explorer'),
    avatarUrl: dbRow?.avatar_url || dbRow?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    bio: dbRow?.bio || 'Exploring authentic India • Map-First Traveler',
    activeRole: (dbRow?.active_role || dbRow?.activeRole || 'traveler') as UserRole,
    homeCity: dbRow?.home_city || dbRow?.homeCity || 'New Delhi, India',
    isVerifiedGuide: Boolean(dbRow?.is_verified_guide ?? dbRow?.isVerifiedGuide ?? false),
    guideCircuits: dbRow?.guide_circuits || dbRow?.guideCircuits || [],
    credibilityScore: dbRow?.credibility_score ?? dbRow?.credibilityScore ?? 100,
    passportStampsCount: dbRow?.passport_stamps_count ?? dbRow?.passportStampsCount ?? 3,
    languagesSpoken: dbRow?.languages_spoken || dbRow?.languagesSpoken || ['Hindi', 'English'],
    contactPhone: dbRow?.contact_phone || dbRow?.contactPhone,
    visitedStates: dbRow?.visited_states || dbRow?.visitedStates || ['Himachal Pradesh', 'Delhi'],
    stats: dbRow?.stats || {
      tripsCompleted: dbRow?.trips_completed ?? 2,
      spotsSaved: dbRow?.spots_saved ?? 5,
      contributions: dbRow?.contributions ?? 1,
      guideToursLed: dbRow?.guide_tours_led ?? (dbRow?.active_role === 'local_guide' ? 5 : 0),
    },
  };
}

// Helper to map partial Profile updates to DB columns
export function mapProfileToDbUpdates(updates: Partial<Profile>): Record<string, any> {
  const dbUpdates: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };
  if (updates.username !== undefined) dbUpdates.username = updates.username;
  if (updates.fullName !== undefined) dbUpdates.full_name = updates.fullName;
  if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;
  if (updates.bio !== undefined) dbUpdates.bio = updates.bio;
  if (updates.activeRole !== undefined) dbUpdates.active_role = updates.activeRole;
  if (updates.homeCity !== undefined) dbUpdates.home_city = updates.homeCity;
  if (updates.isVerifiedGuide !== undefined) dbUpdates.is_verified_guide = updates.isVerifiedGuide;
  if (updates.guideCircuits !== undefined) dbUpdates.guide_circuits = updates.guideCircuits;
  if (updates.credibilityScore !== undefined) dbUpdates.credibility_score = updates.credibilityScore;
  if (updates.passportStampsCount !== undefined) dbUpdates.passport_stamps_count = updates.passportStampsCount;
  if (updates.languagesSpoken !== undefined) dbUpdates.languages_spoken = updates.languagesSpoken;
  if (updates.contactPhone !== undefined) dbUpdates.contact_phone = updates.contactPhone;
  return dbUpdates;
}

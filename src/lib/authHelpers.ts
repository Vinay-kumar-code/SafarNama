import type { User } from '@supabase/supabase-js';
import type { AccountType, Profile } from '../types';

export const accountLabels: Record<AccountType, string> = {
  traveler: 'Traveler',
  local_guide: 'Local guide',
  business: 'Business',
  destination_manager: 'Destination manager',
};

export const isAccountType = (role: unknown): role is AccountType =>
  typeof role === 'string' && Object.hasOwn(accountLabels, role);

export const emptyStats = { tripsCompleted: 0, spotsSaved: 0, contributions: 0 };

export const guestProfile: Profile = {
  id: '', username: '', fullName: 'Guest', avatarUrl: '', bio: '', activeRole: 'traveler',
  homeCity: '', isVerifiedGuide: false, guideCircuits: [], credibilityScore: 0,
  passportStampsCount: 0, languagesSpoken: [], visitedStates: [], stats: emptyStats,
};

type ProfileDetails = Pick<Profile, 'username' | 'fullName' | 'avatarUrl' | 'bio' | 'homeCity' | 'languagesSpoken' | 'guideCircuits'>;

function text(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function list(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

export function profileFromUser(user: User, row?: Record<string, unknown> | null): Profile {
  const meta = user.user_metadata;
  const saved: Partial<ProfileDetails> = meta.safarnama_profile ?? {};
  const account = meta.account_type ?? meta.role ?? row?.active_role;
  return {
    ...guestProfile,
    id: user.id,
    username: text(saved.username ?? row?.username ?? meta.username, `traveler_${user.id.slice(0, 8)}`),
    fullName: text(saved.fullName ?? row?.full_name ?? meta.full_name ?? meta.name, 'Traveler'),
    avatarUrl: text(saved.avatarUrl ?? row?.avatar_url ?? meta.avatar_url ?? meta.picture),
    bio: text(saved.bio ?? row?.bio ?? meta.bio),
    homeCity: text(saved.homeCity ?? row?.home_city ?? meta.home_city),
    languagesSpoken: list(saved.languagesSpoken ?? row?.languages_spoken),
    guideCircuits: list(saved.guideCircuits ?? row?.guide_circuits),
    activeRole: user.app_metadata.role === 'admin' ? 'admin' : isAccountType(account) ? account : 'traveler',
    isVerifiedGuide: user.app_metadata.verified_guide === true,
  };
}

export function profileDetails(profile: Profile): ProfileDetails {
  const { username, fullName, avatarUrl, bio, homeCity, languagesSpoken, guideCircuits } = profile;
  return { username, fullName, avatarUrl, bio, homeCity, languagesSpoken, guideCircuits };
}

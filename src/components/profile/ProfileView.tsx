import React, { useState } from 'react';
import { 
  User, 
  ShieldCheck, 
  Award, 
  MapPin, 
  Compass, 
  Sparkles, 
  Bookmark, 
  CheckCircle, 
  Calendar, 
  Phone, 
  Globe, 
  MessageCircle,
  ExternalLink,
  Flame,
  Star,
  LogIn,
  UserPlus,
  LogOut,
  Edit3,
  CloudCheck,
  CheckCircle2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { isSupabaseConfigured } from '../../lib/supabase';
import { UserRole } from '../../types';

export const ProfileView: React.FC = () => {
  const { currentUser, activeRole, switchRole, currentTrip, posts } = useApp();
  const { 
    isAuthenticated, 
    openAuthModal, 
    openOnboarding, 
    signOut, 
    isOfflineDemo,
    user 
  } = useAuth();

  const [activeSubTab, setActiveSubTab] = useState<'passport' | 'saved' | 'circuits'>('passport');

  // Authentic Indian Passport Stamps
  const passportStamps = [
    { id: 'stamp-1', name: 'Spiti High Valley', state: 'Himachal', icon: '🏔️', date: 'Oct 2026', color: 'from-blue-600 to-indigo-700' },
    { id: 'stamp-2', name: 'Varanasi Sacred Ghats', state: 'Uttar Pradesh', icon: '🪔', date: 'Aug 2026', color: 'from-amber-600 to-orange-700' },
    { id: 'stamp-3', name: 'Living Root Bridges', state: 'Meghalaya', icon: '🌿', date: 'Jul 2026', color: 'from-emerald-600 to-teal-700' },
    { id: 'stamp-4', name: 'Vijayanagara Empire', state: 'Karnataka', icon: '🏛️', date: 'May 2026', color: 'from-rose-600 to-red-700' },
    { id: 'stamp-5', name: 'Shahjahanabad Alleys', state: 'Old Delhi', icon: '🕌', date: 'Mar 2026', color: 'from-purple-600 to-indigo-800' },
    { id: 'stamp-6', name: 'Thar Desert Caravans', state: 'Rajasthan', icon: '🐪', date: 'Jan 2026', color: 'from-yellow-600 to-amber-700' },
  ];

  const savedPosts = posts.filter(p => p.isSaved);

  return (
    <div className="w-full h-[calc(100dvh-57px-60px)] md:h-[calc(100vh-65px)] overflow-y-auto bg-[#090a0f] p-4 sm:p-6 lg:p-8 no-scrollbar">
      <div className="max-w-xl md:max-w-5xl mx-auto space-y-6 pb-20">

        {/* Auth Banner for Guest Visitors */}
        {!isAuthenticated && (
          <div className="p-4 sm:p-6 rounded-3xl bg-gradient-to-r from-orange-950/60 via-slate-900 to-amber-950/40 border border-orange-500/30 shadow-xl space-y-3 animate-fadeIn">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6 text-orange-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-white">Join SafarNama • Cloud Synced Passport</h3>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                  Sign in or create an account to record your Himalayan passport stamps, save favorite secret spots across India, and publish local guide circuits.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2 sm:max-w-sm sm:ml-16">
              <button
                onClick={() => openAuthModal('signin')}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-white/10 transition-colors"
              >
                <LogIn className="w-3.5 h-3.5 text-orange-400" />
                <span>Sign In</span>
              </button>
              <button
                onClick={() => openAuthModal('signup')}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/20 transition-all"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Create Account</span>
              </button>
            </div>
          </div>
        )}
        
        {/* Dual Identity Switcher Banner */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-semibold text-slate-300">Identity Mode:</span>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              activeRole === 'local_guide'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
            }`}>
              {activeRole === 'local_guide' ? 'Local Guide / Destination Creator' : 'Traveler Passport'}
            </span>
          </div>

          <button
            onClick={() => switchRole(activeRole === 'traveler' ? 'local_guide' : 'traveler')}
            className="text-xs sm:text-sm font-bold text-orange-400 hover:text-orange-300 underline underline-offset-2 transition-colors"
          >
            Switch to {activeRole === 'traveler' ? 'Guide Profile' : 'Traveler Mode'}
          </button>
        </div>

        {/* Profile Card */}
        <div className={`p-5 sm:p-7 rounded-3xl border shadow-2xl relative overflow-hidden ${
          activeRole === 'local_guide'
            ? 'bg-gradient-to-br from-slate-900 via-slate-900 to-teal-950/40 border-emerald-500/30'
            : 'bg-gradient-to-br from-slate-900 via-slate-900 to-orange-950/30 border-white/10'
        }`}>
          {/* Top Actions in Card */}
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              {isSupabaseConfigured && !isOfflineDemo ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                  <span>Supabase Live Sync</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>Offline / Demo Profile</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={openOnboarding}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors border border-white/10"
                title="Edit profile & avatar"
              >
                <Edit3 className="w-3.5 h-3.5 text-orange-400" />
                <span>Edit Profile</span>
              </button>

              {isAuthenticated ? (
                <button
                  onClick={() => signOut()}
                  className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-red-500/20"
                  title="Sign out of SafarNama"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              ) : (
                <button
                  onClick={() => openAuthModal('signin')}
                  className="px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Avatar & Identifiers */}
            <div className="md:col-span-4 flex items-center md:flex-col md:items-start gap-4">
              <div className="relative shrink-0">
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.fullName}
                  className={`w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-3xl object-cover border-2 shadow-2xl ${
                    activeRole === 'local_guide' ? 'border-emerald-400' : 'border-orange-500'
                  }`}
                />
                {currentUser.isVerifiedGuide && (
                  <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-emerald-500 text-white shadow-md">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h2 className="text-lg sm:text-xl font-black text-white truncate">
                  {currentUser.fullName}
                </h2>
                <p className="text-xs sm:text-sm text-slate-400">@{currentUser.username}</p>

                <div className="flex items-center gap-1.5 text-xs text-slate-300 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                  <span>{currentUser.homeCity}</span>
                </div>

                {currentUser.isVerifiedGuide && (
                  <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[11px] font-bold">
                    <Star className="w-3.5 h-3.5 fill-current text-emerald-400" />
                    <span>Guide Score: {currentUser.credibilityScore} / 1000</span>
                  </div>
                )}
              </div>
            </div>

            {/* Bio & Stats */}
            <div className="md:col-span-8 flex flex-col justify-between h-full space-y-4">
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-black/20 p-3.5 rounded-2xl border border-white/5">
                {currentUser.bio}
              </p>

              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-slate-800/60 p-3 rounded-2xl border border-white/5">
                  <span className="text-[11px] text-slate-400 block font-medium">Trips Logged</span>
                  <span className="text-base sm:text-lg font-black text-white">{currentUser.stats.tripsCompleted}</span>
                </div>
                <div className="bg-slate-800/60 p-3 rounded-2xl border border-white/5">
                  <span className="text-[11px] text-slate-400 block font-medium">Passport Stamps</span>
                  <span className="text-base sm:text-lg font-black text-orange-400">{currentUser.passportStampsCount}</span>
                </div>
                <div className="bg-slate-800/60 p-3 rounded-2xl border border-white/5">
                  <span className="text-[11px] text-slate-400 block font-medium">
                    {activeRole === 'local_guide' ? 'Tours Led' : 'Saved Spots'}
                  </span>
                  <span className="text-base sm:text-lg font-black text-emerald-400">
                    {activeRole === 'local_guide' ? currentUser.stats.guideToursLed : currentUser.stats.spotsSaved}
                  </span>
                </div>
              </div>

              {/* Local Guide Actions: WhatsApp Booking */}
              {activeRole === 'local_guide' && (
                <div className="pt-1 flex gap-2">
                  <a
                    href={`https://wa.me/919418000000?text=Hi%20${encodeURIComponent(currentUser.fullName)},%20I%20saw%20your%20local%20guide%20profile%20on%20SafarNama`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Book Certified Local Guide Tour via WhatsApp</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-2">
          <button
            onClick={() => setActiveSubTab('passport')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeSubTab === 'passport'
                ? 'bg-orange-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Digital Passport ({passportStamps.length} Stamps)
          </button>

          <button
            onClick={() => setActiveSubTab('saved')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeSubTab === 'saved'
                ? 'bg-orange-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Saved Spots ({savedPosts.length})
          </button>

          {currentUser.isVerifiedGuide && (
            <button
              onClick={() => setActiveSubTab('circuits')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeSubTab === 'circuits'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Guide Circuits
            </button>
          )}
        </div>

        {/* Tab Content: Digital Passport */}
        {activeSubTab === 'passport' && (
          <div className="space-y-6">
            {/* Visited Indian States Pills */}
            <div className="space-y-2.5">
              <h4 className="text-xs sm:text-sm font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Globe className="w-4 h-4 text-orange-400" />
                <span>Explored States & UTs of India ({currentUser.visitedStates.length} / 28)</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {currentUser.visitedStates.map((st, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 rounded-full bg-slate-900 border border-white/10 text-slate-200 text-xs sm:text-sm font-medium hover:border-orange-500/40 transition-colors"
                  >
                    🇮🇳 {st}
                  </span>
                ))}
              </div>
            </div>

            {/* Passport Stamps Visual Grid */}
            <div className="space-y-3">
              <h4 className="text-xs sm:text-sm font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                <span>Official Journey Passport Stamps</span>
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
                {passportStamps.map(stamp => (
                  <div
                    key={stamp.id}
                    className="relative p-3.5 rounded-2xl bg-slate-900 border border-white/10 shadow-lg overflow-hidden group hover:border-orange-500/50 hover:scale-[1.02] transition-all flex flex-col items-center text-center gap-2.5"
                  >
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${stamp.color} flex items-center justify-center text-2xl shrink-0 shadow-md border border-white/20 group-hover:rotate-6 transition-transform`}>
                      {stamp.icon}
                    </div>

                    <div className="w-full">
                      <h5 className="text-xs font-bold text-white leading-tight truncate">
                        {stamp.name}
                      </h5>
                      <p className="text-[10px] text-orange-400 font-semibold truncate">{stamp.state}</p>
                      <span className="text-[9px] text-slate-500 font-mono block mt-1">
                        {stamp.date}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab Content: Saved Spots */}
        {activeSubTab === 'saved' && (
          <div className="space-y-4">
            <h4 className="text-xs sm:text-sm font-extrabold text-slate-300 uppercase tracking-wider">
              Saved Spots for Upcoming Trips ({savedPosts.length})
            </h4>

            {savedPosts.length === 0 ? (
              <div className="p-8 rounded-3xl bg-slate-900 border border-white/10 text-center">
                <Bookmark className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                <p className="text-sm font-bold text-white">No saved spots yet</p>
                <p className="text-xs text-slate-400 mt-1">Explore reels and map pins and tap the save bookmark!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {savedPosts.map(post => (
                  <div
                    key={post.id}
                    className="p-3.5 rounded-2xl bg-slate-900 border border-white/10 hover:border-orange-500/40 flex items-center gap-3.5 shadow-md transition-all group"
                  >
                    <img
                      src={post.thumbnailUrl || post.carouselImages?.[0]}
                      alt={post.spotName}
                      className="w-16 h-16 rounded-xl object-cover shrink-0 group-hover:scale-105 transition-transform"
                    />
                    <div className="flex-1 min-w-0">
                      <h5 className="text-xs sm:text-sm font-bold text-white truncate">
                        {post.spotName}
                      </h5>
                      <p className="text-[11px] text-orange-400 font-semibold truncate">
                        {post.region}, {post.state}
                      </p>
                      <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">
                        {post.caption}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab Content: Guide Circuits */}
        {activeSubTab === 'circuits' && (
          <div className="space-y-4">
            <h4 className="text-xs sm:text-sm font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Verified Destination Expertise</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {currentUser.guideCircuits.map((circuit, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-white">{circuit}</p>
                      <p className="text-[11px] text-emerald-300">Certified by SafarNama Tourism Verification</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 shrink-0 px-2 py-0.5 rounded-full bg-slate-800">Expert</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

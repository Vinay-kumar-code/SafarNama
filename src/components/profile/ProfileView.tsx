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
import { serverMediaUrl } from '../../lib/serverStorage';
import { isSupabaseConfigured } from '../../lib/supabase';
import { UserRole } from '../../types';

export const ProfileView: React.FC = () => {
  const { currentUser, activeRole, switchRole, posts } = useApp();
  const { 
    isAuthenticated, 
    openAuthModal, 
    openOnboarding, 
    signOut, 
    openAdminPortal,

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
    <div className="w-full h-[calc(100dvh-57px-60px)] md:h-[calc(100vh-65px)] overflow-y-auto bg-white md:bg-[#fafafa] p-4 sm:p-6 lg:p-8 no-scrollbar text-zinc-900">
      <div className="max-w-xl md:max-w-5xl mx-auto space-y-6 pb-20">

        {/* Auth Banner for Guest Visitors */}
        {!isAuthenticated && (
          <div className="p-4 sm:p-6 rounded-3xl bg-gradient-to-r from-orange-50 via-white to-amber-50 border border-orange-200 shadow-sm space-y-3 animate-fadeIn">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 border border-orange-200">
                <Sparkles className="w-6 h-6 text-orange-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-zinc-900">Join SafarNama • Cloud Synced Passport</h3>
                <p className="text-xs sm:text-sm text-zinc-600 mt-1 leading-relaxed">
                  Sign in or create an account to record your Himalayan passport stamps, save favorite secret spots across India, and publish local guide circuits.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2 sm:max-w-sm sm:ml-16">
              <button
                onClick={() => openAuthModal('signin')}
                className="flex-1 py-2.5 px-4 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold text-xs flex items-center justify-center gap-1.5 border border-zinc-200 shadow-xs transition-colors cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5 text-orange-500" />
                <span>Sign In</span>
              </button>
              <button
                onClick={() => openAuthModal('signup')}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/20 transition-all cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Create Account</span>
              </button>
            </div>
          </div>
        )}
        
        {/* Dual / Multi Identity Switcher Banner */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-zinc-200 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-semibold text-zinc-700">Identity Mode:</span>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              activeRole === 'admin'
                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                : activeRole === 'local_guide'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-orange-50 text-orange-700 border border-orange-200'
            }`}>
              {activeRole === 'admin' ? 'HQ Admin Operations Command' : activeRole === 'local_guide' ? 'Local Guide / Destination Creator' : 'Traveler Passport'}
            </span>
          </div>

          {activeRole === 'admin' ? (
            <button
              onClick={openAdminPortal}
              className="text-xs sm:text-sm font-bold text-purple-700 hover:text-purple-800 underline underline-offset-2 transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>Open Admin Operations</span>
              <ShieldCheck className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={() => switchRole(activeRole === 'traveler' ? 'local_guide' : 'traveler')}
              className="text-xs sm:text-sm font-bold text-orange-600 hover:text-orange-700 underline underline-offset-2 transition-colors cursor-pointer"
            >
              Switch to {activeRole === 'traveler' ? 'Guide Profile' : 'Traveler Mode'}
            </button>
          )}
        </div>

        {/* Profile Card */}
        <div className={`p-5 sm:p-7 rounded-3xl border shadow-sm relative overflow-hidden ${
          activeRole === 'admin'
            ? 'bg-gradient-to-br from-white via-white to-purple-50/40 border-purple-200'
            : activeRole === 'local_guide'
            ? 'bg-gradient-to-br from-white via-white to-teal-50/40 border-emerald-200'
            : 'bg-white border-zinc-200'
        }`}>
          {/* Top Actions in Card */}
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-zinc-100">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                activeRole === 'admin'
                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                  : activeRole === 'local_guide'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-orange-50 text-orange-700 border border-orange-200'
              }`}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>{activeRole === 'admin' ? 'HQ Admin Verified' : activeRole === 'local_guide' ? 'Verified Local Guide' : 'Verified Traveler Member'}</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              {activeRole === 'admin' && (
                <button
                  onClick={openAdminPortal}
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                  title="Open SafarNama Admin Operations Portal"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Admin Portal</span>
                </button>
              )}

              <button
                onClick={openOnboarding}
                className="px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-zinc-200 shadow-xs cursor-pointer"
                title="Edit profile & avatar"
              >
                <Edit3 className="w-3.5 h-3.5 text-orange-500" />
                <span>Edit Profile</span>
              </button>

              {isAuthenticated ? (
                <button
                  onClick={() => signOut()}
                  className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-red-200 cursor-pointer"
                  title="Sign out of SafarNama"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              ) : (
                <button
                  onClick={() => openAuthModal('signin')}
                  className="px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
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
                  src={serverMediaUrl(currentUser.avatarUrl)}
                  alt={currentUser.fullName}
                  className={`w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-3xl object-cover border-2 shadow-md ${
                    activeRole === 'local_guide' ? 'border-emerald-500' : 'border-orange-500'
                  }`}
                />
                {currentUser.isVerifiedGuide && (
                  <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-emerald-500 text-white shadow-md">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h2 className="text-lg sm:text-xl font-black text-zinc-900 truncate">
                  {currentUser.fullName}
                </h2>
                <p className="text-xs sm:text-sm text-zinc-500">@{currentUser.username}</p>

                <div className="flex items-center gap-1.5 text-xs text-zinc-600 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                  <span>{currentUser.homeCity}</span>
                </div>

                {currentUser.isVerifiedGuide && (
                  <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
                    <Star className="w-3.5 h-3.5 fill-current text-emerald-500" />
                    <span>Guide Score: {currentUser.credibilityScore} / 1000</span>
                  </div>
                )}
              </div>
            </div>

            {/* Bio & Stats */}
            <div className="md:col-span-8 flex flex-col justify-between h-full space-y-4">
              <p className="text-xs sm:text-sm text-zinc-700 leading-relaxed bg-zinc-50 p-3.5 rounded-2xl border border-zinc-200/80">
                {currentUser.bio}
              </p>

              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-zinc-50 p-3 rounded-2xl border border-zinc-200/80 shadow-xs">
                  <span className="text-[11px] text-zinc-500 block font-medium">Trips Logged</span>
                  <span className="text-base sm:text-lg font-black text-zinc-900">{currentUser.stats.tripsCompleted}</span>
                </div>
                <div className="bg-zinc-50 p-3 rounded-2xl border border-zinc-200/80 shadow-xs">
                  <span className="text-[11px] text-zinc-500 block font-medium">Passport Stamps</span>
                  <span className="text-base sm:text-lg font-black text-orange-600">{currentUser.passportStampsCount}</span>
                </div>
                <div className="bg-zinc-50 p-3 rounded-2xl border border-zinc-200/80 shadow-xs">
                  <span className="text-[11px] text-zinc-500 block font-medium">
                    {activeRole === 'local_guide' ? 'Tours Led' : 'Saved Spots'}
                  </span>
                  <span className="text-base sm:text-lg font-black text-emerald-600">
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
                    className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all"
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
        <div className="flex items-center gap-2 border-b border-zinc-200 pb-2">
          <button
            onClick={() => setActiveSubTab('passport')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeSubTab === 'passport'
                ? 'bg-orange-500 text-white shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
            }`}
          >
            Digital Passport ({passportStamps.length} Stamps)
          </button>

          <button
            onClick={() => setActiveSubTab('saved')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeSubTab === 'saved'
                ? 'bg-orange-500 text-white shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
            }`}
          >
            Saved Spots ({savedPosts.length})
          </button>

          {currentUser.isVerifiedGuide && (
            <button
              onClick={() => setActiveSubTab('circuits')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeSubTab === 'circuits'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
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
              <h4 className="text-xs sm:text-sm font-extrabold text-zinc-600 uppercase tracking-wider flex items-center gap-2">
                <Globe className="w-4 h-4 text-orange-500" />
                <span>Explored States & UTs of India ({currentUser.visitedStates.length} / 28)</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {currentUser.visitedStates.map((st, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 rounded-full bg-white border border-zinc-200 text-zinc-700 text-xs sm:text-sm font-medium hover:border-orange-400 shadow-xs transition-colors"
                  >
                    🇮🇳 {st}
                  </span>
                ))}
              </div>
            </div>

            {/* Passport Stamps Visual Grid */}
            <div className="space-y-3">
              <h4 className="text-xs sm:text-sm font-extrabold text-zinc-600 uppercase tracking-wider flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                <span>Official Journey Passport Stamps</span>
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
                {passportStamps.map(stamp => (
                  <div
                    key={stamp.id}
                    className="relative p-3.5 rounded-2xl bg-white border border-zinc-200 shadow-xs overflow-hidden group hover:border-orange-400 hover:shadow-md hover:scale-[1.02] transition-all flex flex-col items-center text-center gap-2.5"
                  >
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${stamp.color} flex items-center justify-center text-2xl shrink-0 shadow-sm border border-white/40 group-hover:rotate-6 transition-transform text-white`}>
                      {stamp.icon}
                    </div>

                    <div className="w-full">
                      <h5 className="text-xs font-bold text-zinc-900 leading-tight truncate">
                        {stamp.name}
                      </h5>
                      <p className="text-[10px] text-orange-600 font-semibold truncate">{stamp.state}</p>
                      <span className="text-[9px] text-zinc-400 font-mono block mt-1">
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
            <h4 className="text-xs sm:text-sm font-extrabold text-zinc-600 uppercase tracking-wider">
              Saved Spots for Upcoming Trips ({savedPosts.length})
            </h4>

            {savedPosts.length === 0 ? (
              <div className="p-8 rounded-3xl bg-white border border-zinc-200 text-center shadow-xs">
                <Bookmark className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
                <p className="text-sm font-bold text-zinc-800">No saved spots yet</p>
                <p className="text-xs text-zinc-500 mt-1">Explore reels and map pins and tap the save bookmark!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {savedPosts.map(post => (
                  <div
                    key={post.id}
                    className="p-3.5 rounded-2xl bg-white border border-zinc-200 hover:border-orange-400 flex items-center gap-3.5 shadow-xs transition-all group"
                  >
                    <img
                      src={serverMediaUrl(post.thumbnailUrl || post.carouselImages?.[0])}
                      alt={post.spotName}
                      className="w-16 h-16 rounded-xl object-cover shrink-0 group-hover:scale-105 transition-transform border border-zinc-100"
                    />
                    <div className="flex-1 min-w-0">
                      <h5 className="text-xs sm:text-sm font-bold text-zinc-900 truncate">
                        {post.spotName}
                      </h5>
                      <p className="text-[11px] text-orange-600 font-semibold truncate">
                        {post.region}, {post.state}
                      </p>
                      <p className="text-[11px] text-zinc-500 line-clamp-2 mt-0.5">
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
            <h4 className="text-xs sm:text-sm font-extrabold text-zinc-600 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Verified Destination Expertise</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {currentUser.guideCircuits.map((circuit, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-zinc-900">{circuit}</p>
                      <p className="text-[11px] text-emerald-700">Certified by SafarNama Tourism Verification</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-zinc-600 shrink-0 px-2 py-0.5 rounded-full bg-white border border-zinc-200">Expert</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

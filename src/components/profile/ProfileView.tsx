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
  Star
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';

export const ProfileView: React.FC = () => {
  const { currentUser, activeRole, switchRole, currentTrip, posts } = useApp();
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
    <div className="w-full h-[calc(100dvh-57px-60px)] overflow-y-auto bg-[#090a0f] p-4 no-scrollbar">
      <div className="max-w-xl mx-auto space-y-5 pb-12">
        
        {/* Dual Identity Switcher Banner */}
        <div className="p-3.5 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-300">Identity Mode:</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              activeRole === 'local_guide'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
            }`}>
              {activeRole === 'local_guide' ? 'Local Guide / Destination Creator' : 'Traveler Passport'}
            </span>
          </div>

          <button
            onClick={() => switchRole(activeRole === 'traveler' ? 'local_guide' : 'traveler')}
            className="text-xs font-bold text-orange-400 hover:text-orange-300 underline underline-offset-2"
          >
            Switch to {activeRole === 'traveler' ? 'Guide Profile' : 'Traveler Mode'}
          </button>
        </div>

        {/* Profile Card */}
        <div className={`p-5 rounded-3xl border shadow-2xl relative overflow-hidden ${
          activeRole === 'local_guide'
            ? 'bg-gradient-to-br from-slate-900 via-slate-900 to-teal-950/40 border-emerald-500/30'
            : 'bg-gradient-to-br from-slate-900 via-slate-900 to-orange-950/30 border-white/10'
        }`}>
          <div className="flex items-start gap-4">
            <div className="relative">
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.fullName}
                className={`w-20 h-20 rounded-2xl object-cover border-2 shadow-xl ${
                  activeRole === 'local_guide' ? 'border-emerald-400' : 'border-orange-500'
                }`}
              />
              {currentUser.isVerifiedGuide && (
                <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-emerald-500 text-white shadow-md">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="text-lg font-black text-white truncate">
                  {currentUser.fullName}
                </h2>
              </div>
              <p className="text-xs text-slate-400">@{currentUser.username}</p>

              <div className="flex items-center gap-1 text-[11px] text-slate-300 mt-1">
                <MapPin className="w-3 h-3 text-orange-400" />
                <span>{currentUser.homeCity}</span>
              </div>

              {currentUser.isVerifiedGuide && (
                <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold">
                  <Star className="w-3 h-3 fill-current text-emerald-400" />
                  <span>Credibility Score: {currentUser.credibilityScore} / 1000</span>
                </div>
              )}
            </div>
          </div>

          <p className="text-xs text-slate-300 mt-4 leading-relaxed">
            {currentUser.bio}
          </p>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-2.5 mt-4 pt-4 border-t border-white/10 text-center">
            <div className="bg-slate-800/60 p-2 rounded-xl">
              <span className="text-[10px] text-slate-400 block">Trips Logged</span>
              <span className="text-sm font-black text-white">{currentUser.stats.tripsCompleted}</span>
            </div>
            <div className="bg-slate-800/60 p-2 rounded-xl">
              <span className="text-[10px] text-slate-400 block">Passport Stamps</span>
              <span className="text-sm font-black text-orange-400">{currentUser.passportStampsCount}</span>
            </div>
            <div className="bg-slate-800/60 p-2 rounded-xl">
              <span className="text-[10px] text-slate-400 block">
                {activeRole === 'local_guide' ? 'Tours Led' : 'Saved Spots'}
              </span>
              <span className="text-sm font-black text-emerald-400">
                {activeRole === 'local_guide' ? currentUser.stats.guideToursLed : currentUser.stats.spotsSaved}
              </span>
            </div>
          </div>

          {/* Local Guide Actions: WhatsApp Booking */}
          {activeRole === 'local_guide' && (
            <div className="mt-4 pt-3 flex gap-2">
              <a
                href={`https://wa.me/919418000000?text=Hi%20${encodeURIComponent(currentUser.fullName)},%20I%20saw%20your%20local%20guide%20profile%20on%20SafarNama`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/30 transition-all"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Book Local Guide Tour</span>
              </a>
            </div>
          )}
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-2">
          <button
            onClick={() => setActiveSubTab('passport')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'passport'
                ? 'bg-orange-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Digital Passport ({passportStamps.length} Stamps)
          </button>

          <button
            onClick={() => setActiveSubTab('saved')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
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
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
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
          <div className="space-y-4">
            {/* Visited Indian States Pills */}
            <div className="space-y-2">
              <h4 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-orange-400" />
                <span>Explored States of India ({currentUser.visitedStates.length} / 28)</span>
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {currentUser.visitedStates.map((st, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-full bg-slate-900 border border-white/10 text-slate-200 text-xs font-medium"
                  >
                    🇮🇳 {st}
                  </span>
                ))}
              </div>
            </div>

            {/* Passport Stamps Visual Grid */}
            <div className="space-y-2">
              <h4 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span>Official Journey Passport Stamps</span>
              </h4>

              <div className="grid grid-cols-2 gap-3">
                {passportStamps.map(stamp => (
                  <div
                    key={stamp.id}
                    className="relative p-3.5 rounded-2xl bg-slate-900 border border-white/10 shadow-lg overflow-hidden group hover:border-orange-500/40 transition-all flex items-center gap-3"
                  >
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${stamp.color} flex items-center justify-center text-xl shrink-0 shadow-md border border-white/20`}>
                      {stamp.icon}
                    </div>

                    <div className="min-w-0">
                      <h5 className="text-xs font-bold text-white leading-tight truncate">
                        {stamp.name}
                      </h5>
                      <p className="text-[10px] text-orange-400 font-semibold">{stamp.state}</p>
                      <span className="text-[9px] text-slate-500 font-mono block mt-0.5">
                        Stamped: {stamp.date}
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
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider">
              Saved Spots for Upcoming Trips
            </h4>

            {savedPosts.map(post => (
              <div
                key={post.id}
                className="p-3 rounded-2xl bg-slate-900 border border-white/10 flex items-center gap-3 shadow-md"
              >
                <img
                  src={post.thumbnailUrl || post.carouselImages?.[0]}
                  alt={post.spotName}
                  className="w-14 h-14 rounded-xl object-cover shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h5 className="text-xs font-bold text-white truncate">
                    {post.spotName}
                  </h5>
                  <p className="text-[10px] text-orange-400 font-medium">
                    {post.region}, {post.state}
                  </p>
                  <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                    {post.caption}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab Content: Guide Circuits */}
        {activeSubTab === 'circuits' && (
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Verified Destination Expertise</span>
            </h4>

            <div className="space-y-2">
              {currentUser.guideCircuits.map((circuit, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <div>
                      <p className="text-xs font-bold text-white">{circuit}</p>
                      <p className="text-[10px] text-emerald-300">Certified by SafarNama Tourism Verification</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">Circuit Expert</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

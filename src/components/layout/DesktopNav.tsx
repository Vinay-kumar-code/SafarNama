import React, { useState } from 'react';
import { 
  Compass, 
  Map, 
  Film, 
  Calendar, 
  MessageSquareText, 
  Trophy, 
  User, 
  ShieldCheck, 
  UserCheck, 
  Search, 
  ChevronDown, 
  Sparkles, 
  LogIn, 
  LogOut,
  MapPin,
  ExternalLink
} from 'lucide-react';
import { useApp, NavTab } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { DESTINATION_HUBS } from '../../data/mockData';

export const DesktopNav: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    currentTrip, 
    qaThreads, 
    activeRole, 
    switchRole, 
    setActiveDestination 
  } = useApp();

  const { 
    user, 
    profile, 
    isAuthenticated, 
    openAuthModal, 
    signOut 
  } = useAuth();

  const [destDropdownOpen, setDestDropdownOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const totalSavedStops = currentTrip.stops.length;
  const activeQACount = qaThreads.filter(t => t.status === 'active').length;

  const navLinks: { id: NavTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: 'feed',
      label: 'Explore Reels',
      icon: <Film className="w-4 h-4" />,
    },
    {
      id: 'map',
      label: 'Discovery Map',
      icon: <Map className="w-4 h-4" />,
    },
    {
      id: 'trips',
      label: 'Trip Planner',
      icon: <Compass className="w-4 h-4" />,
      badge: totalSavedStops > 0 ? totalSavedStops : undefined,
    },
    {
      id: 'qa',
      label: 'Community Q&A',
      icon: <MessageSquareText className="w-4 h-4" />,
      badge: activeQACount > 0 ? activeQACount : undefined,
    },
    {
      id: 'campaigns',
      label: 'Tourism Trends',
      icon: <Trophy className="w-4 h-4" />,
    },
  ];

  return (
    <header className="hidden md:flex sticky top-0 z-40 bg-[#090a0f]/95 backdrop-blur-xl border-b border-white/10 px-6 py-3 items-center justify-between gap-4">
      {/* Brand Logo & Tagline */}
      <div 
        onClick={() => setActiveTab('feed')}
        className="flex items-center gap-3 cursor-pointer shrink-0 group select-none"
      >
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-600 via-orange-500 to-amber-400 flex items-center justify-center shadow-lg shadow-orange-500/25 group-hover:scale-105 transition-transform">
          <Compass className="w-6 h-6 text-white animate-spin-slow" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-orange-200 bg-clip-text text-transparent">
              SafarNama
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 font-bold border border-orange-500/30">
              सफ़रनामा
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">Map-First Social Travel for Authentic India</p>
        </div>
      </div>

      {/* Main Navigation Links */}
      <nav className="flex items-center gap-1.5 bg-slate-900/80 p-1.5 rounded-2xl border border-white/10 shadow-inner">
        {navLinks.map((link) => {
          const isActive = activeTab === link.id;
          return (
            <button
              key={link.id}
              onClick={() => setActiveTab(link.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all relative ${
                isActive
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/25 scale-[1.02]'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              {link.icon}
              <span>{link.label}</span>
              {link.badge !== undefined && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  isActive ? 'bg-black/30 text-white' : 'bg-orange-500 text-white'
                }`}>
                  {link.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Destination Hubs Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDestDropdownOpen(!destDropdownOpen)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-white/5 transition-all"
          >
            <MapPin className="w-3.5 h-3.5 text-amber-400" />
            <span>Destinations</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {destDropdownOpen && (
            <div 
              onMouseLeave={() => setDestDropdownOpen(false)}
              className="absolute top-full mt-2 left-0 w-64 bg-[#11131c] border border-white/15 rounded-2xl p-2 shadow-2xl z-50 animate-fade-in"
            >
              <div className="px-2.5 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Official Master Hubs
              </div>
              {DESTINATION_HUBS.map(hub => (
                <button
                  key={hub.id}
                  onClick={() => {
                    setActiveDestination(hub);
                    setDestDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-white/10 text-left transition-colors group"
                >
                  <img
                    src={hub.coverImage}
                    alt={hub.name}
                    className="w-8 h-8 rounded-lg object-cover"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white group-hover:text-orange-400 transition-colors truncate">
                      {hub.name}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">{hub.state}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* Right Controls: Mode Switcher & Authentication */}
      <div className="flex items-center gap-3 shrink-0">
        
        {/* Dual-Identity Switcher */}
        <button
          onClick={() => switchRole(activeRole === 'traveler' ? 'local_guide' : 'traveler')}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all border shadow-sm ${
            activeRole === 'local_guide'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-400/50 shadow-emerald-500/20'
              : 'bg-slate-900 text-slate-300 hover:text-white border-white/10'
          }`}
          title="Switch between Traveler Passport and Local Guide Profile"
        >
          {activeRole === 'local_guide' ? (
            <>
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span>Guide Mode</span>
            </>
          ) : (
            <>
              <UserCheck className="w-4 h-4 text-orange-400" />
              <span>Traveler Mode</span>
            </>
          )}
        </button>

        {/* Profile / Auth Button */}
        {isAuthenticated && profile ? (
          <div className="relative">
            <button
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              className="flex items-center gap-2 p-1.5 pr-3 rounded-2xl bg-slate-900 border border-white/10 hover:border-orange-500/40 transition-all"
            >
              <img
                src={profile.avatarUrl}
                alt={profile.fullName}
                className="w-7 h-7 rounded-xl object-cover border border-orange-500/50"
              />
              <span className="text-xs font-bold text-white max-w-[100px] truncate">
                {profile.fullName.split(' ')[0]}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {profileMenuOpen && (
              <div 
                onMouseLeave={() => setProfileMenuOpen(false)}
                className="absolute right-0 top-full mt-2 w-56 bg-[#11131c] border border-white/15 rounded-2xl p-2 shadow-2xl z-50 animate-fade-in space-y-1"
              >
                <div className="p-2 border-b border-white/10">
                  <p className="text-xs font-bold text-white truncate">{profile.fullName}</p>
                  <p className="text-[10px] text-slate-400">@{profile.username}</p>
                  <span className="mt-1 inline-block text-[9px] px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 font-semibold">
                    {profile.homeCity}
                  </span>
                </div>

                <button
                  onClick={() => {
                    setActiveTab('profile');
                    setProfileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 p-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-white/10 transition-colors"
                >
                  <User className="w-4 h-4 text-orange-400" />
                  <span>My Passport & Profile</span>
                </button>

                <button
                  onClick={() => {
                    signOut();
                    setProfileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 p-2 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => openAuthModal('signin')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs shadow-md shadow-orange-500/25 transition-all"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In / Join</span>
          </button>
        )}

      </div>
    </header>
  );
};

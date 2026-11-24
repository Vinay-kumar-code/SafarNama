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
import { DESTINATION_HUBS } from '../../data/destinations';
import { BrandLogo } from '../common/BrandLogo';

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
    openAdminPortal,
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
    <header className="hidden md:flex sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-zinc-200 px-6 py-3 items-center justify-between gap-4 text-zinc-900 shadow-xs">
      {/* Brand Logo & Tagline */}
      <div 
        onClick={() => setActiveTab('feed')}
        className="flex items-center gap-3 cursor-pointer shrink-0 group select-none"
      >
        <BrandLogo size="lg" glow animated className="group-hover:scale-105 transition-transform" />
        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-xl tracking-tight text-zinc-900">
              SafarNama
            </span>
          </div>
          <p className="text-[11px] text-zinc-500 font-medium">Map-First Social Travel for Authentic India</p>
        </div>
      </div>

      {/* Main Navigation Links */}
      <nav className="flex items-center gap-1.5 bg-zinc-100/80 p-1.5 rounded-2xl border border-zinc-200/80 shadow-xs">
        {navLinks.map((link) => {
          const isActive = activeTab === link.id;
          return (
            <button
              key={link.id}
              onClick={() => setActiveTab(link.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all relative ${
                isActive
                  ? 'bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 text-white shadow-md shadow-orange-500/25 scale-[1.02]'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-white/80'
              }`}
            >
              {link.icon}
              <span>{link.label}</span>
              {link.badge !== undefined && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  isActive ? 'bg-black/25 text-white' : 'bg-orange-500 text-white'
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
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-zinc-700 hover:text-zinc-900 hover:bg-white/80 transition-all"
          >
            <MapPin className="w-3.5 h-3.5 text-orange-500" />
            <span>Destinations</span>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
          </button>

          {destDropdownOpen && (
            <div 
              onMouseLeave={() => setDestDropdownOpen(false)}
              className="absolute top-full mt-2 left-0 w-64 bg-white border border-zinc-200 rounded-2xl p-2 shadow-xl z-50 animate-fade-in"
            >
              <div className="px-2.5 py-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                Official Master Hubs
              </div>
              {DESTINATION_HUBS.map(hub => (
                <button
                  key={hub.id}
                  onClick={() => {
                    setActiveDestination(hub);
                    setDestDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-zinc-100 text-left transition-colors group"
                >
                  <img
                    src={hub.coverImage}
                    alt={hub.name}
                    className="w-8 h-8 rounded-lg object-cover"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-zinc-900 group-hover:text-orange-600 transition-colors truncate">
                      {hub.name}
                    </p>
                    <p className="text-[10px] text-zinc-500 truncate">{hub.state}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* Right Controls: Mode Switcher & Authentication */}
      <div className="flex items-center gap-3 shrink-0">
        
        {/* Dual / Admin Identity Switcher */}
        {activeRole === 'admin' ? (
          <button
            onClick={openAdminPortal}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all border shadow-xs bg-purple-700 text-white border-purple-600 shadow-purple-700/20"
            title="Open SafarNama HQ Admin Operations Portal"
          >
            <ShieldCheck className="w-4 h-4 text-purple-200" />
            <span>Admin HQ</span>
          </button>
        ) : (
          <button
            onClick={() => switchRole(activeRole === 'traveler' ? 'local_guide' : 'traveler')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all border shadow-xs ${
              activeRole === 'local_guide'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-500 shadow-emerald-500/20'
                : 'bg-white text-zinc-700 hover:text-zinc-900 border-zinc-200 hover:bg-zinc-50'
            }`}
            title="Switch between Traveler Passport and Local Guide Profile"
          >
            {activeRole === 'local_guide' ? (
              <>
                <ShieldCheck className="w-4 h-4 text-emerald-200" />
                <span>Guide Mode</span>
              </>
            ) : (
              <>
                <UserCheck className="w-4 h-4 text-orange-500" />
                <span>Traveler Mode</span>
              </>
            )}
          </button>
        )}

        {/* Profile / Auth Button */}
        {isAuthenticated && profile ? (
          <div className="relative">
            <button
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              className="flex items-center gap-2 p-1.5 pr-3 rounded-2xl bg-white border border-zinc-200 hover:border-orange-500/50 shadow-xs transition-all"
            >
              <img
                src={profile.avatarUrl}
                alt={profile.fullName}
                className="w-7 h-7 rounded-xl object-cover border border-orange-500/60"
              />
              <span className="text-xs font-bold text-zinc-800 max-w-[100px] truncate">
                {profile.fullName.split(' ')[0]}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
            </button>

            {profileMenuOpen && (
              <div 
                onMouseLeave={() => setProfileMenuOpen(false)}
                className="absolute right-0 top-full mt-2 w-56 bg-white border border-zinc-200 rounded-2xl p-2 shadow-xl z-50 animate-fade-in space-y-1"
              >
                <div className="p-2 border-b border-zinc-100">
                  <p className="text-xs font-bold text-zinc-900 truncate">{profile.fullName}</p>
                  <p className="text-[10px] text-zinc-500">@{profile.username}</p>
                  <span className={`mt-1 inline-block text-[9px] px-1.5 py-0.5 rounded font-semibold border ${
                    activeRole === 'admin'
                      ? 'bg-purple-50 text-purple-700 border-purple-200'
                      : 'bg-orange-50 text-orange-600 border border-orange-200'
                  }`}>
                    {activeRole === 'admin' ? 'HQ Admin Operations' : profile.homeCity}
                  </span>
                </div>

                {activeRole === 'admin' && (
                  <button
                    onClick={() => {
                      openAdminPortal();
                      setProfileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 p-2 rounded-xl text-xs font-bold text-purple-700 hover:bg-purple-50 transition-colors"
                  >
                    <ShieldCheck className="w-4 h-4 text-purple-600" />
                    <span>Admin Operations Portal</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setActiveTab('profile');
                    setProfileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 p-2 rounded-xl text-xs font-semibold text-zinc-700 hover:bg-zinc-100 transition-colors"
                >
                  <User className="w-4 h-4 text-orange-500" />
                  <span>My Passport & Profile</span>
                </button>

                <button
                  onClick={() => {
                    signOut();
                    setProfileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 p-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
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

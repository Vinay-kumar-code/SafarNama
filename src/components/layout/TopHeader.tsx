import React, { useState, useRef, useEffect } from 'react';
import { 
  Compass, 
  WifiOff, 
  ShieldCheck, 
  UserCheck, 
  LogIn, 
  UserPlus, 
  LogOut, 
  User as UserIcon, 
  ChevronDown, 
  Settings, 
  Sparkles,
  CloudCheck,
  CheckCircle2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { isSupabaseConfigured } from '../../lib/supabase';

export const TopHeader: React.FC = () => {
  const { activeRole, switchRole, isOffline, currentUser, setActiveTab } = useApp();
  const { 
    isAuthenticated, 
    user, 
    profile, 
    openAuthModal, 
    openOnboarding, 
    signOut, 
    isOfflineDemo 
  } = useAuth();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  const handleSignOut = async () => {
    setDropdownOpen(false);
    await signOut();
  };

  const handleOpenProfile = () => {
    setDropdownOpen(false);
    setActiveTab('profile');
  };

  const handleOpenOnboarding = () => {
    setDropdownOpen(false);
    openOnboarding();
  };

  return (
    <header className="md:hidden sticky top-0 z-40 bg-[#090a0f]/95 backdrop-blur-md border-b border-white/10 px-4 py-2.5 flex items-center justify-between">
      {/* Brand Logo & Hindi Typography */}
      <div 
        onClick={() => setActiveTab('feed')} 
        className="flex items-center gap-2.5 cursor-pointer group"
      >
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 via-orange-500 to-amber-400 flex items-center justify-center shadow-lg shadow-orange-500/20 text-white font-bold text-lg group-hover:scale-105 transition-transform">
          <Compass className="w-5 h-5 text-white animate-spin-slow" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-orange-200 bg-clip-text text-transparent">
              SafarNama
            </span>
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 font-medium border border-orange-500/30">
              सफ़रनामा
            </span>
          </div>
          <p className="text-[10px] text-slate-400 -mt-0.5 font-medium">Authentic India • Map-First</p>
        </div>
      </div>

      {/* Action Indicators & Auth Controls */}
      <div className="flex items-center gap-2">
        {/* Offline indicator for remote Indian mountain zones */}
        {isOffline && (
          <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 text-[11px] font-semibold animate-pulse">
            <WifiOff className="w-3 h-3" />
            <span>Offline</span>
          </div>
        )}

        {/* Dual-Identity Mode Switcher */}
        <button
          onClick={() => switchRole(activeRole === 'traveler' ? 'local_guide' : 'traveler')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold transition-all border shadow-sm ${
            activeRole === 'local_guide'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-400/50 shadow-emerald-500/20 ring-2 ring-emerald-500/30'
              : 'bg-slate-800/90 text-slate-300 hover:text-white border-slate-700 hover:border-slate-600'
          }`}
          title="Switch between Traveler Passport and Local Guide Profile"
        >
          {activeRole === 'local_guide' ? (
            <>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
              <span className="hidden xs:inline">Guide Mode</span>
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping" />
            </>
          ) : (
            <>
              <UserCheck className="w-3.5 h-3.5 text-orange-400" />
              <span className="hidden xs:inline">Traveler</span>
              <span className="text-[10px] px-1 rounded bg-slate-700 text-slate-300">Switch</span>
            </>
          )}
        </button>

        {/* AUTH CONTROLS */}
        {isAuthenticated ? (
          /* User Avatar + Dropdown */
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-1.5 p-0.5 rounded-full bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 hover:border-orange-500/50 transition-all focus:outline-none"
              title="Account Menu"
            >
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.fullName}
                className={`w-7 h-7 rounded-full object-cover border ${
                  activeRole === 'local_guide' ? 'border-emerald-400' : 'border-orange-400'
                }`}
              />
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 pr-0.5" />
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden py-1.5 z-50 animate-fadeIn">
                {/* User info header */}
                <div className="px-3.5 py-3 border-b border-white/10 bg-slate-950/60">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={currentUser.avatarUrl}
                      alt={currentUser.fullName}
                      className="w-9 h-9 rounded-xl object-cover border border-white/10"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-white truncate">
                        {currentUser.fullName}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        @{currentUser.username}
                      </p>
                    </div>
                  </div>

                  {/* Badges row */}
                  <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      activeRole === 'local_guide'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                    }`}>
                      {activeRole === 'local_guide' ? 'Verified Guide' : 'Traveler Passport'}
                    </span>

                    {isSupabaseConfigured && !isOfflineDemo ? (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                        <span>Supabase Live</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        <span>Offline Demo</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Menu items */}
                <div className="p-1 space-y-0.5">
                  <button
                    onClick={handleOpenProfile}
                    className="w-full px-3 py-2 text-left text-xs font-medium text-slate-200 hover:text-white hover:bg-slate-800/80 rounded-xl transition-colors flex items-center gap-2.5"
                  >
                    <UserIcon className="w-3.5 h-3.5 text-orange-400" />
                    <span>View Digital Passport</span>
                  </button>

                  <button
                    onClick={handleOpenOnboarding}
                    className="w-full px-3 py-2 text-left text-xs font-medium text-slate-200 hover:text-white hover:bg-slate-800/80 rounded-xl transition-colors flex items-center gap-2.5"
                  >
                    <Settings className="w-3.5 h-3.5 text-slate-400" />
                    <span>Edit Profile & Avatar</span>
                  </button>

                  <button
                    onClick={() => {
                      switchRole(activeRole === 'traveler' ? 'local_guide' : 'traveler');
                      setDropdownOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left text-xs font-medium text-slate-200 hover:text-white hover:bg-slate-800/80 rounded-xl transition-colors flex items-center gap-2.5"
                  >
                    {activeRole === 'traveler' ? (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Switch to Local Guide Mode</span>
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-3.5 h-3.5 text-orange-400" />
                        <span>Switch to Traveler Passport</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Sign out */}
                <div className="p-1 pt-1 border-t border-white/10">
                  <button
                    onClick={handleSignOut}
                    className="w-full px-3 py-2 text-left text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors flex items-center gap-2.5"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Sign In / Sign Up Buttons */
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => openAuthModal('signin')}
              className="px-2.5 py-1.5 rounded-full text-xs font-bold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 transition-colors flex items-center gap-1"
            >
              <LogIn className="w-3.5 h-3.5 text-orange-400" />
              <span>Sign In</span>
            </button>

            <button
              onClick={() => openAuthModal('signup')}
              className="px-3 py-1.5 rounded-full text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 shadow-md shadow-orange-500/20 transition-all flex items-center gap-1"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Up</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

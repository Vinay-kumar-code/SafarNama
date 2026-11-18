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
import { BrandLogo } from '../common/BrandLogo';

export const TopHeader: React.FC = () => {
  const { activeRole, switchRole, isOffline, currentUser, setActiveTab } = useApp();
  const { 
    isAuthenticated, 
    user, 
    profile, 
    openAuthModal, 
    openOnboarding, 
    signOut, 
    openAdminPortal,
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
    <header className="md:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-zinc-200 px-4 py-2.5 flex items-center justify-between text-zinc-900 shadow-xs">
      {/* Brand logo and wordmark */}
      <div 
        onClick={() => setActiveTab('feed')} 
        className="flex items-center gap-2.5 cursor-pointer group"
      >
        <BrandLogo size="md" glow animated className="group-hover:scale-105 transition-transform" />
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-lg tracking-tight text-zinc-900">
              SafarNama
            </span>
          </div>
          <p className="text-[10px] text-zinc-500 -mt-0.5 font-medium">Authentic India • Map-First</p>
        </div>
      </div>

      {/* Action Indicators & Auth Controls */}
      <div className="flex items-center gap-2">
        {/* Offline indicator for remote Indian mountain zones */}
        {isOffline && (
          <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-full bg-red-50 border border-red-200 text-red-600 text-[11px] font-semibold animate-pulse">
            <WifiOff className="w-3 h-3" />
            <span>Offline</span>
          </div>
        )}

        {/* Dual-Identity Mode Switcher */}
        <button
          onClick={() => switchRole(activeRole === 'traveler' ? 'local_guide' : 'traveler')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold transition-all border shadow-xs ${
            activeRole === 'local_guide'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-500 shadow-emerald-500/20 ring-2 ring-emerald-500/30'
              : 'bg-zinc-100 text-zinc-700 hover:text-zinc-900 border-zinc-200 hover:bg-zinc-200/70'
          }`}
          title="Switch between Traveler Passport and Local Guide Profile"
        >
          {activeRole === 'local_guide' ? (
            <>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-200" />
              <span className="hidden xs:inline">Guide Mode</span>
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping" />
            </>
          ) : (
            <>
              <UserCheck className="w-3.5 h-3.5 text-orange-500" />
              <span className="hidden xs:inline">Traveler</span>
              <span className="text-[10px] px-1 rounded bg-zinc-200 text-zinc-700">Switch</span>
            </>
          )}
        </button>

        {/* AUTH CONTROLS */}
        {isAuthenticated ? (
          /* User Avatar + Dropdown */
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-1.5 p-0.5 rounded-full bg-white hover:bg-zinc-50 border border-zinc-200 hover:border-orange-500/50 transition-all focus:outline-none"
              title="Account Menu"
            >
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.fullName}
                className={`w-7 h-7 rounded-full object-cover border ${
                  activeRole === 'local_guide' ? 'border-emerald-500' : 'border-orange-500'
                }`}
              />
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400 pr-0.5" />
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-zinc-200 rounded-2xl shadow-2xl overflow-hidden py-1.5 z-50 animate-fadeIn">
                {/* User info header */}
                <div className="px-3.5 py-3 border-b border-zinc-100 bg-zinc-50/80">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={currentUser.avatarUrl}
                      alt={currentUser.fullName}
                      className="w-9 h-9 rounded-xl object-cover border border-zinc-200"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-zinc-900 truncate">
                        {currentUser.fullName}
                      </p>
                      <p className="text-[11px] text-zinc-500 truncate">
                        @{currentUser.username}
                      </p>
                    </div>
                  </div>

                  {/* Badges row */}
                  <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      activeRole === 'admin'
                        ? 'bg-purple-50 text-purple-700 border border-purple-200'
                        : activeRole === 'local_guide'
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                        : 'bg-orange-50 text-orange-600 border border-orange-200'
                    }`}>
                      {activeRole === 'admin' ? 'Admin HQ' : activeRole === 'local_guide' ? 'Verified Guide' : 'Traveler Passport'}
                    </span>

                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>{activeRole === 'admin' ? 'HQ Operations' : 'Active Member'}</span>
                    </span>
                  </div>
                </div>

                {/* Menu items */}
                <div className="p-1 space-y-0.5">
                  {activeRole === 'admin' && (
                    <button
                      onClick={() => {
                        openAdminPortal();
                        setDropdownOpen(false);
                      }}
                      className="w-full px-3 py-2 text-left text-xs font-bold text-purple-700 hover:text-purple-900 hover:bg-purple-50 rounded-xl transition-colors flex items-center gap-2.5"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                      <span>Admin Operations Portal</span>
                    </button>
                  )}

                  <button
                    onClick={handleOpenProfile}
                    className="w-full px-3 py-2 text-left text-xs font-medium text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-colors flex items-center gap-2.5"
                  >
                    <UserIcon className="w-3.5 h-3.5 text-orange-500" />
                    <span>View Digital Passport</span>
                  </button>

                  <button
                    onClick={handleOpenOnboarding}
                    className="w-full px-3 py-2 text-left text-xs font-medium text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-colors flex items-center gap-2.5"
                  >
                    <Settings className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Edit Profile & Avatar</span>
                  </button>

                  <button
                    onClick={() => {
                      switchRole(activeRole === 'traveler' ? 'local_guide' : 'traveler');
                      setDropdownOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left text-xs font-medium text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-colors flex items-center gap-2.5"
                  >
                    {activeRole === 'traveler' ? (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Switch to Local Guide Mode</span>
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-3.5 h-3.5 text-orange-500" />
                        <span>Switch to Traveler Passport</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Sign out */}
                <div className="p-1 pt-1 border-t border-zinc-100">
                  <button
                    onClick={handleSignOut}
                    className="w-full px-3 py-2 text-left text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-2.5"
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
              className="px-2.5 py-1.5 rounded-full text-xs font-bold text-zinc-700 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 transition-colors flex items-center gap-1"
            >
              <LogIn className="w-3.5 h-3.5 text-orange-500" />
              <span>Sign In</span>
            </button>

            <button
              onClick={() => openAuthModal('signup')}
              className="px-3 py-1.5 rounded-full text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 shadow-sm shadow-orange-500/20 transition-all flex items-center gap-1"
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

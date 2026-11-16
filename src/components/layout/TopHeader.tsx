import React from 'react';
import { Compass, WifiOff, ShieldCheck, Sparkles, UserCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const TopHeader: React.FC = () => {
  const { activeRole, switchRole, isOffline, currentUser } = useApp();

  return (
    <header className="sticky top-0 z-40 bg-[#090a0f]/90 backdrop-blur-md border-b border-white/10 px-4 py-2.5 flex items-center justify-between">
      {/* Brand Logo & Hindi Typography */}
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 via-orange-500 to-amber-400 flex items-center justify-center shadow-lg shadow-orange-500/20 text-white font-bold text-lg">
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

      {/* Action Indicators */}
      <div className="flex items-center gap-2">
        {/* Offline indicator for remote Indian mountain zones */}
        {isOffline && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 text-[11px] font-semibold animate-pulse">
            <WifiOff className="w-3 h-3" />
            <span>Offline Cache</span>
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
              <span>Guide Mode</span>
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping" />
            </>
          ) : (
            <>
              <UserCheck className="w-3.5 h-3.5 text-orange-400" />
              <span>Traveler</span>
              <span className="text-[10px] px-1 rounded bg-slate-700 text-slate-300">Switch</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};

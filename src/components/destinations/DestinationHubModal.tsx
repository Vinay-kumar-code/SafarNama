import React from 'react';
import { 
  X, 
  MapPin, 
  Sun, 
  CloudRain, 
  Snowflake, 
  FileCheck, 
  PhoneCall, 
  ShieldAlert, 
  Sparkles, 
  Compass, 
  HeartHandshake,
  Wifi,
  IndianRupee,
  Building2,
  ExternalLink
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatINR } from '../../lib/utils';
import { MOCK_SPONSORED_STAYS } from '../../data/mockData';

export const DestinationHubModal: React.FC = () => {
  const { activeDestination, setActiveDestination, openSpotOnMap } = useApp();

  if (!activeDestination) return null;

  const relevantStays = MOCK_SPONSORED_STAYS.filter(
    s => s.destinationId === activeDestination.id
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-xl max-h-[92vh] bg-[#0d0f17] border border-white/10 rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col my-auto">
        
        {/* Sticky Header */}
        <div className="relative h-56 w-full shrink-0">
          <img
            src={activeDestination.coverImage}
            alt={activeDestination.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d0f17] via-[#0d0f17]/40 to-transparent" />

          <button
            onClick={() => setActiveDestination(null)}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center border border-white/20 hover:bg-black/80 transition-all z-10"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="absolute bottom-3 left-5 right-5">
            <span className="px-2.5 py-0.5 rounded-full bg-orange-500/90 text-white text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 shadow">
              <Sparkles className="w-3 h-3" />
              Official Master Hub
            </span>
            <h2 className="text-2xl font-black text-white mt-1 leading-tight">
              {activeDestination.name}
            </h2>
            <p className="text-xs text-orange-300 font-medium">
              {activeDestination.region} • {activeDestination.state}
            </p>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto p-5 space-y-5 no-scrollbar">
          
          {/* Tagline & Overview */}
          <div>
            <p className="text-xs font-semibold text-slate-300 italic">
              "{activeDestination.tagline}"
            </p>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              {activeDestination.overview}
            </p>
          </div>

          {/* Quick Hub Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-900/80 p-3 rounded-2xl border border-white/5">
              <span className="text-[10px] text-slate-400 block">Est. Daily Budget</span>
              <span className="text-sm font-bold text-emerald-400">
                {formatINR(activeDestination.estimatedDailyBudgetInr)} / day
              </span>
            </div>
            <div className="bg-slate-900/80 p-3 rounded-2xl border border-white/5">
              <span className="text-[10px] text-slate-400 block">Verified Local Guides</span>
              <span className="text-sm font-bold text-orange-400">
                {activeDestination.guideCount} Guides Active
              </span>
            </div>
          </div>

          {/* Seasonal Weather */}
          <div className="bg-slate-900/90 rounded-2xl p-4 border border-white/10 space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span>Seasonal Weather & Best Time</span>
            </h4>
            <p className="text-xs text-slate-300 leading-snug">
              <span className="font-semibold text-amber-400">Prime Season:</span> {activeDestination.bestTimeToVisit}
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div className="bg-slate-800/60 p-2 rounded-xl text-slate-300">
                <span className="text-[10px] text-slate-400 block">Summer</span>
                <span>{activeDestination.seasonalWeather.summer}</span>
              </div>
              <div className="bg-slate-800/60 p-2 rounded-xl text-slate-300">
                <span className="text-[10px] text-slate-400 block">Winter</span>
                <span>{activeDestination.seasonalWeather.winter}</span>
              </div>
            </div>
          </div>

          {/* Permits Required */}
          {activeDestination.permitsRequired && (
            <div className="bg-slate-900/90 rounded-2xl p-4 border border-white/10 space-y-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-blue-400" />
                <span>Permits & Entry Documentation</span>
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                {activeDestination.permitsRequired}
              </p>
            </div>
          )}

          {/* Cultural Etiquette for Foreign & Domestic Explorers */}
          {activeDestination.culturalEtiquette && (
            <div className="bg-emerald-950/20 rounded-2xl p-4 border border-emerald-500/20 space-y-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <HeartHandshake className="w-3.5 h-3.5 text-emerald-400" />
                <span>Cultural Etiquette & Respect</span>
              </h4>
              <p className="text-xs text-emerald-200/90 leading-relaxed">
                {activeDestination.culturalEtiquette}
              </p>
            </div>
          )}

          {/* Scam Alerts */}
          {activeDestination.scamAlerts && (
            <div className="bg-rose-950/20 rounded-2xl p-4 border border-rose-500/20 space-y-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                <span>Tourist Advisory & Scam Alerts</span>
              </h4>
              <p className="text-xs text-rose-200/90 leading-relaxed">
                {activeDestination.scamAlerts}
              </p>
            </div>
          )}

          {/* Emergency Contacts */}
          <div className="bg-slate-900/90 rounded-2xl p-4 border border-white/10 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <PhoneCall className="w-3.5 h-3.5 text-red-400" />
              <span>Emergency & Tourist Helplines</span>
            </h4>
            <div className="space-y-1 text-xs text-slate-300">
              <p><span className="text-slate-400">Police / Tourist Police:</span> <span className="font-mono font-bold text-white">{activeDestination.emergencyContacts.police}</span></p>
              <p><span className="text-slate-400">Medical:</span> <span className="font-mono font-bold text-white">{activeDestination.emergencyContacts.medical}</span></p>
              {activeDestination.emergencyContacts.touristHelpline && (
                <p><span className="text-slate-400">24x7 Tourism Line:</span> <span className="font-mono font-bold text-white">{activeDestination.emergencyContacts.touristHelpline}</span></p>
              )}
            </div>
          </div>

          {/* Connectivity Info */}
          <div className="bg-slate-900/90 rounded-2xl p-4 border border-white/10 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Wifi className="w-3.5 h-3.5 text-teal-400" />
              <span>Cellular Coverage in the Circuit</span>
            </h4>
            <div className="grid grid-cols-3 gap-2 text-[11px] text-center">
              <div className="bg-slate-800/60 p-2 rounded-xl">
                <span className="font-bold text-white block">Jio</span>
                <span className="text-slate-400 text-[10px]">{activeDestination.connectivityInfo.jio}</span>
              </div>
              <div className="bg-slate-800/60 p-2 rounded-xl">
                <span className="font-bold text-white block">Airtel</span>
                <span className="text-slate-400 text-[10px]">{activeDestination.connectivityInfo.airtel}</span>
              </div>
              <div className="bg-slate-800/60 p-2 rounded-xl">
                <span className="font-bold text-white block">BSNL</span>
                <span className="text-slate-400 text-[10px]">{activeDestination.connectivityInfo.bsnl}</span>
              </div>
            </div>
          </div>

          {/* Map Button */}
          <button
            onClick={() => {
              const lat = activeDestination.latitude;
              const lng = activeDestination.longitude;
              const name = activeDestination.name;
              setActiveDestination(null);
              openSpotOnMap(lat, lng, name);
            }}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25"
          >
            <Compass className="w-4 h-4" />
            <span>Open {activeDestination.name} on Discovery Map</span>
          </button>

        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { X, ExternalLink, ShieldCheck, Tag, ShoppingBag } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatINR } from '../../lib/utils';

export const GearShopModal: React.FC = () => {
  const { activeGearModal, setActiveGearModal } = useApp();

  if (!activeGearModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-[#11131a] border border-white/10 rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl animate-slide-up">
        {/* Header */}
        <div className="relative h-48 w-full bg-slate-900 overflow-hidden">
          <img
            src={activeGearModal.imageUrl}
            alt={activeGearModal.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#11131a] via-[#11131a]/40 to-transparent" />
          
          <button
            onClick={() => setActiveGearModal(null)}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center border border-white/20 hover:bg-black/80"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="absolute bottom-3 left-4">
            <span className="px-2.5 py-1 rounded-full bg-orange-500/90 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md">
              <Tag className="w-3 h-3" />
              {activeGearModal.category}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div>
            <p className="text-xs font-semibold text-orange-400 uppercase tracking-wider">
              {activeGearModal.brand}
            </p>
            <h3 className="text-xl font-bold text-white mt-0.5">
              {activeGearModal.name}
            </h3>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-black text-amber-400">
                {formatINR(activeGearModal.priceInr)}
              </span>
              <span className="text-xs text-slate-400">MRP incl. all Indian taxes</span>
            </div>
          </div>

          {/* Value props */}
          <div className="bg-slate-900/80 rounded-2xl p-3.5 border border-white/5 space-y-2">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Recommended & field-tested by Local Himalayan & Ghat Guides</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <ShoppingBag className="w-4 h-4 text-orange-400 shrink-0" />
              <span>Contextual gear tag • Native non-intrusive travel equipment</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex gap-3">
            <a
              href={activeGearModal.affiliateUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 transition-all"
            >
              <span>View On Store</span>
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              onClick={() => setActiveGearModal(null)}
              className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

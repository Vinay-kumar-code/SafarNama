import React, { useEffect, useState } from 'react';
import { Sparkles, RefreshCw, X } from 'lucide-react';
import { checkOTAUpdate, applyOTAUpdate, OTAManifest } from '../../services/otaUpdater';

export const OTABanner: React.FC = () => {
  const [availableManifest, setAvailableManifest] = useState<OTAManifest | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Run on app start
    checkOTAUpdate().then(({ updateAvailable, manifest }) => {
      if (updateAvailable && manifest) {
        setAvailableManifest(manifest);
      }
    });
  }, []);

  if (!availableManifest || dismissed) return null;

  const handleApply = async () => {
    setIsApplying(true);
    await applyOTAUpdate(availableManifest);
  };

  return (
    <div className="fixed top-14 inset-x-3 z-50 animate-slide-down">
      <div className="max-w-md mx-auto p-3 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-xl border border-white/20 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-black/20 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-amber-200" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold leading-tight truncate">
              Update v{availableManifest.version} Ready
            </p>
            <p className="text-[10px] text-amber-100/90 truncate">
              {availableManifest.releaseNotes || 'Tap to update app seamlessly'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleApply}
            disabled={isApplying}
            className="px-2.5 py-1.5 rounded-xl bg-white text-orange-600 text-xs font-black shadow-md flex items-center gap-1 hover:bg-amber-50 active:scale-95 transition-all"
          >
            <RefreshCw className={`w-3 h-3 ${isApplying ? 'animate-spin' : ''}`} />
            <span>{isApplying ? 'Updating...' : 'Reload'}</span>
          </button>
          
          <button
            onClick={() => setDismissed(true)}
            className="p-1 rounded-lg text-white/70 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

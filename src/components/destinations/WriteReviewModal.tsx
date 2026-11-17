import React, { useState } from 'react';
import { 
  X, 
  Star, 
  Sparkles, 
  MapPin, 
  Camera, 
  Calendar, 
  Users, 
  Lightbulb, 
  CheckCircle2, 
  AlertCircle,
  Plus,
  Trash2,
  Loader2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../../context/AppContext';
import { DESTINATION_HUBS } from '../../data/mockData';
import { DestinationHub } from '../../types';

interface WriteReviewModalProps {
  destination?: DestinationHub | null;
  isOpen?: boolean;
  onClose?: () => void;
}

const SAMPLE_PHOTO_PRESETS: Record<string, string[]> = {
  'dest-spiti': [
    'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=800&auto=format&fit=crop&q=80'
  ],
  'dest-varanasi': [
    'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1609949279532-a5416df0c5b0?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1571536802807-30451e3955d8?w=800&auto=format&fit=crop&q=80'
  ],
  'dest-meghalaya': [
    'https://images.unsplash.com/photo-1598091383021-15ddea10925d?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1622308644420-b20142dc993c?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1608889825103-eb5ed706fc64?w=800&auto=format&fit=crop&q=80'
  ],
  'dest-old-delhi': [
    'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?w=800&auto=format&fit=crop&q=80'
  ],
  'dest-hampi': [
    'https://images.unsplash.com/photo-1600100397608-f010f4439c20?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?w=800&auto=format&fit=crop&q=80'
  ]
};

const VISIT_MONTH_OPTIONS = [
  'February 2026',
  'January 2026',
  'December 2025',
  'November 2025',
  'October 2025',
  'September 2025',
  'August 2025',
  'July 2025',
  'June 2025',
  'May 2025',
  'April 2025',
  'March 2025'
];

export const WriteReviewModal: React.FC<WriteReviewModalProps> = ({
  destination: propDest,
  isOpen: propIsOpen,
  onClose: propOnClose
}) => {
  const { 
    isWriteReviewModalOpen, 
    closeWriteReviewModal, 
    reviewTargetDestination,
    activeDestination,
    addDestinationReview,
    currentUser
  } = useApp();

  const isModalOpen = propIsOpen !== undefined ? propIsOpen : isWriteReviewModalOpen;
  const currentDest = propDest || reviewTargetDestination || activeDestination || DESTINATION_HUBS[0];

  const [selectedDestId, setSelectedDestId] = useState<string>(currentDest.id);
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [title, setTitle] = useState<string>('');
  const [reviewText, setReviewText] = useState<string>('');
  const [travelTips, setTravelTips] = useState<string>('');
  const [visitMonth, setVisitMonth] = useState<string>(VISIT_MONTH_OPTIONS[1]); // e.g. January 2026
  const [travelType, setTravelType] = useState<'Solo' | 'Family' | 'Couple' | 'Friends'>('Solo');
  const [photos, setPhotos] = useState<string[]>([]);
  const [customPhotoUrl, setCustomPhotoUrl] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isModalOpen) return null;

  const targetDestination = DESTINATION_HUBS.find(d => d.id === selectedDestId) || currentDest;

  const handleClose = () => {
    if (propOnClose) {
      propOnClose();
    } else {
      closeWriteReviewModal();
    }
  };

  const getRatingLabel = (val: number) => {
    switch (val) {
      case 1: return '1 - Poor (Difficult experience / Not recommended)';
      case 2: return '2 - Fair (Needs major preparation)';
      case 3: return '3 - Average (Decent trip with mixed experiences)';
      case 4: return '4 - Very Good (Highly enjoyable & memorable)';
      case 5: return '5 - Exceptional (Must-visit Indian bucket list!)';
      default: return 'Select your rating';
    }
  };

  const handleAddPhotoUrl = () => {
    if (!customPhotoUrl.trim()) return;
    if (photos.includes(customPhotoUrl.trim())) return;
    setPhotos(prev => [...prev, customPhotoUrl.trim()]);
    setCustomPhotoUrl('');
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddPresetPhoto = (url: string) => {
    if (photos.includes(url)) return;
    setPhotos(prev => [...prev, url]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!title.trim()) {
      setErrorMsg('Please provide a catchy title for your review.');
      return;
    }

    if (!reviewText.trim() || reviewText.trim().length < 20) {
      setErrorMsg('Please write at least a couple sentences (20+ characters) describing your experience.');
      return;
    }

    try {
      setIsSubmitting(true);

      await addDestinationReview({
        destinationId: targetDestination.id,
        destinationName: targetDestination.name,
        rating,
        title: title.trim(),
        reviewText: reviewText.trim(),
        photos: photos.length > 0 ? photos : undefined,
        visitMonth,
        travelType,
        travelTips: travelTips.trim() ? travelTips.trim() : undefined,
      });

      // Joyful confetti celebration
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (_err) {
        // Safe fallback if confetti canvas cannot instantiate
      }

      // Reset form state
      setTitle('');
      setReviewText('');
      setTravelTips('');
      setPhotos([]);
      setIsSubmitting(false);

      handleClose();
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMsg(err?.message || 'Failed to submit review. Please try again.');
    }
  };

  const presets = SAMPLE_PHOTO_PRESETS[targetDestination.id] || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl max-h-[92vh] bg-[#0d0f17] border border-white/15 rounded-3xl shadow-2xl flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white leading-tight">
                Write a Ground Review
              </h3>
              <p className="text-xs text-orange-400 font-medium flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span>{targetDestination.name}</span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400">{targetDestination.state}</span>
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 space-y-5 no-scrollbar flex-1">
          
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Destination Selector if multiple available */}
          <div>
            <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
              Select Destination
            </label>
            <select
              value={selectedDestId}
              onChange={(e) => setSelectedDestId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-white/10 text-white text-xs font-semibold focus:outline-none focus:border-orange-500 transition-all"
            >
              {DESTINATION_HUBS.map(dest => (
                <option key={dest.id} value={dest.id} className="bg-slate-900 text-white">
                  {dest.name} ({dest.region}, {dest.state})
                </option>
              ))}
            </select>
          </div>

          {/* Interactive Star Rating */}
          <div className="bg-slate-900/90 rounded-2xl p-4 border border-white/5 space-y-2">
            <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
              Overall Experience Rating <span className="text-orange-400">*</span>
            </label>
            
            <div className="flex items-center gap-2 pt-1">
              {[1, 2, 3, 4, 5].map((star) => {
                const isFilled = (hoverRating || rating) >= star;
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1.5 focus:outline-none transition-transform hover:scale-125"
                  >
                    <Star
                      className={`w-7 h-7 transition-all ${
                        isFilled
                          ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                          : 'text-slate-600 hover:text-slate-400'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
            
            <p className="text-xs font-medium text-amber-300/90">
              {getRatingLabel(hoverRating || rating)}
            </p>
          </div>

          {/* Review Title */}
          <div>
            <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
              Review Headline <span className="text-orange-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Unearthly landscapes, but prepare carefully for AMS!"
              maxLength={100}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-orange-500 transition-all font-medium"
            />
          </div>

          {/* Review Body */}
          <div>
            <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
              Your Experience & Ground Story <span className="text-orange-400">*</span>
            </label>
            <textarea
              rows={4}
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="What made this trip memorable? Describe road conditions, local interactions, food, or unexpected moments..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-orange-500 transition-all leading-relaxed"
            />
          </div>

          {/* Travel Tips Callout */}
          <div className="bg-amber-950/20 rounded-2xl p-4 border border-amber-500/20 space-y-2">
            <label className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5" />
              <span>Traveler Pro-Tips & Ground Wisdom (Optional)</span>
            </label>
            <textarea
              rows={2}
              value={travelTips}
              onChange={(e) => setTravelTips(e.target.value)}
              placeholder="e.g. Carry cash as ATMs run dry in Kaza; negotiate boat fares at Dashashwamedh early morning."
              className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-amber-500/30 text-amber-100 text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-400 transition-all"
            />
          </div>

          {/* Travel Context: Month & Travel Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                <span>Month of Visit</span>
              </label>
              <select
                value={visitMonth}
                onChange={(e) => setVisitMonth(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-white/10 text-white text-xs font-semibold focus:outline-none focus:border-orange-500 transition-all"
              >
                {VISIT_MONTH_OPTIONS.map(month => (
                  <option key={month} value={month} className="bg-slate-900 text-white">
                    {month}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-teal-400" />
                <span>Travel Type</span>
              </label>
              <div className="grid grid-cols-4 gap-1">
                {(['Solo', 'Couple', 'Family', 'Friends'] as const).map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setTravelType(type)}
                    className={`py-2 px-1 rounded-xl text-[11px] font-bold transition-all border ${
                      travelType === type
                        ? 'bg-orange-500 text-white border-orange-400 shadow-sm'
                        : 'bg-slate-800/70 text-slate-400 border-white/5 hover:text-white'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Photos Section */}
          <div className="bg-slate-900/90 rounded-2xl p-4 border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-orange-400" />
                <span>Add Ground Photos</span>
              </label>
              <span className="text-[10px] text-slate-400">
                {photos.length} photo{photos.length !== 1 ? 's' : ''} attached
              </span>
            </div>

            {/* Custom URL input */}
            <div className="flex gap-2">
              <input
                type="url"
                value={customPhotoUrl}
                onChange={(e) => setCustomPhotoUrl(e.target.value)}
                placeholder="Paste direct photo image URL (https://...)"
                className="flex-1 px-3 py-2 rounded-xl bg-slate-800/80 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-orange-500 transition-all"
              />
              <button
                type="button"
                onClick={handleAddPhotoUrl}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-white/10 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>

            {/* Preset Suggestions for convenience */}
            {presets.length > 0 && (
              <div>
                <span className="text-[10px] text-slate-400 block mb-1.5">
                  Or pick verified photo presets from {targetDestination.name}:
                </span>
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {presets.map((url, i) => {
                    const isSelected = photos.includes(url);
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => isSelected ? setPhotos(photos.filter(p => p !== url)) : handleAddPresetPhoto(url)}
                        className={`relative w-16 h-12 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${
                          isSelected ? 'border-orange-500 scale-95 ring-2 ring-orange-500/30' : 'border-white/10 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={url} alt="preset" className="w-full h-full object-cover" />
                        {isSelected && (
                          <div className="absolute inset-0 bg-orange-600/40 flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Selected Photos Gallery */}
            {photos.length > 0 && (
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5">
                {photos.map((url, index) => (
                  <div key={index} className="relative aspect-video rounded-xl overflow-hidden bg-slate-950 border border-white/10 group">
                    <img src={url} alt={`preview-${index}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(index)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-red-600/80 hover:bg-red-600 text-white flex items-center justify-center shadow opacity-90 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Author Badge Info */}
          <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-slate-900/60 border border-white/5 text-xs text-slate-400">
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.fullName}
              className="w-6 h-6 rounded-full object-cover border border-orange-500/40"
            />
            <span>Posting as <strong className="text-white">@{currentUser.username}</strong> ({currentUser.activeRole === 'local_guide' ? 'Verified Local Guide' : 'Traveler Passport'})</span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-white/10 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-2 py-3 px-5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-xs shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting Review...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Submit Ground Review</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

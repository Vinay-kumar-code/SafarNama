import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Check, 
  ShieldCheck, 
  MapPin, 
  Globe, 
  Award, 
  Camera, 
  ArrowRight,
  Plus
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

// Curated avatar presets with authentic Indian explorer themes
const AVATAR_PRESETS = [
  {
    id: 'himalayan',
    title: 'Himalayan Explorer',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'spiti_local',
    title: 'High Altitude Guide',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'ghats_wanderer',
    title: 'Ghats Wanderer',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'heritage_nomad',
    title: 'Heritage Nomad',
    url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'coastal_backpacker',
    title: 'Coastal Backpacker',
    url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&auto=format&fit=crop&q=80',
  },
];

const POPULAR_LANGUAGES = [
  'Hindi', 'English', 'Punjabi', 'Bengali', 'Tamil', 'Telugu', 
  'Kannada', 'Malayalam', 'Marathi', 'Gujarati', 'Bhotia / Ladakhi'
];

const POPULAR_CIRCUITS = [
  'Spiti Valley High Passes',
  'Old Delhi Street Food & Haveli Trails',
  'Living Root Bridges & Meghalaya Caves',
  'Vijayanagara Empire & Hampi Boulders',
  'Varanasi Sacred Ghats & Silk Weavers',
  'Ziro Valley & Apatani Culture',
  'Kinnaur Apple & Monastery Trail',
];

export const OnboardingModal: React.FC = () => {
  const { 
    isOnboardingOpen, 
    closeOnboarding, 
    profile, 
    updateProfile 
  } = useAuth();

  // Form states
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_PRESETS[0].url);
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [activeRole, setActiveRole] = useState<UserRole>('traveler');
  const [homeCity, setHomeCity] = useState('');
  const [bio, setBio] = useState('');
  const [languages, setLanguages] = useState<string[]>(['Hindi', 'English']);
  const [guideCircuits, setGuideCircuits] = useState<string[]>(['Spiti Valley High Passes']);
  const [newCircuitInput, setNewCircuitInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-fill from current profile when modal opens
  useEffect(() => {
    if (profile && isOnboardingOpen) {
      setFullName(profile.fullName || '');
      setUsername(profile.username || '');
      setSelectedAvatar(profile.avatarUrl || AVATAR_PRESETS[0].url);
      setActiveRole(profile.activeRole || 'traveler');
      setHomeCity(profile.homeCity || 'New Delhi, India');
      setBio(profile.bio || 'Exploring authentic India • Map-First Traveler');
      if (profile.languagesSpoken && profile.languagesSpoken.length > 0) {
        setLanguages(profile.languagesSpoken);
      }
      if (profile.guideCircuits && profile.guideCircuits.length > 0) {
        setGuideCircuits(profile.guideCircuits);
      }
    }
  }, [profile, isOnboardingOpen]);

  if (!isOnboardingOpen) return null;

  const toggleLanguage = (lang: string) => {
    setLanguages(prev => 
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    );
  };

  const toggleCircuit = (circuit: string) => {
    setGuideCircuits(prev =>
      prev.includes(circuit) ? prev.filter(c => c !== circuit) : [...prev, circuit]
    );
  };

  const addCustomCircuit = () => {
    if (newCircuitInput.trim() && !guideCircuits.includes(newCircuitInput.trim())) {
      setGuideCircuits([...guideCircuits, newCircuitInput.trim()]);
      setNewCircuitInput('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const finalAvatar = customAvatarUrl.trim() || selectedAvatar;

    await updateProfile({
      fullName: fullName.trim() || profile?.fullName || 'Safar Explorer',
      username: username.trim().replace(/^@/, '') || profile?.username || 'traveler',
      avatarUrl: finalAvatar,
      activeRole,
      homeCity: homeCity.trim() || 'New Delhi, India',
      bio: bio.trim() || 'Exploring authentic India • Map-First Traveler',
      languagesSpoken: languages.length > 0 ? languages : ['Hindi', 'English'],
      isVerifiedGuide: activeRole === 'local_guide',
      guideCircuits: activeRole === 'local_guide' ? guideCircuits : [],
    });

    setIsSubmitting(false);

    // Trigger celebration confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f97316', '#fbbf24', '#10b981', '#38bdf8'],
      });
    } catch {
      // safe fallback if canvas is restricted
    }

    closeOnboarding();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto bg-slate-950 border border-white/10 rounded-3xl shadow-2xl no-scrollbar flex flex-col text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative p-6 pb-4 bg-gradient-to-b from-orange-950/40 via-slate-900 to-transparent border-b border-white/5">
          <button
            onClick={closeOnboarding}
            className="absolute top-5 right-5 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 via-orange-500 to-amber-400 flex items-center justify-center shadow-lg shadow-orange-500/20 text-white font-bold text-xl shrink-0">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-orange-200 bg-clip-text text-transparent">
                  Complete Your Explorer Profile
                </h3>
              </div>
              <p className="text-xs text-orange-400/90 font-medium mt-0.5">
                Set up your SafarNama travel profile
              </p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Section 1: Avatar Selection */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-orange-400" />
              <span>Choose Your Explorer Avatar</span>
            </label>

            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <img
                  src={customAvatarUrl.trim() || selectedAvatar}
                  alt="Avatar Preview"
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-orange-500 shadow-xl"
                />
                <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-orange-500 text-white shadow-md">
                  <Check className="w-3 h-3" />
                </div>
              </div>

              <div className="flex-1 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {AVATAR_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setSelectedAvatar(preset.url);
                      setCustomAvatarUrl('');
                    }}
                    className={`shrink-0 w-12 h-12 rounded-xl overflow-hidden border-2 transition-all ${
                      selectedAvatar === preset.url && !customAvatarUrl
                        ? 'border-orange-500 ring-2 ring-orange-500/30 scale-105'
                        : 'border-white/10 opacity-70 hover:opacity-100'
                    }`}
                    title={preset.title}
                  >
                    <img src={preset.url} alt={preset.title} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Avatar URL option */}
            <input
              type="url"
              value={customAvatarUrl}
              onChange={(e) => setCustomAvatarUrl(e.target.value)}
              placeholder="Or paste custom image URL (https://...)"
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>

          {/* Section 2: Full Name & Username */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Full Name *
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Aarav Sharma"
                required
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Username *
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="aarav_journeys"
                required
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          {/* Section 3: Dual Identity Choice */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Primary SafarNama Mode</span>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <div
                onClick={() => setActiveRole('traveler')}
                className={`cursor-pointer p-3.5 rounded-2xl border transition-all ${
                  activeRole === 'traveler'
                    ? 'bg-orange-500/15 border-orange-500 ring-2 ring-orange-500/30'
                    : 'bg-slate-900 border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">🧳</span>
                  <span className="text-xs font-bold text-white">Traveler Passport</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">
                  Earn digital stamps for visiting high Himalayan passes, coastal ruins, and ancient ghats.
                </p>
              </div>

              <div
                onClick={() => setActiveRole('local_guide')}
                className={`cursor-pointer p-3.5 rounded-2xl border transition-all ${
                  activeRole === 'local_guide'
                    ? 'bg-emerald-500/15 border-emerald-500 ring-2 ring-emerald-500/30'
                    : 'bg-slate-900 border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">🧭</span>
                  <span className="text-xs font-bold text-white">Local Destination Guide</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">
                  Provide verified on-ground road & weather updates, lead tours, and earn credibility.
                </p>
              </div>
            </div>
          </div>

          {/* Section 4: Home City & Bio */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Home Base / City *
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  value={homeCity}
                  onChange={(e) => setHomeCity(e.target.value)}
                  placeholder="e.g. Bengaluru, Karnataka or Kaza, Himachal"
                  required
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Travel Bio & Philosophy
              </label>
              <textarea
                rows={2}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell fellow travelers what drives your journeys..."
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none focus:border-orange-500 resize-none"
              />
            </div>
          </div>

          {/* Section 5: Languages Spoken */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-orange-400" />
              <span>Languages Spoken in India</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_LANGUAGES.map((lang) => {
                const isSelected = languages.includes(lang);
                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => toggleLanguage(lang)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-orange-500 text-white shadow-sm font-bold'
                        : 'bg-slate-900 border border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 inline mr-1" />}
                    {lang}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 6: If Local Guide - Specialized Circuits */}
          {activeRole === 'local_guide' && (
            <div className="space-y-3 p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 animate-fadeIn">
              <label className="block text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-4 h-4 text-emerald-400" />
                <span>Your Verified Destination Circuits</span>
              </label>

              <div className="flex flex-wrap gap-1.5">
                {POPULAR_CIRCUITS.map((circuit) => {
                  const isSelected = guideCircuits.includes(circuit);
                  return (
                    <button
                      key={circuit}
                      type="button"
                      onClick={() => toggleCircuit(circuit)}
                      className={`px-2.5 py-1 rounded-full text-[11px] transition-all ${
                        isSelected
                          ? 'bg-emerald-600 text-white font-bold shadow-sm'
                          : 'bg-slate-900 border border-emerald-500/20 text-slate-400 hover:text-white'
                      }`}
                    >
                      {isSelected ? '✓ ' : '+ '}
                      {circuit}
                    </button>
                  );
                })}
              </div>

              {/* Add Custom Circuit */}
              <div className="flex gap-2 mt-2">
                <input
                  type="text"
                  value={newCircuitInput}
                  onChange={(e) => setNewCircuitInput(e.target.value)}
                  placeholder="Add custom circuit (e.g. Malana Village Trek)"
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-emerald-500/30 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                />
                <button
                  type="button"
                  onClick={addCustomCircuit}
                  className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xl shadow-orange-500/30 transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Saving Profile...</span>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Claim SafarNama Passport & Complete Profile</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

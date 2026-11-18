import React, { useState, useEffect } from 'react';
import { 
  X, 
  Mail, 
  Lock, 
  User, 
  AtSign, 
  MapPin, 
  FileText, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle, 
  ArrowRight, 
  ShieldCheck, 
  Award, 
  Luggage, 
  Key 
} from 'lucide-react';
import { useAuth, AuthPathwayRole, ADMIN_PASSKEY } from '../../context/AuthContext';
import { BrandLogo } from '../common/BrandLogo';

export const AuthModal: React.FC = () => {
  const { 
    isAuthModalOpen, 
    closeAuthModal, 
    authModalMode, 
    authModalRole,
    signIn, 
    signUp, 
    signInWithGoogle, 
    signInWithAdminPasskey,
    loginAsDemoUser,
    isLoading
  } = useAuth();

  // Active pathway (Traveler, Creator / Local Guide, or Admin)
  const [pathway, setPathway] = useState<AuthPathwayRole>(authModalRole || 'traveler');

  // Subtab for Traveler (Sign In vs Create Account)
  const [travelerTab, setTravelerTab] = useState<'signin' | 'signup'>(authModalMode || 'signin');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [homeCity, setHomeCity] = useState('');
  const [bio, setBio] = useState('');

  // Guide Studio specific form
  const [guideEmail, setGuideEmail] = useState('');
  const [guidePassword, setGuidePassword] = useState('');
  const [guideCircuits, setGuideCircuits] = useState('');

  // Admin Portal specific form
  const [adminEmail, setAdminEmail] = useState('admin@safarnama.travel');
  const [adminPasskey, setAdminPasskey] = useState(ADMIN_PASSKEY);
  const [showAdminPasskey, setShowAdminPasskey] = useState(false);

  // Status & error states
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sync state whenever modal is opened with new props
  useEffect(() => {
    if (isAuthModalOpen) {
      if (authModalRole) setPathway(authModalRole);
      if (authModalMode) setTravelerTab(authModalMode);
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [isAuthModalOpen, authModalRole, authModalMode]);

  if (!isAuthModalOpen) return null;

  const resetMessages = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handlePathwayChange = (newPathway: AuthPathwayRole) => {
    setPathway(newPathway);
    resetMessages();
  };

  // Traveler Sign In
  const handleTravelerSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    const res = await signIn(email.trim(), password);
    if (res.error) {
      setErrorMsg(res.error.message || 'Invalid credentials. Please try again.');
    }
  };

  // Traveler Sign Up
  const handleTravelerSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please enter an email and password.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (!fullName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }

    const cleanUsername = username.trim().replace(/^@/, '').toLowerCase() || email.split('@')[0];

    const res = await signUp(email.trim(), password, {
      fullName: fullName.trim(),
      username: cleanUsername,
      role: 'traveler',
      homeCity: homeCity.trim() || 'New Delhi, India',
      bio: bio.trim() || 'Exploring authentic India with SafarNama',
    });

    if (res.error) {
      setErrorMsg(res.error.message || 'Failed to create account. Please try again.');
    } else if (res.needsEmailConfirmation) {
      setSuccessMsg('Account created! Please check your email to confirm your account.');
    }
  };

  // Creator & Local Guide Studio Sign In
  const handleGuideSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    const targetEmail = guideEmail.trim() || 'tenzin.norbu@spiti.guide';
    const targetPassword = guidePassword.trim() || 'guide123';

    const res = await signIn(targetEmail, targetPassword);
    if (res.error) {
      setErrorMsg(res.error.message || 'Invalid Guide Studio credentials.');
    }
  };

  // Admin Portal Sign In
  const handleAdminSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (!adminPasskey.trim()) {
      setErrorMsg('Please enter the Admin Security Passkey.');
      return;
    }

    const res = await signInWithAdminPasskey(adminPasskey.trim());
    if (res.error) {
      setErrorMsg(res.error.message || 'Invalid Admin Security Passkey.');
    }
  };

  const handleGoogleSignIn = async () => {
    resetMessages();
    const res = await signInWithGoogle();
    if (res.error) {
      setErrorMsg(res.error.message || 'Google sign in failed. Please try again.');
    }
  };

  const popularCities = ['New Delhi, DL', 'Bengaluru, KA', 'Mumbai, MH', 'Kaza, HP', 'Varanasi, UP', 'Shillong, ML', 'Jaipur, RJ'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto bg-white border border-slate-200/90 rounded-3xl shadow-2xl flex flex-col text-slate-800 no-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Instagram-Clean Aesthetic */}
        <div className="relative p-6 pb-4 bg-white border-b border-slate-100">
          <button
            onClick={closeAuthModal}
            className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <BrandLogo size="lg" glow animated />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black tracking-tight text-slate-900">
                  SafarNama
                </h3>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Map-First Authentic Travel & Local Guide Community
              </p>
            </div>
          </div>

          {/* 3 Role Login Pathways Switcher */}
          <div className="grid grid-cols-3 gap-1.5 mt-5 p-1 rounded-2xl bg-slate-100 border border-slate-200/60 text-xs">
            {/* Pathway 1: Traveler */}
            <button
              onClick={() => handlePathwayChange('traveler')}
              className={`py-2 px-2 rounded-xl font-bold transition-all flex flex-col items-center justify-center gap-0.5 ${
                pathway === 'traveler'
                  ? 'bg-white text-orange-600 shadow-sm border border-slate-200/60'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Luggage className="w-3.5 h-3.5" />
                <span>Traveler</span>
              </div>
              <span className="text-[9px] font-normal opacity-70">Passport</span>
            </button>

            {/* Pathway 2: Creator & Local Guide */}
            <button
              onClick={() => handlePathwayChange('creator')}
              className={`py-2 px-2 rounded-xl font-bold transition-all flex flex-col items-center justify-center gap-0.5 ${
                pathway === 'creator'
                  ? 'bg-white text-emerald-600 shadow-sm border border-slate-200/60'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5" />
                <span>Guide Studio</span>
              </div>
              <span className="text-[9px] font-normal opacity-70">Creator</span>
            </button>

            {/* Pathway 3: Admin Operations */}
            <button
              onClick={() => handlePathwayChange('admin')}
              className={`py-2 px-2 rounded-xl font-bold transition-all flex flex-col items-center justify-center gap-0.5 ${
                pathway === 'admin'
                  ? 'bg-white text-purple-600 shadow-sm border border-slate-200/60'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin HQ</span>
              </div>
              <span className="text-[9px] font-normal opacity-70">Operations</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {/* Error & Success Messages */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5 animate-fadeIn">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ========================================================================= */}
          {/* PATHWAY 1: TRAVELER SIGN IN / SIGN UP                                     */}
          {/* ========================================================================= */}
          {pathway === 'traveler' && (
            <div className="space-y-4">
              {/* Traveler Mode Switcher (Sign In vs Create Account) */}
              <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                <button
                  type="button"
                  onClick={() => { setTravelerTab('signin'); resetMessages(); }}
                  className={`pb-2 text-xs font-bold border-b-2 transition-all ${
                    travelerTab === 'signin'
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-slate-400 hover:text-slate-700'
                  }`}
                >
                  Sign In to Passport
                </button>
                <button
                  type="button"
                  onClick={() => { setTravelerTab('signup'); resetMessages(); }}
                  className={`pb-2 text-xs font-bold border-b-2 transition-all ${
                    travelerTab === 'signup'
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-slate-400 hover:text-slate-700'
                  }`}
                >
                  Create New Account
                </button>
              </div>

              {/* Google OAuth Quick Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-semibold text-xs flex items-center justify-center gap-2.5 shadow-sm transition-all border border-slate-200 disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Continue with Google</span>
              </button>

              <div className="relative flex items-center justify-center my-2">
                <div className="w-full border-t border-slate-200" />
                <span className="absolute px-3 bg-white text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                  or with email
                </span>
              </div>

              {/* Traveler SIGN IN */}
              {travelerTab === 'signin' && (
                <form onSubmit={handleTravelerSignIn} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Traveler Email
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="aarav@safarnama.travel"
                        required
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-orange-500/20 transition-all disabled:opacity-50"
                  >
                    <span>Sign In to Digital Passport</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  {/* 1-Click Instant Demo Login for Traveler */}
                  <div className="pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => loginAsDemoUser('traveler')}
                      className="w-full p-2.5 rounded-xl bg-orange-50/70 hover:bg-orange-100/70 border border-orange-200 text-left transition-colors flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-lg">🧳</span>
                        <div>
                          <div className="text-xs font-bold text-orange-950 group-hover:text-orange-900">
                            Instant Access: Aarav Sharma (Bengaluru)
                          </div>
                          <div className="text-[10px] text-orange-700/80">Digital Passport • 14 Stamps • 8 States</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-orange-600 text-white">
                        Enter
                      </span>
                    </button>
                  </div>
                </form>
              )}

              {/* Traveler SIGN UP */}
              {travelerTab === 'signup' && (
                <form onSubmit={handleTravelerSignUp} className="space-y-3">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Full Name *
                      </label>
                      <div className="relative">
                        <User className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Priya Verma"
                          required
                          className="w-full pl-8 pr-2.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs focus:bg-white focus:outline-none focus:border-orange-500 transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Username *
                      </label>
                      <div className="relative">
                        <AtSign className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                        <input
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="priya_journeys"
                          required
                          className="w-full pl-8 pr-2.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs focus:bg-white focus:outline-none focus:border-orange-500 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="priya@example.com"
                        required
                        className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs focus:bg-white focus:outline-none focus:border-orange-500 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Password (min 6 characters) *
                    </label>
                    <div className="relative">
                      <Lock className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        minLength={6}
                        className="w-full pl-8 pr-9 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs focus:bg-white focus:outline-none focus:border-orange-500 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Home City
                    </label>
                    <div className="relative">
                      <MapPin className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                      <input
                        type="text"
                        value={homeCity}
                        onChange={(e) => setHomeCity(e.target.value)}
                        placeholder="e.g. Pune, Maharashtra"
                        className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs focus:bg-white focus:outline-none focus:border-orange-500 transition-all"
                      />
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {popularCities.slice(0, 5).map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setHomeCity(c)}
                          className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 transition-colors"
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Travel Bio
                    </label>
                    <div className="relative">
                      <FileText className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                      <textarea
                        rows={2}
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Himalayan pass seeker • Street food enthusiast..."
                        className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs focus:bg-white focus:outline-none focus:border-orange-500 transition-all resize-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-orange-500/20 transition-all disabled:opacity-50"
                  >
                    <span>Create SafarNama Passport</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* PATHWAY 2: CREATOR & LOCAL GUIDE STUDIO                                   */}
          {/* ========================================================================= */}
          {pathway === 'creator' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                    🧭
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-emerald-950">
                      Creator & Local Guide Studio
                    </h4>
                    <p className="text-[10px] text-emerald-700">
                      For certified state guides, sherpas, naturalists & heritage interpreters
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-1.5 pt-1 text-center">
                  <div className="bg-white/80 p-1.5 rounded-lg border border-emerald-100">
                    <span className="text-[10px] font-bold text-emerald-900 block">Verified Badge</span>
                    <span className="text-[9px] text-slate-500">Official circuits</span>
                  </div>
                  <div className="bg-white/80 p-1.5 rounded-lg border border-emerald-100">
                    <span className="text-[10px] font-bold text-emerald-900 block">Lead Tours</span>
                    <span className="text-[9px] text-slate-500">Direct booking</span>
                  </div>
                  <div className="bg-white/80 p-1.5 rounded-lg border border-emerald-100">
                    <span className="text-[10px] font-bold text-emerald-900 block">Credibility</span>
                    <span className="text-[9px] text-slate-500">Upvoted Q&A</span>
                  </div>
                </div>
              </div>

              {/* Guide Sign In Form */}
              <form onSubmit={handleGuideSignIn} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Guide Studio Email / Handle
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      value={guideEmail}
                      onChange={(e) => setGuideEmail(e.target.value)}
                      placeholder="tenzin@spiti.guide"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Studio Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="password"
                      value={guidePassword}
                      onChange={(e) => setGuidePassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
                >
                  <span>Sign In to Creator & Guide Studio</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {/* 1-Click Instant Guide Studio Demo */}
                <div className="pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => loginAsDemoUser('creator')}
                    className="w-full p-2.5 rounded-xl bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-200 text-left transition-colors flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">🧭</span>
                      <div>
                        <div className="text-xs font-bold text-emerald-950 group-hover:text-emerald-900">
                          Instant Access: Tenzin Norbu (Spiti Valley)
                        </div>
                        <div className="text-[10px] text-emerald-700/80">Verified High-Altitude Guide • 38 Tours Led • 980 Score</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-600 text-white">
                      Enter Studio
                    </span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ========================================================================= */}
          {/* PATHWAY 3: ADMIN OPERATIONS PORTAL                                        */}
          {/* ========================================================================= */}
          {pathway === 'admin' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-purple-50/80 border border-purple-200/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-purple-700 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                      🛡️
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-purple-950">
                        Admin Operations & Master Gateway
                      </h4>
                      <p className="text-[10px] text-purple-700">
                        Restricted to SafarNama Platform Operations & Regional Desk
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-200/60 text-purple-900">
                    256-Bit Passkey
                  </span>
                </div>
              </div>

              {/* Admin Sign In Form */}
              <form onSubmit={handleAdminSignIn} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Admin Operations Identity
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="admin@safarnama.travel"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs focus:bg-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 transition-all font-mono"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Master Security Passkey
                    </label>
                    <span className="text-[10px] font-mono font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                      admin2026
                    </span>
                  </div>
                  <div className="relative">
                    <Key className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type={showAdminPasskey ? 'text' : 'password'}
                      value={adminPasskey}
                      onChange={(e) => setAdminPasskey(e.target.value)}
                      placeholder="Enter admin passkey..."
                      required
                      className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs focus:bg-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 transition-all font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminPasskey(!showAdminPasskey)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showAdminPasskey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 hover:from-purple-800 hover:to-indigo-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-purple-700/20 transition-all disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Authorize & Enter Admin Operations Portal</span>
                </button>

                {/* 1-Click Instant Demo Admin Authorization */}
                <div className="pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => loginAsDemoUser('admin')}
                    className="w-full p-2.5 rounded-xl bg-purple-50/70 hover:bg-purple-100/70 border border-purple-200 text-left transition-colors flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">🛡️</span>
                      <div>
                        <div className="text-xs font-bold text-purple-950 group-hover:text-purple-900">
                          Instant Authorization: Chief Operations Officer
                        </div>
                        <div className="text-[10px] text-purple-700/80">HQ Command • Guide Approvals • Master Hub Editor</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-700 text-white">
                      Launch HQ
                    </span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Footer note */}
          <p className="text-[10px] text-center text-slate-400 pt-2 border-t border-slate-100">
            By continuing, you agree to SafarNama's Community Guidelines and Cultural Heritage Preservation code.
          </p>
        </div>
      </div>
    </div>
  );
};

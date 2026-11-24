import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Users, 
  Award, 
  Compass, 
  Flag, 
  CheckCircle, 
  XCircle, 
  Save, 
  AlertTriangle, 
  PhoneCall, 
  FileText, 
  ExternalLink, 
  Activity, 
  Search, 
  Sparkles,
  MapPin,
  TrendingUp,
  Server,
  Check
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { DestinationHub, GuideVerificationRequest, FlaggedContentItem } from '../../types';
import { DESTINATION_HUBS } from '../../data/destinations';
import { getStoredData, setStoredData } from '../../lib/utils';

export const AdminPortal: React.FC = () => {
  const { isAdminPortalOpen, closeAdminPortal, signOut } = useAuth();
  const { setActiveDestination } = useApp();

  // Active Dashboard Tab
  const [activeTab, setActiveTab] = useState<'health' | 'guides' | 'destinations' | 'moderation'>('health');

  // 1. Guides State
  const [guideRequests, setGuideRequests] = useState<GuideVerificationRequest[]>(() => {
    return getStoredData<GuideVerificationRequest[]>('safarnama_guide_requests', []);
  });
  const [guideFilter, setGuideFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [guideSearch, setGuideSearch] = useState('');
  const [guideToast, setGuideToast] = useState<string | null>(null);

  // 2. Destination Master Hubs State
  const [destinations, setDestinations] = useState<DestinationHub[]>(() => {
    return getStoredData<DestinationHub[]>('safarnama_admin_destinations', DESTINATION_HUBS);
  });
  const [selectedDestId, setSelectedDestId] = useState<string>(destinations[0]?.id || 'dest-spiti');
  const [hubSaveToast, setHubSaveToast] = useState<string | null>(null);

  // Form state for current selected destination
  const activeDest = destinations.find(d => d.id === selectedDestId) || destinations[0];
  const [editEmergency, setEditEmergency] = useState({
    police: activeDest?.emergencyContacts?.police || '',
    medical: activeDest?.emergencyContacts?.medical || '',
    disaster: activeDest?.emergencyContacts?.disaster || '',
    touristHelpline: activeDest?.emergencyContacts?.touristHelpline || '',
  });
  const [editPermits, setEditPermits] = useState(activeDest?.permitsRequired || '');
  const [editScamAlerts, setEditScamAlerts] = useState(activeDest?.scamAlerts || '');
  const [editEtiquette, setEditEtiquette] = useState(activeDest?.culturalEtiquette || '');

  // Keep editor in sync when selected destination changes
  const handleSelectDestination = (destId: string) => {
    setSelectedDestId(destId);
    const target = destinations.find(d => d.id === destId);
    if (target) {
      setEditEmergency({
        police: target.emergencyContacts.police || '',
        medical: target.emergencyContacts.medical || '',
        disaster: target.emergencyContacts.disaster || '',
        touristHelpline: target.emergencyContacts.touristHelpline || '',
      });
      setEditPermits(target.permitsRequired || '');
      setEditScamAlerts(target.scamAlerts || '');
      setEditEtiquette(target.culturalEtiquette || '');
    }
  };

  // 3. Moderation State
  const [flaggedItems, setFlaggedItems] = useState<FlaggedContentItem[]>(() => {
    return getStoredData<FlaggedContentItem[]>('safarnama_flagged_content', []);
  });
  const [moderationToast, setModerationToast] = useState<string | null>(null);

  if (!isAdminPortalOpen) return null;

  // Guide Approval Handlers
  const handleApproveGuide = (guideId: string) => {
    const updated = guideRequests.map(g => {
      if (g.id === guideId) {
        return { ...g, status: 'approved' as const };
      }
      return g;
    });
    setGuideRequests(updated);
    setStoredData('safarnama_guide_requests', updated);

    const guide = guideRequests.find(g => g.id === guideId);
    setGuideToast(`Verified Guide badge bestowed on @${guide?.username || 'guide'}!`);
    setTimeout(() => setGuideToast(null), 3500);
  };

  const handleRejectGuide = (guideId: string) => {
    const updated = guideRequests.map(g => {
      if (g.id === guideId) {
        return { ...g, status: 'rejected' as const };
      }
      return g;
    });
    setGuideRequests(updated);
    setStoredData('safarnama_guide_requests', updated);

    const guide = guideRequests.find(g => g.id === guideId);
    setGuideToast(`Application for @${guide?.username || 'guide'} marked as rejected.`);
    setTimeout(() => setGuideToast(null), 3500);
  };

  // Hub Save Handler
  const handleSaveHub = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedList = destinations.map(d => {
      if (d.id === selectedDestId) {
        return {
          ...d,
          emergencyContacts: {
            ...d.emergencyContacts,
            ...editEmergency,
          },
          permitsRequired: editPermits,
          scamAlerts: editScamAlerts,
          culturalEtiquette: editEtiquette,
        };
      }
      return d;
    });
    setDestinations(updatedList);
    setStoredData('safarnama_admin_destinations', updatedList);
    setHubSaveToast(`Master Hub parameters for ${activeDest.name} published live!`);
    setTimeout(() => setHubSaveToast(null), 3500);
  };

  // Moderation Handlers
  const handleDismissFlag = (id: string) => {
    const updated = flaggedItems.map(item => item.id === id ? { ...item, status: 'dismissed' as const } : item);
    setFlaggedItems(updated);
    setStoredData('safarnama_flagged_content', updated);
    setModerationToast('Report reviewed and dismissed. Content remains published.');
    setTimeout(() => setModerationToast(null), 3000);
  };

  const handleRemoveContent = (id: string) => {
    const updated = flaggedItems.map(item => item.id === id ? { ...item, status: 'removed' as const } : item);
    setFlaggedItems(updated);
    setStoredData('safarnama_flagged_content', updated);
    setModerationToast('Flagged content removed from community feed for policy violation.');
    setTimeout(() => setModerationToast(null), 3000);
  };

  // Filtered Guides
  const filteredGuides = guideRequests.filter(g => {
    const matchesFilter = guideFilter === 'all' || g.status === guideFilter;
    const matchesSearch = guideSearch === '' || 
      g.guideName.toLowerCase().includes(guideSearch.toLowerCase()) ||
      g.username.toLowerCase().includes(guideSearch.toLowerCase()) ||
      g.homeCity.toLowerCase().includes(guideSearch.toLowerCase()) ||
      g.circuits.some(c => c.toLowerCase().includes(guideSearch.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const pendingGuidesCount = guideRequests.filter(g => g.status === 'pending').length;
  const pendingFlagsCount = flaggedItems.filter(f => f.status === 'pending').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="relative w-full max-w-5xl h-[94vh] bg-slate-50 border border-slate-200/90 rounded-3xl shadow-2xl flex flex-col text-slate-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Operations Header */}
        <header className="px-6 py-4 bg-white border-b border-slate-200/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-700 to-indigo-600 flex items-center justify-center shadow-md shadow-purple-600/20 text-white font-bold shrink-0">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                  SafarNama Operations Command
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-bold border border-purple-200">
                  HQ LIVE
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Chief Operations Officer • Pan-India Master Hubs & Local Guide Bureau
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                closeAdminPortal();
                signOut();
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50 border border-slate-200 transition-colors"
            >
              Sign Out
            </button>
            <button
              onClick={closeAdminPortal}
              className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors"
              title="Return to SafarNama App"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Global Toast Alert */}
        {(guideToast || hubSaveToast || moderationToast) && (
          <div className="px-6 py-2.5 bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{guideToast || hubSaveToast || moderationToast}</span>
            </div>
            <button 
              onClick={() => { setGuideToast(null); setHubSaveToast(null); setModerationToast(null); }}
              className="text-emerald-700 hover:text-emerald-900 font-bold text-xs"
            >
              ✕
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="px-6 py-2 bg-white border-b border-slate-200/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          <button
            onClick={() => setActiveTab('health')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'health'
                ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Platform Health</span>
          </button>

          <button
            onClick={() => setActiveTab('guides')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'guides'
                ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Guide Approvals</span>
            {pendingGuidesCount > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === 'guides' ? 'bg-white text-purple-700' : 'bg-amber-100 text-amber-800'
              }`}>
                {pendingGuidesCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('destinations')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'destinations'
                ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Destination Master Hubs</span>
          </button>

          <button
            onClick={() => setActiveTab('moderation')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'moderation'
                ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Flag className="w-3.5 h-3.5" />
            <span>Content Moderation</span>
            {pendingFlagsCount > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === 'moderation' ? 'bg-white text-purple-700' : 'bg-red-100 text-red-700'
              }`}>
                {pendingFlagsCount}
              </span>
            )}
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* ========================================================================= */}
          {/* TAB 1: PLATFORM HEALTH METRICS                                            */}
          {/* ========================================================================= */}
          {activeTab === 'health' && (
            <div className="space-y-6">
              {/* Primary Stat Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-xs font-semibold uppercase tracking-wider">Registered Travelers</span>
                    <Users className="w-4 h-4 text-orange-500" />
                  </div>
                  <div className="text-2xl font-black text-slate-900">14,820</div>
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-semibold">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>+12.4% this week</span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-xs font-semibold uppercase tracking-wider">Verified Guides</span>
                    <Award className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-2xl font-black text-slate-900">142</div>
                  <div className="flex items-center gap-1.5 text-[11px] text-amber-600 font-semibold">
                    <Activity className="w-3.5 h-3.5" />
                    <span>3 pending verification</span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-xs font-semibold uppercase tracking-wider">Destination Hubs</span>
                    <Compass className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-2xl font-black text-slate-900">5 Live</div>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-semibold">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>2 in staging (Ziro, Ladakh)</span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-xs font-semibold uppercase tracking-wider">Tourism Campaigns</span>
                    <Sparkles className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="text-2xl font-black text-slate-900">3 Active</div>
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-semibold">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>2,890 total check-ins</span>
                  </div>
                </div>
              </div>

              {/* Infrastructure & Pipeline Health */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Server className="w-4 h-4 text-slate-700" />
                      <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                        Infrastructure & CDN Health
                      </h3>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      All Systems Operational
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 font-medium">Supabase Postgres & Auth</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono text-slate-500">99.99%</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 font-medium">Cloudflare R2 & Video Stream</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono text-slate-500">99.98%</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 font-medium">Mapbox / Map Services</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono text-slate-500">42ms avg</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 font-medium">Mobile Native OTA Engine</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono text-slate-500">v1.0.2 Ready</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-700" />
                      <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                        Active Destination Traffic
                      </h3>
                    </div>
                    <span className="text-[10px] text-slate-500 font-semibold">Live Explorers</span>
                  </div>

                  <div className="space-y-2.5">
                    {[
                      { name: 'Varanasi Ghats & Heritage', state: 'Uttar Pradesh', count: 812, percentage: 85 },
                      { name: 'Old Delhi Food & Walled City', state: 'Delhi NCR', count: 619, percentage: 65 },
                      { name: 'Hampi Boulder Trails', state: 'Karnataka', count: 490, percentage: 52 },
                      { name: 'Spiti Valley High Passes', state: 'Himachal Pradesh', count: 428, percentage: 46 },
                      { name: 'Meghalaya Living Roots', state: 'Meghalaya', count: 324, percentage: 34 },
                    ].map((hub) => (
                      <div key={hub.name} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-800">{hub.name}</span>
                          <span className="text-slate-500 font-mono text-[11px]">{hub.count} travelers</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full"
                            style={{ width: `${hub.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: GUIDE VERIFICATION APPROVALS                                       */}
          {/* ========================================================================= */}
          {activeTab === 'guides' && (
            <div className="space-y-4">
              {/* Search & Filter Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm">
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={guideSearch}
                    onChange={(e) => setGuideSearch(e.target.value)}
                    placeholder="Search guide name, circuit, or city..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-purple-500 transition-all"
                  />
                </div>

                <div className="flex items-center gap-1.5 self-start sm:self-auto">
                  {(['all', 'pending', 'approved', 'rejected'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setGuideFilter(filter)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                        guideFilter === filter
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              {/* Guide Verification Cards */}
              <div className="space-y-3">
                {filteredGuides.map((guide) => (
                  <div
                    key={guide.id}
                    className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3 hover:border-slate-300 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <img
                          src={guide.avatarUrl}
                          alt={guide.guideName}
                          className="w-12 h-12 rounded-2xl object-cover border border-slate-200 shrink-0"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-extrabold text-slate-900">
                              {guide.guideName}
                            </h4>
                            <span className="text-xs text-slate-500">@{guide.username}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                              guide.status === 'approved'
                                ? 'bg-emerald-100 text-emerald-800'
                                : guide.status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {guide.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                            <span>{guide.homeCity}</span>
                            <span>•</span>
                            <span>{guide.experienceYears} Years Field Experience</span>
                            <span>•</span>
                            <span>{guide.phone}</span>
                          </p>
                        </div>
                      </div>

                      {/* Approval Actions */}
                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        {guide.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleRejectGuide(guide.id)}
                              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-200"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                            <button
                              onClick={() => handleApproveGuide(guide.id)}
                              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-emerald-600/20 transition-all"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Approve & Bestow Badge</span>
                            </button>
                          </>
                        )}
                        {guide.status === 'approved' && (
                          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Verified Badge Active</span>
                          </div>
                        )}
                        {guide.status === 'rejected' && (
                          <div className="flex items-center gap-1.5 text-xs font-bold text-red-700 bg-red-50 px-3 py-1.5 rounded-xl border border-red-200">
                            <XCircle className="w-3.5 h-3.5 text-red-600" />
                            <span>Application Rejected</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Statement & Documentation Info */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-2">
                      <div className="flex items-center justify-between text-slate-600">
                        <span><strong>Credentials Proof:</strong> {guide.idProofType} ({guide.idProofNumber})</span>
                      </div>
                      <p className="text-slate-700 italic">"{guide.bio}"</p>
                    </div>

                    {/* Circuits Applied For */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[11px] font-semibold text-slate-500 mr-1">Registered Circuits:</span>
                      {guide.circuits.map((c) => (
                        <span
                          key={c}
                          className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: DESTINATION MASTER HUB EDITOR                                      */}
          {/* ========================================================================= */}
          {activeTab === 'destinations' && (
            <div className="space-y-6">
              {/* Destination Selector Carousel */}
              <div className="flex items-center gap-2.5 overflow-x-auto pb-2 no-scrollbar">
                {destinations.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => handleSelectDestination(d.id)}
                    className={`px-4 py-2.5 rounded-2xl font-bold text-xs shrink-0 flex items-center gap-2 transition-all border ${
                      selectedDestId === d.id
                        ? 'bg-white text-purple-700 border-purple-500 shadow-md ring-2 ring-purple-500/20'
                        : 'bg-white text-slate-600 border-slate-200/80 hover:border-slate-300'
                    }`}
                  >
                    <span>{d.name}</span>
                    <span className="text-[10px] text-slate-400 font-normal">({d.state})</span>
                  </button>
                ))}
              </div>

              {/* Destination Hub Editor Form */}
              <form onSubmit={handleSaveHub} className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">
                      Master Destination Parameters: {activeDest.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {activeDest.region} • {activeDest.state}
                    </p>
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all"
                  >
                    <Save className="w-4 h-4" />
                    <span>Publish Changes Live</span>
                  </button>
                </div>

                {/* Section 1: Emergency Contacts */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
                    <PhoneCall className="w-4 h-4 text-orange-500" />
                    <span>Emergency Contacts & Helplines</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Police Emergency & Station Phone
                      </label>
                      <input
                        type="text"
                        value={editEmergency.police}
                        onChange={(e) => setEditEmergency({ ...editEmergency, police: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-purple-500 transition-all font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Hospital & Ambulance Service
                      </label>
                      <input
                        type="text"
                        value={editEmergency.medical}
                        onChange={(e) => setEditEmergency({ ...editEmergency, medical: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-purple-500 transition-all font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Disaster Management Control
                      </label>
                      <input
                        type="text"
                        value={editEmergency.disaster}
                        onChange={(e) => setEditEmergency({ ...editEmergency, disaster: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-purple-500 transition-all font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        State Tourism Helpline
                      </label>
                      <input
                        type="text"
                        value={editEmergency.touristHelpline}
                        onChange={(e) => setEditEmergency({ ...editEmergency, touristHelpline: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-purple-500 transition-all font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Permits Required */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
                    <FileText className="w-4 h-4 text-blue-500" />
                    <span>Permits, Inner Line Permits (ILP) & Entry Regulations</span>
                  </div>
                  <textarea
                    rows={2}
                    value={editPermits}
                    onChange={(e) => setEditPermits(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-purple-500 transition-all resize-none"
                  />
                </div>

                {/* Section 3: Scam Alerts */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span>Active Scam Alerts & Traveler Warnings</span>
                  </div>
                  <textarea
                    rows={2}
                    value={editScamAlerts}
                    onChange={(e) => setEditScamAlerts(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-purple-500 transition-all resize-none"
                  />
                </div>

                {/* Section 4: Cultural Etiquette */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
                    <Sparkles className="w-4 h-4 text-emerald-500" />
                    <span>Cultural Etiquette & Sacred Protocols</span>
                  </div>
                  <textarea
                    rows={2}
                    value={editEtiquette}
                    onChange={(e) => setEditEtiquette(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-purple-500 transition-all resize-none"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveDestination(activeDest);
                      closeAdminPortal();
                    }}
                    className="text-xs font-semibold text-purple-700 hover:text-purple-800 flex items-center gap-1"
                  >
                    <span>Preview Destination Hub Modal as Traveler</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save & Deploy Changes</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: CONTENT MODERATION                                                 */}
          {/* ========================================================================= */}
          {activeTab === 'moderation' && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Community Safety & Heritage Moderation Queue
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Flagged items reported for safety hazards, permit violations, or cultural disrespect
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-slate-500">
                  {flaggedItems.length} Total Reports
                </span>
              </div>

              <div className="space-y-3">
                {flaggedItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          item.contentType === 'reel'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {item.contentType}
                        </span>
                        <span className="text-xs font-bold text-slate-800">
                          Destination: {item.destinationName || 'India'}
                        </span>
                        <span className="text-xs text-slate-500">• Author: @{item.authorUsername}</span>
                      </div>

                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full capitalize self-start sm:self-auto ${
                        item.status === 'pending'
                          ? 'bg-amber-100 text-amber-800'
                          : item.status === 'removed'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {item.status}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-slate-900">
                        "{item.titleOrCaption}"
                      </h4>
                      <div className="p-2.5 rounded-xl bg-red-50/70 border border-red-200/60 text-xs text-red-800 space-y-1">
                        <div className="flex items-center gap-1.5 font-bold">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                          <span>Flag Reason: {item.reason}</span>
                        </div>
                        <p className="text-[11px] text-red-700/80">
                          Reported by: @{item.reportedBy} • {new Date(item.reportedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {item.status === 'pending' && (
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          onClick={() => handleDismissFlag(item.id)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                        >
                          Dismiss Flag (Keep Content)
                        </button>
                        <button
                          onClick={() => handleRemoveContent(item.id)}
                          className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors"
                        >
                          Remove Content
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

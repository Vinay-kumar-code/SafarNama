import React, { useState } from 'react';
import { 
  Trophy, 
  MapPin, 
  Calendar, 
  Award, 
  CheckCircle2, 
  Flame, 
  Users, 
  Sparkles, 
  ArrowRight,
  Shield,
  Clock
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../../context/AppContext';
import { Campaign } from '../../types';

export const CampaignHub: React.FC = () => {
  const { campaigns, checkInCampaignCheckpoint } = useApp();
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>(campaigns[0]?.id || '');

  const activeCampaign = campaigns.find(c => c.id === selectedCampaignId) || campaigns[0];

  const handleCheckIn = (checkpointId: string) => {
    // Fire celebratory confetti!
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#f97316', '#eab308', '#10b981', '#3b82f6'],
    });

    checkInCampaignCheckpoint(activeCampaign.id, checkpointId);
  };

  const completedCount = activeCampaign.checkpoints.filter(cp => cp.isCompleted).length;
  const progressPercent = Math.round((completedCount / activeCampaign.checkpoints.length) * 100);

  return (
    <div className="w-full h-[calc(100dvh-57px-60px)] overflow-y-auto bg-[#090a0f] p-4 no-scrollbar">
      <div className="max-w-xl mx-auto space-y-5 pb-12">
        
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-wider">
            <Flame className="w-4 h-4 text-orange-400 fill-current" />
            <span>Time-Bound Influencer & Tourism Campaigns</span>
          </div>
          <h1 className="text-xl font-extrabold text-white mt-1">
            Flash Destination Trends
          </h1>
          <p className="text-xs text-slate-400">
            Visit geofenced checkpoints, log authentic notes, and unlock limited-edition passport badges!
          </p>
        </div>

        {/* Campaign Switcher Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {campaigns.map(camp => (
            <button
              key={camp.id}
              onClick={() => setSelectedCampaignId(camp.id)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all border shrink-0 ${
                activeCampaign.id === camp.id
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white border-orange-400 shadow-lg shadow-orange-500/25 scale-105'
                  : 'bg-slate-900 text-slate-400 border-white/10 hover:border-white/20'
              }`}
            >
              {camp.title}
            </button>
          ))}
        </div>

        {/* Hero Card */}
        <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-slate-900">
          <div className="relative h-44 w-full">
            <img
              src={activeCampaign.bannerImage}
              alt={activeCampaign.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

            {/* Countdown Badge */}
            <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-orange-500/90 backdrop-blur-md text-white text-[11px] font-extrabold flex items-center gap-1.5 shadow-md">
              <Clock className="w-3.5 h-3.5" />
              <span>{activeCampaign.daysRemaining} Days Left</span>
            </div>

            <div className="absolute bottom-3 left-4 right-4">
              <span className="text-[11px] font-bold text-orange-400">
                {activeCampaign.organizerName}
              </span>
              <h2 className="text-2xl font-black text-white leading-tight">
                {activeCampaign.title}
              </h2>
            </div>
          </div>

          <div className="p-4 space-y-4">
            <p className="text-xs text-slate-300 leading-relaxed">
              {activeCampaign.description}
            </p>

            {/* Reward Card */}
            <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-500/30 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 block">
                  Campaign Reward & Badge
                </span>
                <p className="text-xs font-bold text-amber-200 mt-0.5">
                  {activeCampaign.rewardDescription}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-300">Your Checkpoint Progress</span>
                <span className="text-orange-400">{completedCount} / {activeCampaign.checkpoints.length} Visited ({progressPercent}%)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Geofenced Checkpoints */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-orange-400" />
              <span>Geofenced Checkpoints ({activeCampaign.checkpoints.length})</span>
            </h3>
            <span className="text-[11px] text-slate-400">GPS high-accuracy enabled</span>
          </div>

          <div className="space-y-2.5">
            {activeCampaign.checkpoints.map((cp) => (
              <div
                key={cp.id}
                className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                  cp.isCompleted
                    ? 'bg-emerald-950/20 border-emerald-500/30'
                    : 'bg-slate-900 border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    cp.isCompleted
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {cp.isCompleted ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <MapPin className="w-5 h-5" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-white truncate">
                      {cp.name}
                    </h4>
                    <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Award className="w-3 h-3 text-amber-400" />
                      <span>Unlocks: "{cp.badgeName}"</span>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleCheckIn(cp.id)}
                  disabled={cp.isCompleted}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                    cp.isCompleted
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-default'
                      : 'bg-orange-500 hover:bg-orange-600 text-white shadow-md active:scale-95'
                  }`}
                >
                  {cp.isCompleted ? 'Checked In' : 'Check In GPS'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Live Leaderboard */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>Live Leaderboard</span>
            </h3>
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span>{activeCampaign.participantsCount} Joined</span>
            </span>
          </div>

          <div className="rounded-3xl bg-slate-900 border border-white/10 p-2 space-y-1 shadow-lg">
            {activeCampaign.leaderboard.map(entry => (
              <div
                key={entry.rank}
                className={`flex items-center justify-between p-2.5 rounded-2xl transition-all ${
                  entry.rank === 1
                    ? 'bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30'
                    : 'hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-6 text-center text-xs font-extrabold ${
                    entry.rank === 1 ? 'text-amber-400 text-sm' :
                    entry.rank === 2 ? 'text-slate-300' :
                    entry.rank === 3 ? 'text-amber-600' : 'text-slate-500'
                  }`}>
                    #{entry.rank}
                  </span>

                  <img
                    src={entry.avatarUrl}
                    alt={entry.fullName}
                    className="w-9 h-9 rounded-full object-cover border border-white/20"
                  />

                  <div>
                    <h5 className="text-xs font-bold text-white leading-tight">
                      {entry.fullName}
                    </h5>
                    <p className="text-[10px] text-slate-400 font-medium">
                      @{entry.username} • <span className="text-amber-400 font-semibold">{entry.badgeTier}</span>
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-black text-orange-400 block">
                    {entry.points} pts
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {entry.badgesUnlocked} badges
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

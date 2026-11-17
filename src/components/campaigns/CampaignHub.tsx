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
    <div className="w-full h-[calc(100dvh-57px-60px)] md:h-[calc(100vh-65px)] overflow-y-auto bg-white md:bg-[#fafafa] p-4 sm:p-6 lg:p-8 no-scrollbar text-zinc-900">
      <div className="max-w-xl md:max-w-6xl mx-auto space-y-6 pb-20">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-orange-600 uppercase tracking-wider">
              <Flame className="w-4 h-4 text-orange-500 fill-current" />
              <span>Time-Bound Influencer & Tourism Campaigns</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-zinc-900 mt-1">
              Flash Destination Trends
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500">
              Visit geofenced checkpoints, log authentic notes, and unlock limited-edition passport badges!
            </p>
          </div>

          {/* Campaign Switcher Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {campaigns.map(camp => (
              <button
                key={camp.id}
                onClick={() => setSelectedCampaignId(camp.id)}
                className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all border shrink-0 cursor-pointer ${
                  activeCampaign.id === camp.id
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white border-orange-400 shadow-md shadow-orange-500/20 scale-105'
                    : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 shadow-xs'
                }`}
              >
                {camp.title}
              </button>
            ))}
          </div>
        </div>

        {/* Responsive Grid: Left Column for Campaign & Checkpoints, Right Column for Reward & Leaderboard */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

          {/* Left Column (7 cols on desktop) */}
          <div className="md:col-span-7 space-y-6">

            {/* Hero Card */}
            <div className="relative rounded-3xl overflow-hidden border border-zinc-200 shadow-sm bg-white">
              <div className="relative h-44 w-full">
                <img
                  src={activeCampaign.bannerImage}
                  alt={activeCampaign.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />

                {/* Countdown Badge */}
                <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-orange-500 text-white text-[11px] font-extrabold flex items-center gap-1.5 shadow-md">
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
                <p className="text-xs text-zinc-600 leading-relaxed">
                  {activeCampaign.description}
                </p>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-zinc-700">Your Checkpoint Progress</span>
                    <span className="text-orange-600">{completedCount} / {activeCampaign.checkpoints.length} Visited ({progressPercent}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-zinc-100 overflow-hidden border border-zinc-200/60">
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
                <h3 className="text-xs font-extrabold text-zinc-600 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-orange-500" />
                  <span>Geofenced Checkpoints ({activeCampaign.checkpoints.length})</span>
                </h3>
                <span className="text-[11px] text-zinc-400">GPS high-accuracy enabled</span>
              </div>

              <div className="space-y-2.5">
                {activeCampaign.checkpoints.map((cp) => (
                  <div
                    key={cp.id}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 shadow-xs ${
                      cp.isCompleted
                        ? 'bg-emerald-50/70 border-emerald-200'
                        : 'bg-white border-zinc-200 hover:border-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        cp.isCompleted
                          ? 'bg-emerald-500 text-white shadow-xs'
                          : 'bg-zinc-100 text-zinc-500 border border-zinc-200'
                      }`}>
                        {cp.isCompleted ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          <MapPin className="w-5 h-5" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-zinc-900 truncate">
                          {cp.name}
                        </h4>
                        <p className="text-[10px] text-zinc-500 flex items-center gap-1 mt-0.5">
                          <Award className="w-3 h-3 text-amber-500" />
                          <span>Unlocks: "{cp.badgeName}"</span>
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleCheckIn(cp.id)}
                      disabled={cp.isCompleted}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                        cp.isCompleted
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 cursor-default'
                          : 'bg-orange-500 hover:bg-orange-600 text-white shadow-xs active:scale-95'
                      }`}
                    >
                      {cp.isCompleted ? 'Checked In' : 'Check In GPS'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column (5 cols on desktop): Reward Details & Live Leaderboard */}
          <div className="md:col-span-5 space-y-6">
            {/* Reward Card */}
            <div className="p-4 sm:p-5 rounded-3xl bg-amber-50/70 border border-amber-200 flex items-start gap-3.5 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 border border-amber-300">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-800 block">
                  Campaign Reward & Badge
                </span>
                <p className="text-xs sm:text-sm font-bold text-amber-950 mt-1 leading-relaxed">
                  {activeCampaign.rewardDescription}
                </p>
              </div>
            </div>

            {/* Live Leaderboard */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs sm:text-sm font-extrabold text-zinc-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <span>Live Leaderboard</span>
                </h3>
                <span className="text-xs text-zinc-500 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  <span>{activeCampaign.participantsCount} Joined</span>
                </span>
              </div>

              <div className="rounded-3xl bg-white border border-zinc-200 p-2 sm:p-3 space-y-1.5 shadow-sm">
                {activeCampaign.leaderboard.map(entry => (
                  <div
                    key={entry.rank}
                    className={`flex items-center justify-between p-3 rounded-2xl transition-all ${
                      entry.rank === 1
                        ? 'bg-gradient-to-r from-amber-50/80 to-orange-50/80 border border-amber-200'
                        : 'hover:bg-zinc-50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`w-6 text-center text-xs font-extrabold ${
                        entry.rank === 1 ? 'text-amber-600 text-sm' :
                        entry.rank === 2 ? 'text-zinc-600' :
                        entry.rank === 3 ? 'text-amber-700' : 'text-zinc-400'
                      }`}>
                        #{entry.rank}
                      </span>

                      <img
                        src={entry.avatarUrl}
                        alt={entry.fullName}
                        className="w-10 h-10 rounded-full object-cover border border-zinc-200 shrink-0"
                      />

                      <div className="min-w-0">
                        <h5 className="text-xs sm:text-sm font-bold text-zinc-900 leading-tight truncate">
                          {entry.fullName}
                        </h5>
                        <p className="text-[11px] text-zinc-500 font-medium truncate">
                          @{entry.username} • <span className="text-amber-600 font-semibold">{entry.badgeTier}</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0 pl-2">
                      <span className="text-xs sm:text-sm font-black text-orange-600 block">
                        {entry.points} pts
                      </span>
                      <span className="text-[10px] text-zinc-400">
                        {entry.badgesUnlocked} badges
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

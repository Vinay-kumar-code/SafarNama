import { useState } from 'react';
import { Award, Check, Clock, MapPin, Trophy, Users } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../../context/AppContext';
import { DESTINATION_HUBS } from '../../data/destinations';
import { EmptyState, TravelImage } from '../social/Primitives';

const campaignCovers: Record<string, string> = {
  'monsoon-in-meghalaya': 'dest-meghalaya',
  'hampi-hidden-gems': 'dest-hampi',
};

export function CampaignHub() {
  const { campaigns, checkInCampaignCheckpoint, openSpotOnMap } = useApp();
  const [campaignId, setCampaignId] = useState('');
  const active = campaigns.find(campaign => campaign.id === campaignId) ?? campaigns[0];
  const completed = active?.checkpoints.filter(checkpoint => checkpoint.isCompleted).length ?? 0;
  const cover = active && DESTINATION_HUBS.find(place => place.id === campaignCovers[active.slug])?.coverImage;
  const status = active?.status === 'active' ? `${Math.max(0, active.daysRemaining)} days left`
    : active?.status === 'upcoming' ? 'Upcoming' : 'Ended';

  function checkIn(checkpointId: string) {
    if (!active) return;
    checkInCampaignCheckpoint(active.id, checkpointId);
    void confetti({ particleCount: 55, spread: 65, colors: ['#ce623a', '#dcab5c', '#607d65'], disableForReducedMotion: true });
  }

  return <section className="sn-secondary-page" aria-labelledby="campaigns-title">
    <header className="sn-page-heading"><div><h1 id="campaigns-title">Travel challenges<span>.</span></h1><p>Follow a trail through India, visit checkpoints, and collect badges.</p></div></header>
    {!active ? <EmptyState title="No challenges available" description="Check back for the next trail." /> : <>
      {campaigns.length > 1 && <div className="sn-segment sn-campaign-switcher" role="group" aria-label="Choose a challenge">
        {campaigns.map(campaign => <button key={campaign.id} aria-pressed={active.id === campaign.id} onClick={() => setCampaignId(campaign.id)}>{campaign.title}</button>)}
      </div>}
      <div className="sn-secondary-grid">
        <div className="sn-secondary-stack">
          <article className="sn-panel sn-campaign-main">
            <div className="sn-campaign-hero"><TravelImage src={cover || active.bannerImage} alt="" /><div><span>{active.organizerName}</span><h2>{active.title}</h2></div></div>
            <div className="sn-panel-padding sn-secondary-stack">
              <div className="sn-secondary-actions"><span className="sn-meta"><Clock size={15} /> {status}</span><span className="sn-meta"><Users size={15} /> {active.participantsCount} joined</span></div>
              <p className="sn-secondary-body">{active.description}</p>
              <div className="sn-campaign-progress">
                <div className="sn-row-heading"><h3>Your progress</h3><span className="sn-meta">{completed} of {active.checkpoints.length} visited</span></div>
                <progress aria-label="Challenge progress" value={completed} max={active.checkpoints.length || 1} />
              </div>
            </div>
          </article>
          <section className="sn-secondary-stack" aria-label="Checkpoints">
            <h2>Checkpoints</h2>
            <div className="sn-panel">
              {active.checkpoints.map(point => <article className="sn-list-row sn-checkpoint" key={point.id}>
                <span className="sn-soft-icon">{point.isCompleted ? <Check size={19} /> : <MapPin size={19} />}</span>
                <div className="sn-list-text"><h3>{point.name}</h3><p className="sn-meta"><Award size={14} />{point.badgeName}</p></div>
                <div className="sn-secondary-actions">
                  <button className="sn-icon" aria-label={`View ${point.name} on map`} onClick={() => openSpotOnMap(point.lat, point.lng, point.name)}><MapPin size={16} /></button>
                  <button className="sn-button secondary" onClick={() => checkIn(point.id)} disabled={Boolean(point.isCompleted)}>{point.isCompleted ? 'Checked in' : 'Check in'}</button>
                </div>
              </article>)}
              {active.checkpoints.length === 0 && <p className="sn-panel-padding sn-secondary-body">Checkpoints will appear here when the trail is ready.</p>}
            </div>
          </section>
        </div>
        <div className="sn-secondary-stack">
          <section className="sn-panel sn-panel-padding sn-campaign-reward">
            <span className="sn-soft-icon"><Trophy size={21} /></span><div><h2>Reward</h2><p className="sn-secondary-body">{active.rewardDescription}</p></div>
          </section>
          <section className="sn-secondary-stack" aria-label="Leaderboard">
            <h2>Leaderboard</h2>
            <div className="sn-panel">
              {active.leaderboard.map(entry => <article className="sn-list-row sn-rank" key={entry.username}>
                <span className="sn-meta">#{entry.rank}</span>
                <TravelImage src={entry.avatarUrl} alt="" className="sn-avatar" />
                <div className="sn-list-text"><h3>{entry.fullName}</h3><p className="sn-secondary-body">{entry.badgeTier}</p></div>
                <div><strong>{entry.points} pts</strong><p className="sn-secondary-body">{entry.badgesUnlocked} badges</p></div>
              </article>)}
              {active.leaderboard.length === 0 && <p className="sn-panel-padding sn-secondary-body">The leaderboard is empty so far.</p>}
            </div>
          </section>
        </div>
      </div>
    </>}
  </section>;
}

import { ArrowUpRight, Bell, CalendarDays, MapPin } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useCommunity } from '../../context/CommunityContext';
import { useSocial } from '../../context/SocialContext';
import { formatINR, timeAgo } from '../../lib/utils';
import type { DestinationListing, DestinationUpdate } from '../../types';

export function FollowAccount({ id, label }: { id: string; label?: string }) {
  const { profile } = useAuth();
  const { state, toggleFollow } = useSocial();
  if (!id || id === profile?.id) return null;
  const following = state.following.includes(id);
  return <button className="sn-button secondary" aria-pressed={following} onClick={() => toggleFollow(id)}>
    <Bell size={15} /> {following ? 'Following' : label ?? 'Follow'}
  </button>;
}

export function UpdateCard({ update, showDestination = false }: { update: DestinationUpdate; showDestination?: boolean }) {
  const { destinations } = useCommunity();
  const { setActiveDestination } = useApp();
  const place = destinations.find(item => item.id === update.destinationId);
  return <article className="sn-panel sn-panel-padding sn-community-card">
    <div className="sn-row-heading"><span className="sn-meta">{update.category}</span><time dateTime={update.createdAt}>{timeAgo(update.createdAt)}</time></div>
    <h3>{update.title}</h3><p className="sn-community-detail">{update.detail}</p>
    <div className="sn-row-heading sn-community-byline"><span>{update.author.fullName} · Destination manager</span><FollowAccount id={update.author.id} /></div>
    {showDestination && place && <button className="sn-community-link" onClick={() => setActiveDestination(place)}><MapPin size={14} /> {place.name}<ArrowUpRight size={14} /></button>}
  </article>;
}

export function ListingCard({ listing, showDestination = false }: { listing: DestinationListing; showDestination?: boolean }) {
  const { destinations } = useCommunity();
  const { setActiveDestination } = useApp();
  const place = destinations.find(item => item.id === listing.destinationId);
  return <article className="sn-panel sn-panel-padding sn-community-card">
    <div className="sn-row-heading"><span className="sn-meta">{listing.category}</span>{listing.priceInr !== undefined && <strong>From {formatINR(listing.priceInr)}</strong>}</div>
    <h3>{listing.title}</h3><p className="sn-community-byline">{listing.author.fullName}</p>
    {listing.duration && <span className="sn-meta"><CalendarDays size={15} /> {listing.duration}</span>}
    <p className="sn-community-detail">{listing.detail}</p>
    <div className="sn-secondary-actions">
      {listing.contactUrl && <a className="sn-button secondary" href={listing.contactUrl} target="_blank" rel="noopener noreferrer">{listing.category === 'Tour package' ? 'Tour website' : 'Business website'}<ArrowUpRight size={15} /></a>}
      {showDestination && place && <button className="sn-community-link" onClick={() => setActiveDestination(place)}><MapPin size={14} /> {place.name}</button>}
    </div>
  </article>;
}

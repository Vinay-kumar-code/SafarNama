import { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useSocial } from '../../context/SocialContext';
import type { Post } from '../../types';
import { FollowAccount } from '../destinations/CommunityCards';
import { EmptyState, Modal, ProfileAvatar, TravelImage } from './Primitives';
import { listTags } from './SocialText';

export function openStory(postId: string) {
  window.location.hash = new URLSearchParams({ post: postId }).toString();
}

export function StoryResults({ posts, onOpen = openStory }: { posts: Post[]; onOpen?: (id: string) => void }) {
  return <ul className="sn-panel sn-story-results">{posts.map(post => <li key={post.id} className="sn-list-row">
    <button type="button" className="sn-followed-place-guide" onClick={() => onOpen(post.id)}>
      <TravelImage src={post.thumbnailUrl} alt="" />
      <span><strong>{post.spotName}</strong><small>{post.author.fullName}</small><small>{post.caption}</small></span><ArrowUpRight size={15} />
    </button>
  </li>)}</ul>;
}

export function CommunitySheets() {
  const { posts } = useApp();
  const { activeProfile, activeTopic, openProfile, openTopic, isVisible } = useSocial();
  function read(id: string) { openProfile(); openTopic(); openStory(id); }
  if (activeProfile) {
    const authored = posts.filter(post => post.author.id === activeProfile.id && isVisible(post)).slice(0, 20);
    return <Modal title={activeProfile.fullName} onClose={() => openProfile()}>
      <div className="sn-secondary-form">
        <div className="sn-row-heading sn-mini-profile"><ProfileAvatar className="sn-avatar" profile={activeProfile} />
          <span><strong>@{activeProfile.username}</strong>{activeProfile.isVerifiedGuide && <small>Verified guide</small>}</span>
          <FollowAccount id={activeProfile.id} />
        </div>
        {authored.length > 0 ? <StoryResults posts={authored} onOpen={read} /> : <p className="sn-secondary-body">No stories to show here yet.</p>}
      </div>
    </Modal>;
  }
  if (activeTopic) {
    const matching = posts.filter(post => isVisible(post) && listTags(post.caption).includes(activeTopic));
    return <Modal title={'#' + activeTopic} onClose={() => openTopic()}>
      <div className="sn-secondary-form">{matching.length ? <StoryResults posts={matching} onOpen={read} />
        : <EmptyState title="No stories for this topic" description="Add the hashtag to a story to join the topic." />}</div>
    </Modal>;
  }
  return null;
}

export function FeedPreferences({ onClose }: { onClose: () => void }) {
  const { posts } = useApp();
  const { state, profiles, setFeedPreference } = useSocial();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  async function restore(kind: 'hiddenPosts' | 'mutedAuthors', id: string) {
    setSaving(true);
    setError('');
    try { await setFeedPreference(kind, id, false); }
    catch (failure) { setError(failure instanceof Error ? failure.message : 'Could not update your feed.'); }
    finally { setSaving(false); }
  }
  return <Modal title="Hidden and muted" onClose={() => { if (!saving) onClose(); }}>
    <div className="sn-secondary-form">
      <section aria-label="Hidden stories" className="sn-secondary-stack"><h3>Hidden stories</h3>
        {state.hiddenPosts.length ? <ul className="sn-panel">{state.hiddenPosts.map(id => <li key={id} className="sn-list-row sn-row-heading">
          <span className="sn-list-text">{posts.find(post => post.id === id)?.spotName ?? 'Story outside the recent feed'}</span>
          <button type="button" className="sn-button secondary" disabled={saving} onClick={() => void restore('hiddenPosts', id)}>Unhide</button>
        </li>)}</ul> : <p className="sn-secondary-body">No stories hidden.</p>}
      </section>
      <section aria-label="Muted authors" className="sn-secondary-stack"><h3>Muted authors</h3>
        {state.mutedAuthors.length ? <ul className="sn-panel">{state.mutedAuthors.map(id => <li key={id} className="sn-list-row sn-row-heading">
          <span className="sn-list-text">{profiles.find(person => person.id === id)?.fullName ?? 'Unavailable profile'}</span>
          <button type="button" className="sn-button secondary" disabled={saving} onClick={() => void restore('mutedAuthors', id)}>Unmute</button>
        </li>)}</ul> : <p className="sn-secondary-body">No authors muted.</p>}
      </section>
      {error && <p role="alert" className="sn-form-feedback">{error}</p>}
    </div>
  </Modal>;
}

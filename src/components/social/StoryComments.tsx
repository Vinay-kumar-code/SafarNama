import { useState } from 'react';
import { Heart, Send } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocial } from '../../context/SocialContext';
import type { TravelComment } from '../../context/ServerDataContext';
import { timeAgo } from '../../lib/utils';
import { EmptyState, Modal, ProfileAvatar } from './Primitives';
import { RichText, SocialTextInput } from './SocialText';

export function StoryComments({ postId, place, onClose }: { postId: string; place: string; onClose: () => void }) {
  const { profile, openAuthModal } = useAuth();
  const { state, addComment, editComment, deleteComment, likeComment, openProfile } = useSocial();
  const [text, setText] = useState('');
  const [sort, setSort] = useState('latest');
  const [target, setTarget] = useState<{ action: 'reply' | 'edit' | 'delete'; comment: TravelComment }>();
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const comments = state.comments.filter(comment => comment.postId === postId);
  const ids = new Set(comments.map(comment => comment.id));
  const replies = new Map<string, TravelComment[]>();
  for (const comment of comments) {
    if (!comment.deleted && comment.replyTo && ids.has(comment.replyTo)) {
      const children = replies.get(comment.replyTo) ?? [];
      children.push(comment);
      replies.set(comment.replyTo, children);
    }
  }
  const roots = comments.filter(comment => (!comment.replyTo || !ids.has(comment.replyTo)) && (!comment.deleted || replies.has(comment.id)));
  roots.sort((a, b) => (sort === 'top' ? (b.likesCount ?? 0) - (a.likesCount ?? 0) : 0) || b.createdAt.localeCompare(a.createdAt));

  function choose(action: 'reply' | 'edit' | 'delete', comment: TravelComment) {
    if (!profile) { openAuthModal(); return; }
    if (action === 'reply' && target?.comment.id !== comment.id) setText('');
    setTarget({ action, comment });
    if (action === 'edit') setText(comment.text);
    setError('');
  }

  async function run(action: () => Promise<void>, clear = false) {
    if (working) return;
    setWorking(true);
    setError('');
    try { await action(); if (clear) { setTarget(undefined); setText(''); } }
    catch (failure) { setError(failure instanceof Error ? failure.message : 'Could not save that change.'); }
    finally { setWorking(false); }
  }

  function renderComment(comment: TravelComment) {
    if (comment.deleted) return <p className="sn-meta">Comment deleted</p>;
    const own = comment.author.id === profile?.id;
    return <article className="sn-comment">
      <ProfileAvatar className="sn-avatar" profile={comment.author} />
      <div className="sn-list-text">
        <button type="button" className="sn-social-token" onClick={() => openProfile(comment.author.id)}>{comment.author.fullName}</button>
        <small>{timeAgo(comment.createdAt)}{comment.editedAt ? ' · Edited' : ''}</small>
        <p className="sn-rich-copy"><RichText text={comment.text} /></p>
        <div className="sn-comment-actions">
          <button type="button" aria-label="Like comment" aria-pressed={!!comment.isLiked} disabled={working} onClick={() => {
            if (!profile) openAuthModal(); else void run(() => likeComment(comment));
          }}><Heart size={15} fill={comment.isLiked ? 'currentColor' : 'none'} />{comment.likesCount || 0}</button>
          {!comment.replyTo && <button type="button" disabled={working} onClick={() => choose('reply', comment)}>Reply</button>}
          {own && <><button type="button" disabled={working} onClick={() => choose('edit', comment)}>Edit</button>
            <button type="button" disabled={working} onClick={() => choose('delete', comment)}>Delete</button></>}
        </div>
      </div>
    </article>;
  }

  return <Modal title="Travel conversations" onClose={() => { if (!working) onClose(); }}>
    <div className="sn-comments">
      <div className="sn-row-heading"><p className="sn-comment-context">{place}</p>
        {roots.length > 1 && <select className="sn-field sn-comment-sort" aria-label="Sort comments" value={sort} onChange={event => setSort(event.target.value)}>
          <option value="latest">Newest</option><option value="top">Top comments</option>
        </select>}
      </div>
      {roots.length ? <ul className="sn-comment-threads">{roots.map(root => <li key={root.id}>
        {renderComment(root)}
        {replies.has(root.id) && <ul className="sn-comment-replies">{replies.get(root.id)?.map(reply => <li key={reply.id}>{renderComment(reply)}</li>)}</ul>}
      </li>)}</ul> : <EmptyState title="Start a conversation" description="Ask about the journey or share a tip." />}
    </div>
    <div className="sn-secondary-form sn-comment-editor">
      {error && <p className="sn-form-feedback" role="alert">{error}</p>}
      {target?.action === 'delete' ? <div className="sn-secondary-stack">
        <p>Delete your comment?</p><div className="sn-secondary-actions">
          <button type="button" className="sn-button secondary" disabled={working} onClick={() => setTarget(undefined)}>Cancel</button>
          <button type="button" className="sn-button" disabled={working} onClick={() => void run(() => deleteComment(target.comment), true)}>Delete comment</button>
        </div>
      </div> : profile ? <form className="sn-secondary-stack" onSubmit={event => {
        event.preventDefault();
        if (!text.trim()) return;
        void run(() => target?.action === 'edit' ? editComment(target.comment, text) : addComment(postId, text, target?.comment.id), true);
      }}>
        <SocialTextInput label={target?.action === 'edit' ? 'Edit comment' : target ? 'Reply to ' + target.comment.author.fullName : 'Your comment'}
          value={text} change={setText} limit={1000} rows={2} disabled={working} />
        <div className="sn-secondary-actions">
          {target && <button type="button" className="sn-button secondary" disabled={working} onClick={() => { setTarget(undefined); setText(''); setError(''); }}>Cancel</button>}
          <button className="sn-button" disabled={working || !text.trim()}><Send size={15} />{target?.action === 'edit' ? 'Save comment' : target ? 'Post reply' : 'Post comment'}</button>
        </div>
      </form> : <button type="button" className="sn-button secondary" onClick={() => openAuthModal()}>Sign in to comment</button>}
    </div>
  </Modal>;
}

import { useState, type FormEvent } from 'react';
import { MapPin, MessageCircle, Plus, Search, Send, ShieldCheck, ThumbsUp } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useCommunity } from '../../context/CommunityContext';
import { useAuth } from '../../context/AuthContext';
import { timeAgo } from '../../lib/utils';
import type { QAThread } from '../../types';
import { EmptyState, Modal, TravelImage } from '../social/Primitives';

const categories: QAThread['category'][] = ['Road Conditions', 'Safety', 'Food & Stays', 'Permits & Weather', 'Local Culture'];

export function QAFeed() {
  const { qaThreads, addQAQuestion, addQAReply, upvoteQAThread, upvoteQAReply, currentUser } = useApp();
  const { destinations } = useCommunity();
  const { profile, openAuthModal } = useAuth();
  const [category, setCategory] = useState<QAThread['category'] | ''>('');
  const [query, setQuery] = useState('');
  const [asking, setAsking] = useState(false);
  const [title, setTitle] = useState('');
  const [destinationId, setDestinationId] = useState(destinations[0]?.id ?? '');
  const [newCategory, setNewCategory] = useState<QAThread['category']>('Road Conditions');
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);

  const keyword = query.trim().toLowerCase();
  const threads = qaThreads.filter(thread => (!category || thread.category === category) &&
    [thread.title, thread.destinationName].some(value => value.toLowerCase().includes(keyword)));

  async function ask(event: FormEvent) {
    event.preventDefault();
    const destination = destinations.find(place => place.id === destinationId);
    if (!title.trim() || !destination || sending) return;
    setSending(true);
    const saved = await addQAQuestion(title.trim(), destination, newCategory);
    setSending(false);
    if (!saved) return;
    setTitle('');
    setQuery('');
    setCategory('');
    setAsking(false);
  }

  async function reply(event: FormEvent, threadId: string) {
    event.preventDefault();
    const text = replyInputs[threadId]?.trim();
    if (!text || sending) return;
    setSending(true);
    if (await addQAReply(threadId, text)) setReplyInputs(previous => ({ ...previous, [threadId]: '' }));
    setSending(false);
  }

  return <section className="sn-secondary-page sn-qa-page" aria-labelledby="qa-title">
    <header className="sn-page-heading">
      <div><h1 id="qa-title">Travel Q&amp;A<span>.</span></h1><p>Ask local guides and fellow travelers about your next stop.</p></div>
      <button className="sn-button" onClick={() => profile ? setAsking(true) : openAuthModal()}><Plus size={16} /> Ask a question</button>
    </header>
    <div className="sn-qa-filters">
      <label className="sn-search"><Search size={18} /><input type="search" aria-label="Search questions" placeholder="Search by question or destination" value={query} onChange={event => setQuery(event.target.value)} /></label>
      <select className="sn-field" aria-label="Filter questions by topic" value={category} onChange={event => setCategory(event.target.value as typeof category)}>
        <option value="">All topics</option>
        {categories.map(topic => <option key={topic}>{topic}</option>)}
      </select>
    </div>
    <div className="sn-secondary-stack">
      {threads.map(thread => <article key={thread.id} className="sn-panel sn-panel-padding sn-qa-thread">
        <div className="sn-secondary-actions"><span className="sn-meta"><MapPin size={15} />{thread.destinationName}</span><span className="sn-qa-topic">{thread.category}</span></div>
        <h2>{thread.title}</h2>
        <div className="sn-qa-author"><TravelImage src={thread.author.avatarUrl} alt="" className="sn-avatar" /><strong>{thread.author.fullName}</strong><span>{timeAgo(thread.createdAt)}</span></div>
        <div className="sn-secondary-actions">
          <button className="sn-vote" aria-label="Upvote question" aria-pressed={Boolean(thread.isUpvoted)} onClick={() => upvoteQAThread(thread.id)}><ThumbsUp size={16} />{thread.upvotesCount}</button>
          <span className="sn-meta"><MessageCircle size={16} />{thread.repliesCount} {thread.repliesCount === 1 ? 'reply' : 'replies'}</span>
        </div>
        {thread.replies.length > 0 && <div className="sn-qa-replies">
          {thread.replies.map(item => <div className="sn-qa-reply" key={item.id}>
            <div className="sn-qa-author"><TravelImage src={item.author.avatarUrl} alt="" className="sn-avatar" /><strong>{item.author.fullName}</strong><span>{timeAgo(item.createdAt)}</span></div>
            {item.isVerifiedLocalReply && <span className="sn-meta"><ShieldCheck size={15} /> Verified guide</span>}
            <p>{item.replyText}</p>
            <button className="sn-vote" aria-label="Upvote reply" aria-pressed={Boolean(item.isUpvoted)} onClick={() => upvoteQAReply(thread.id, item.id)}><ThumbsUp size={15} />{item.upvotesCount}</button>
          </div>)}
        </div>}
        <form className="sn-qa-reply-form" onSubmit={event => reply(event, thread.id)}>
          <input className="sn-field" aria-label={`Reply to ${thread.title}`} placeholder={`Reply as ${currentUser.fullName}…`} value={replyInputs[thread.id] || ''} maxLength={1000} onChange={event => {
            const value = event.target.value;
            setReplyInputs(previous => ({ ...previous, [thread.id]: value }));
          }} />
          <button className="sn-button" aria-label="Send reply" disabled={!replyInputs[thread.id]?.trim()}><Send size={16} /></button>
        </form>
      </article>)}
      {threads.length === 0 && <EmptyState title="No questions found" description="Try a different search or start a conversation about your destination." action={<button className="sn-button secondary" onClick={() => { setQuery(''); setCategory(''); }}>Clear filters</button>} />}
    </div>
    {asking && <Modal title="Ask a travel question" onClose={() => setAsking(false)}>
      <form className="sn-secondary-form" onSubmit={ask}>
        <label className="sn-secondary-label">Your question<input className="sn-field" required autoFocus maxLength={200} value={title} onChange={event => setTitle(event.target.value)} placeholder="What would you like to know?" /></label>
        <label className="sn-secondary-label">Destination<select className="sn-field" value={destinationId} onChange={event => setDestinationId(event.target.value)}>{destinations.map(place => <option key={place.id} value={place.id}>{place.name}</option>)}</select></label>
        <label className="sn-secondary-label">Topic<select className="sn-field" value={newCategory} onChange={event => setNewCategory(event.target.value as QAThread['category'])}>{categories.map(topic => <option key={topic}>{topic}</option>)}</select></label>
        <div className="sn-secondary-actions"><button className="sn-button" disabled={!title.trim() || !destinationId}>Post question</button></div>
      </form>
    </Modal>}
  </section>;
}

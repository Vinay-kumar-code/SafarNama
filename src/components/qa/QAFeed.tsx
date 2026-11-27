import { useState, type FormEvent } from 'react';
import { MapPin, MessageCircle, Plus, Search, Send, ShieldCheck, ThumbsUp } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useCommunity } from '../../context/CommunityContext';
import { useAuth } from '../../context/AuthContext';
import { matchesSearch, normalizeSearch, timeAgo } from '../../lib/utils';
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
  const [destinationId, setDestinationId] = useState('');
  const [newCategory, setNewCategory] = useState<QAThread['category']>('Road Conditions');
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [unanswered, setUnanswered] = useState(false);
  const [posting, setPosting] = useState(false);
  const [questionError, setQuestionError] = useState('');
  const [pendingReplies, setPendingReplies] = useState<string[]>([]);
  const [replyErrors, setReplyErrors] = useState<Record<string, string>>({});

  const terms = normalizeSearch(query).split(' ').filter(Boolean);
  const filtersActive = Boolean(terms.length || category || unanswered);
  const threads = qaThreads.filter(thread => (!unanswered || thread.replies.length === 0) &&
    (!category || thread.category === category) && matchesSearch(terms, thread.title, thread.destinationName, thread.category));

  function clearFilters() { setQuery(''); setCategory(''); setUnanswered(false); }

  function openQuestion() {
    if (!profile) { openAuthModal(); return; }
    setQuestionError('');
    setAsking(true);
  }

  async function ask(event: FormEvent) {
    event.preventDefault();
    const destination = destinations.find(place => place.id === destinationId);
    if (!title.trim() || !destination || posting) return;
    setPosting(true);
    setQuestionError('');
    try {
      await addQAQuestion(title.trim(), destination, newCategory);
      setTitle('');
      clearFilters();
      setAsking(false);
    } catch (error) { setQuestionError(error instanceof Error ? error.message : 'Could not post the question.'); }
    finally { setPosting(false); }
  }

  async function reply(event: FormEvent, threadId: string) {
    event.preventDefault();
    const text = replyInputs[threadId]?.trim();
    if (!text || pendingReplies.includes(threadId)) return;
    setPendingReplies(previous => [...previous, threadId]);
    setReplyErrors(previous => ({ ...previous, [threadId]: '' }));
    try {
      await addQAReply(threadId, text);
      setReplyInputs(previous => ({ ...previous, [threadId]: '' }));
    } catch (error) {
      setReplyErrors(previous => ({ ...previous, [threadId]: error instanceof Error ? error.message : 'Could not post the reply.' }));
    } finally { setPendingReplies(previous => previous.filter(id => id !== threadId)); }
  }

  return <section className="sn-secondary-page sn-qa-page" aria-labelledby="qa-title">
    <header className="sn-page-heading">
      <div><h1 id="qa-title">Travel Q&amp;A<span>.</span></h1><p>Ask local guides and fellow travelers about your next stop.</p></div>
      <button className="sn-button" onClick={openQuestion}><Plus size={16} /> Ask a question</button>
    </header>
    <div className="sn-qa-filters">
      <label className="sn-search"><Search size={18} /><input type="search" aria-label="Search questions" placeholder="Search by question or destination" value={query} onChange={event => setQuery(event.target.value)} /></label>
      <select className="sn-field" aria-label="Filter questions by topic" value={category} onChange={event => setCategory(event.target.value as typeof category)}>
        <option value="">All topics</option>
        {categories.map(topic => <option key={topic}>{topic}</option>)}
      </select>
    </div>
    <div className="sn-qa-filter-actions">
      <label><input type="checkbox" checked={unanswered} onChange={event => setUnanswered(event.target.checked)} /> Unanswered only</label>
      {filtersActive && <span className="sn-meta" role="status">{threads.length} {threads.length === 1 ? 'question' : 'questions'}</span>}
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
        {profile ? <form className="sn-qa-reply-form" onSubmit={event => reply(event, thread.id)}>
          <input className="sn-field" aria-label={`Reply to ${thread.title}`} placeholder={`Reply as ${currentUser.fullName}…`} value={replyInputs[thread.id] || ''} disabled={pendingReplies.includes(thread.id)} maxLength={1000} onChange={event => {
            const value = event.target.value;
            setReplyInputs(previous => ({ ...previous, [thread.id]: value }));
          }} />
          <button className="sn-button" aria-label="Send reply" disabled={pendingReplies.includes(thread.id) || !replyInputs[thread.id]?.trim()}><Send size={16} /></button>
          {replyErrors[thread.id] && <p className="sn-form-feedback" role="alert">{replyErrors[thread.id]}</p>}
        </form> : <button className="sn-button secondary sn-qa-signin" onClick={() => openAuthModal()}>Sign in to reply</button>}
      </article>)}
      {threads.length === 0 && <EmptyState title={filtersActive ? 'No matching questions' : 'No questions yet'}
        description={filtersActive ? 'Clear your filters to see more conversations.' : 'Start a conversation about your destination.'}
        action={filtersActive ? <button className="sn-button secondary" onClick={clearFilters}>Clear filters</button>
          : <button className="sn-button secondary" onClick={openQuestion}>Ask a question</button>} />}
    </div>
    {asking && <Modal title="Ask a travel question" onClose={() => { if (!posting) setAsking(false); }}>
      <form className="sn-secondary-form" onSubmit={ask}>
        <fieldset className="sn-secondary-stack sn-form-fields" disabled={posting}>
        <label className="sn-secondary-label">Your question<input className="sn-field" required autoFocus maxLength={200} value={title} onChange={event => setTitle(event.target.value)} placeholder="What would you like to know?" /></label>
        <label className="sn-secondary-label">Destination<select className="sn-field" value={destinationId} required onChange={event => setDestinationId(event.target.value)}><option value="">Choose a place</option>{destinations.map(place => <option key={place.id} value={place.id}>{place.name}</option>)}</select></label>
        <label className="sn-secondary-label">Topic<select className="sn-field" value={newCategory} onChange={event => setNewCategory(event.target.value as QAThread['category'])}>{categories.map(topic => <option key={topic}>{topic}</option>)}</select></label>
        </fieldset>
        {questionError && <p className="sn-form-feedback" role="alert">{questionError}</p>}
        <div className="sn-secondary-actions"><button className="sn-button" disabled={posting || !title.trim() || !destinationId}>{posting ? 'Posting…' : 'Post question'}</button></div>
      </form>
    </Modal>}
  </section>;
}

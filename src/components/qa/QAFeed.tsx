import React, { useState } from 'react';
import { 
  MessageSquareText, 
  MapPin, 
  ThumbsUp, 
  Send, 
  Plus, 
  ShieldCheck, 
  Sparkles, 
  Search, 
  Clock, 
  HelpCircle,
  Users
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { timeAgo } from '../../lib/utils';
import { QAThread } from '../../types';

export const QAFeed: React.FC = () => {
  const { 
    qaThreads, 
    addQAQuestion, 
    addQAReply, 
    upvoteQAThread, 
    upvoteQAReply, 
    currentUser 
  } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAskModal, setShowAskModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDestination, setNewDestination] = useState('Spiti Valley');
  const [newCategory, setNewCategory] = useState<QAThread['category']>('Road Conditions');
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});

  const categories: { id: string; label: string; icon: string }[] = [
    { id: 'all', label: 'All Queries', icon: '💬' },
    { id: 'Road Conditions', label: 'Roads & Passes', icon: '🛣️' },
    { id: 'Safety', label: 'Safety & Solo Travel', icon: '🛡️' },
    { id: 'Food & Stays', label: 'Food & Homestays', icon: '🍲' },
    { id: 'Permits & Weather', label: 'Permits & Weather', icon: '📄' },
  ];

  const filteredThreads = qaThreads.filter(t => {
    const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory;
    const matchesSearch = searchQuery === '' ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.destinationName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCreateQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    addQAQuestion(newTitle.trim(), newDestination, newCategory);
    setNewTitle('');
    setShowAskModal(false);
  };

  const handleSendReply = (threadId: string) => {
    const text = replyInputs[threadId]?.trim();
    if (!text) return;
    addQAReply(threadId, text);
    setReplyInputs(prev => ({ ...prev, [threadId]: '' }));
  };

  return (
    <div className="w-full h-[calc(100dvh-57px-60px)] md:h-[calc(100vh-65px)] overflow-y-auto bg-[#090a0f] p-4 md:p-8 no-scrollbar">
      <div className="max-w-6xl mx-auto space-y-6 pb-12">
        
        {/* =====================================================================
            DESKTOP & MOBILE RESPONSIVE FORUM GRID
           ===================================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          
          {/* Left Column (Desktop: 4 cols, Mobile: Top Header) */}
          <div className="md:col-span-4 space-y-5">
            
            {/* Title & Ask Button */}
            <div className="p-5 rounded-3xl bg-slate-900 border border-white/10 shadow-xl space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-wider">
                <MessageSquareText className="w-4 h-4" />
                <span>Live Location Q&A</span>
              </div>

              <h1 className="text-xl md:text-2xl font-black text-white leading-tight">
                Ask Locals & Recent Explorers
              </h1>

              <p className="text-xs text-slate-300 leading-relaxed">
                Location-pinned answers from verified guides on high passes, road status, satvik meals, and permits.
              </p>

              <button
                onClick={() => setShowAskModal(true)}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Ask a Local Question</span>
              </button>
            </div>

            {/* Desktop Category Sidebar (hidden on mobile, pills on mobile) */}
            <div className="hidden md:block p-4 rounded-3xl bg-slate-900/80 border border-white/10 shadow-lg space-y-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block px-2 mb-2">
                Filter by Topic
              </span>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                    selectedCategory === cat.id
                      ? 'bg-orange-500 text-white shadow-md'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                  </span>
                  <span className="text-[10px] opacity-70">
                    {cat.id === 'all' 
                      ? qaThreads.length 
                      : qaThreads.filter(t => t.category === cat.id).length}
                  </span>
                </button>
              ))}
            </div>

          </div>

          {/* Right Column (Desktop: 8 cols, Mobile: full width) */}
          <div className="md:col-span-8 space-y-4">
            
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search queries (e.g. Kunzum pass, satvik food, ILP permits)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-orange-500 shadow-inner"
              />
            </div>

            {/* Mobile Horizontal Category Pills (md:hidden) */}
            <div className="md:hidden flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all border ${
                    selectedCategory === cat.id
                      ? 'bg-orange-500 text-white border-orange-400 shadow-md'
                      : 'bg-slate-900 text-slate-400 border-white/10 hover:border-white/20'
                  }`}
                >
                  {cat.icon} {cat.label}
                </button>
              ))}
            </div>

            {/* Ask Question Modal / Form */}
            {showAskModal && (
              <div className="p-5 rounded-3xl bg-slate-900 border border-orange-500/40 shadow-2xl animate-fade-in space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-orange-400" />
                  <span>Ask Local Guides & Travelers</span>
                </h3>

                <form onSubmit={handleCreateQuestion} className="space-y-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Your Question</label>
                    <input
                      type="text"
                      placeholder="e.g. Is the road between Gramphu and Kaza open today?"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Destination Hub</label>
                      <select
                        value={newDestination}
                        onChange={(e) => setNewDestination(e.target.value)}
                        className="w-full bg-slate-800 border border-white/10 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none"
                      >
                        <option value="Spiti Valley">Spiti Valley, HP</option>
                        <option value="Varanasi">Varanasi, UP</option>
                        <option value="Meghalaya">Meghalaya (Sohra)</option>
                        <option value="Old Delhi">Old Delhi</option>
                        <option value="Hampi">Hampi, Karnataka</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Category</label>
                      <select
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value as QAThread['category'])}
                        className="w-full bg-slate-800 border border-white/10 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none"
                      >
                        <option value="Road Conditions">Road Conditions</option>
                        <option value="Safety">Safety</option>
                        <option value="Food & Stays">Food & Stays</option>
                        <option value="Permits & Weather">Permits & Weather</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="submit"
                      className="flex-1 py-2 rounded-xl bg-orange-500 text-white font-bold text-xs shadow-md"
                    >
                      Post Question
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAskModal(false)}
                      className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Threads List */}
            <div className="space-y-4">
              {filteredThreads.map(thread => (
                <div
                  key={thread.id}
                  className="p-5 rounded-3xl bg-slate-900 border border-white/10 shadow-lg space-y-3 hover:border-white/20 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-[10px] font-bold border border-orange-500/30 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {thread.destinationName}
                      </span>
                      <span className="text-xs text-slate-400">
                        {thread.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Clock className="w-3 h-3" />
                      <span>{timeAgo(thread.createdAt)}</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white leading-snug">
                      {thread.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Asked by @{thread.author.username}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 pt-1">
                    <button
                      onClick={() => upvoteQAThread(thread.id)}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                        thread.isUpvoted
                          ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                          : 'bg-slate-800 text-slate-300 hover:text-white border border-white/5'
                      }`}
                    >
                      <ThumbsUp className={`w-3.5 h-3.5 ${thread.isUpvoted ? 'fill-current' : ''}`} />
                      <span>{thread.upvotesCount}</span>
                    </button>
                    <span className="text-xs text-slate-400">
                      {thread.replies.length} {thread.replies.length === 1 ? 'reply' : 'replies'}
                    </span>
                  </div>

                  {/* Replies List */}
                  <div className="space-y-2.5 pt-3 border-t border-white/5">
                    {thread.replies.map(reply => (
                      <div
                        key={reply.id}
                        className={`p-3.5 rounded-2xl text-xs space-y-1.5 ${
                          reply.isVerifiedLocalReply
                            ? 'bg-emerald-950/20 border border-emerald-500/30'
                            : 'bg-slate-800/60 border border-white/5'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <img
                              src={reply.author.avatarUrl}
                              alt={reply.author.fullName}
                              className="w-6 h-6 rounded-full object-cover"
                            />
                            <span className="font-bold text-white text-xs">
                              {reply.author.fullName}
                            </span>
                            {reply.isVerifiedLocalReply && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center gap-1 border border-emerald-500/40">
                                <ShieldCheck className="w-3 h-3" />
                                Verified Guide
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {timeAgo(reply.createdAt)}
                          </span>
                        </div>

                        <p className="text-slate-200 leading-relaxed pl-8 text-xs">
                          {reply.replyText}
                        </p>

                        <div className="flex justify-end pt-1">
                          <button
                            onClick={() => upvoteQAReply(thread.id, reply.id)}
                            className={`flex items-center gap-1 text-xs font-semibold transition-colors ${
                              reply.isUpvoted ? 'text-orange-400' : 'text-slate-400 hover:text-slate-300'
                            }`}
                          >
                            <ThumbsUp className="w-3 h-3" />
                            <span>{reply.upvotesCount}</span>
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Quick Reply Form */}
                    <div className="flex items-center gap-2 pt-2">
                      <input
                        type="text"
                        placeholder={`Reply as ${currentUser.fullName}...`}
                        value={replyInputs[thread.id] || ''}
                        onChange={(e) => setReplyInputs(prev => ({ ...prev, [thread.id]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSendReply(thread.id);
                        }}
                        className="flex-1 bg-slate-800 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-orange-500"
                      />
                      <button
                        onClick={() => handleSendReply(thread.id)}
                        className="p-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white transition-all shadow-md shrink-0"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                </div>
              ))}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

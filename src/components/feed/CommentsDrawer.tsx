import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Heart, 
  Send, 
  ShieldCheck, 
  Smile, 
  CornerDownRight, 
  MessageCircle,
  Sparkles
} from 'lucide-react';
import { Post } from '../../types';
import { useApp } from '../../context/AppContext';
import { timeAgo, triggerHaptic } from '../../lib/utils';

export interface ReelComment {
  id: string;
  postId: string;
  author: {
    id: string;
    username: string;
    fullName: string;
    avatarUrl: string;
    isVerifiedGuide?: boolean;
  };
  text: string;
  createdAt: string;
  likesCount: number;
  isLiked?: boolean;
  replyToUsername?: string;
}

// Initial realistic travel community comments mapped by postId
const INITIAL_COMMENTS: Record<string, ReelComment[]> = {
  'post-001': [
    {
      id: 'c-001-1',
      postId: 'post-001',
      author: {
        id: 'u-101',
        username: 'roaming_ladakhi',
        fullName: 'Stanzin Dorje',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
        isVerifiedGuide: true,
      },
      text: 'Crossed Chicham yesterday at 9 AM! Wind was mild, but always double check tyre pressure after Kaza 🏔️🏍️',
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      likesCount: 24,
      isLiked: false,
    },
    {
      id: 'c-001-2',
      postId: 'post-001',
      author: {
        id: 'u-102',
        username: 'shreya_wanderlust',
        fullName: 'Shreya Kapoor',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
      },
      text: 'That gorge depth is mind-blowing! Is it safe to park a Royal Enfield on the bridge for a quick photo?',
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      likesCount: 9,
      isLiked: true,
    },
    {
      id: 'c-001-3',
      postId: 'post-001',
      author: {
        id: 'user-002',
        username: 'tenzin_spitilocal',
        fullName: 'Tenzin Norbu',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
        isVerifiedGuide: true,
      },
      text: '@shreya_wanderlust Yes, safe for 2-3 mins on the pedestrian curb, but keep bike on main stand due to crosswinds!',
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      likesCount: 16,
      replyToUsername: 'shreya_wanderlust',
    },
  ],
  'post-002': [
    {
      id: 'c-002-1',
      postId: 'post-002',
      author: {
        id: 'u-103',
        username: 'delhi_foodie_aman',
        fullName: 'Aman Mathur',
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
      },
      text: 'The chili powder in the air at Gadodia rooftop is no joke! Don’t forget a cotton mask or rumal 🌶️🔥',
      createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
      likesCount: 18,
    },
    {
      id: 'c-002-2',
      postId: 'post-002',
      author: {
        id: 'u-104',
        username: 'ananya_explorer',
        fullName: 'Ananya Bose',
        avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
        isVerifiedGuide: true,
      },
      text: 'The view of Fatehpuri Masjid domes from up there during afternoon azan is sublime ❤️',
      createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
      likesCount: 12,
    },
  ],
  'post-003': [
    {
      id: 'c-003-1',
      postId: 'post-003',
      author: {
        id: 'u-105',
        username: 'ganga_yatrik',
        fullName: 'Devendra Pandey',
        avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=80',
        isVerifiedGuide: true,
      },
      text: 'Subah-e-Banaras classical flute performance at Assi Ghat starts at 5:00 AM sharp. Don’t miss it! 🪈✨',
      createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
      likesCount: 31,
    },
    {
      id: 'c-003-2',
      postId: 'post-003',
      author: {
        id: 'u-106',
        username: 'meera_travels',
        fullName: 'Meera Nambiar',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
      },
      text: 'Feeding the Siberian gulls at sunrise while rowing past Chet Singh Ghat is pure tranquility 🙏',
      createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
      likesCount: 15,
    },
  ],
};

const QUICK_EMOJIS = ['❤️', '🙌', '🔥', '👏', '😍', '🏔️', '🛵', '🇮🇳', '✨', '☕'];

interface CommentsDrawerProps {
  isOpen: boolean;
  post: Post | null;
  onClose: () => void;
  onCommentAdded?: (postId: string, newComment: ReelComment) => void;
}

export const CommentsDrawer: React.FC<CommentsDrawerProps> = ({
  isOpen,
  post,
  onClose,
  onCommentAdded,
}) => {
  const { currentUser } = useApp();
  const [comments, setComments] = useState<ReelComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  // Sync or initialize comments when post opens
  useEffect(() => {
    if (!post) return;
    const existing = INITIAL_COMMENTS[post.id] || [
      {
        id: `c-default-1-${post.id}`,
        postId: post.id,
        author: {
          id: 'u-default',
          username: 'wander_soul',
          fullName: 'Vikram Mehta',
          avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
          isVerifiedGuide: false,
        },
        text: `Incredible glimpse of ${post.spotName}! Adding this to my next itinerary 📍✨`,
        createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
        likesCount: 7,
      },
    ];
    setComments(existing);
    setReplyingTo(null);
    setCommentText('');
  }, [post?.id, post?.spotName]);

  if (!isOpen || !post) return null;

  const handleToggleLikeComment = (commentId: string) => {
    triggerHaptic('like');
    setComments(prev =>
      prev.map(c => {
        if (c.id === commentId) {
          const isLiked = !c.isLiked;
          return {
            ...c,
            isLiked,
            likesCount: isLiked ? c.likesCount + 1 : Math.max(0, c.likesCount - 1),
          };
        }
        return c;
      })
    );
  };

  const handleReplyClick = (username: string) => {
    triggerHaptic('light');
    setReplyingTo(username);
    setCommentText(`@${username} `);
    inputRef.current?.focus();
  };

  const handleEmojiClick = (emoji: string) => {
    triggerHaptic('light');
    setCommentText(prev => prev + emoji);
    inputRef.current?.focus();
  };

  const handlePostComment = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!commentText.trim()) return;

    triggerHaptic('medium');

    const newComment: ReelComment = {
      id: `comment-${Date.now()}`,
      postId: post.id,
      author: {
        id: currentUser.id,
        username: currentUser.username,
        fullName: currentUser.fullName,
        avatarUrl: currentUser.avatarUrl,
        isVerifiedGuide: currentUser.isVerifiedGuide,
      },
      text: commentText.trim(),
      createdAt: new Date().toISOString(),
      likesCount: 0,
      isLiked: false,
      replyToUsername: replyingTo || undefined,
    };

    setComments(prev => [newComment, ...prev]);
    onCommentAdded?.(post.id, newComment);

    setCommentText('');
    setReplyingTo(null);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-auto">
        {/* Backdrop Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Sliding Bottom Sheet */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="relative w-full max-w-md bg-[#12141c] border-t border-white/15 rounded-t-3xl shadow-2xl flex flex-col h-[75vh] max-h-[85vh] z-10 overflow-hidden"
        >
          {/* Instagram Pull Handle */}
          <div className="w-full pt-2.5 pb-1 flex justify-center cursor-pointer" onClick={onClose}>
            <div className="w-10 h-1 bg-white/25 rounded-full hover:bg-white/40 transition-colors" />
          </div>

          {/* Header */}
          <div className="px-4 py-2 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white text-base">Comments</h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold border border-white/10">
                {comments.length}
              </span>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Comments List */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 no-scrollbar">
            {comments.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12 text-slate-400">
                <MessageCircle className="w-10 h-10 stroke-1 text-slate-500 mb-2" />
                <p className="text-sm font-semibold text-slate-300">No comments yet</p>
                <p className="text-xs text-slate-500 mt-0.5">Start the conversation about this spot!</p>
              </div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="flex items-start gap-3 group">
                  {/* Commenter Avatar with guide ring */}
                  <img
                    src={comment.author.avatarUrl}
                    alt={comment.author.fullName}
                    className="w-9 h-9 rounded-full object-cover shrink-0 border border-white/20 mt-0.5"
                  />

                  {/* Comment Body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-white tracking-tight">
                        {comment.author.username}
                      </span>

                      {comment.author.isVerifiedGuide && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] px-1 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-400/30">
                          <ShieldCheck className="w-2.5 h-2.5" />
                          Guide
                        </span>
                      )}

                      <span className="text-[10px] text-slate-400">
                        {timeAgo(comment.createdAt)}
                      </span>
                    </div>

                    {/* Text */}
                    <p className="text-xs text-slate-200 mt-1 leading-relaxed break-words">
                      {comment.replyToUsername && (
                        <span className="text-orange-400 font-semibold mr-1">
                          @{comment.replyToUsername}
                        </span>
                      )}
                      {comment.text.replace(new RegExp(`^@${comment.replyToUsername}\\s*`), '')}
                    </p>

                    {/* Action Row */}
                    <div className="flex items-center gap-4 mt-1.5 text-[11px] text-slate-400 font-medium">
                      <button
                        onClick={() => handleReplyClick(comment.author.username)}
                        className="hover:text-orange-400 transition-colors"
                      >
                        Reply
                      </button>
                    </div>
                  </div>

                  {/* Like Comment Heart Button */}
                  <button
                    onClick={() => handleToggleLikeComment(comment.id)}
                    className="shrink-0 flex flex-col items-center pt-1 group-active:scale-125 transition-transform"
                  >
                    <Heart
                      className={`w-4 h-4 transition-colors ${
                        comment.isLiked
                          ? 'fill-rose-500 text-rose-500'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    />
                    {comment.likesCount > 0 && (
                      <span className={`text-[9px] mt-0.5 ${comment.isLiked ? 'text-rose-400 font-bold' : 'text-slate-400'}`}>
                        {comment.likesCount}
                      </span>
                    )}
                  </button>
                </div>
              ))
            )}
            <div ref={commentsEndRef} />
          </div>

          {/* Quick Reaction Emoji Strip */}
          <div className="px-3 py-1.5 bg-[#0a0c12] border-t border-white/5 flex items-center justify-between overflow-x-auto no-scrollbar">
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleEmojiClick(emoji)}
                className="text-lg p-1 hover:scale-125 active:scale-95 transition-transform"
                title="Quick Reaction"
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Replying Banner if active */}
          {replyingTo && (
            <div className="px-4 py-1 bg-slate-900 border-t border-white/5 flex items-center justify-between text-xs text-slate-300">
              <span className="flex items-center gap-1.5">
                <CornerDownRight className="w-3.5 h-3.5 text-orange-400" />
                Replying to <span className="font-bold text-orange-400">@{replyingTo}</span>
              </span>
              <button
                onClick={() => {
                  setReplyingTo(null);
                  setCommentText('');
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Input Bar */}
          <form
            onSubmit={handlePostComment}
            className="px-4 py-3 bg-[#12141c] border-t border-white/10 flex items-center gap-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
          >
            {/* Current User Avatar */}
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.fullName}
              className="w-8 h-8 rounded-full object-cover border border-orange-500/50 shrink-0"
            />

            {/* Input Field */}
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={`Add a comment for @${post.author.username}...`}
                className="w-full bg-slate-900/90 text-white placeholder-slate-400 text-xs rounded-full py-2 px-3.5 pr-8 border border-white/15 focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>

            {/* Post Button */}
            <button
              type="submit"
              disabled={!commentText.trim()}
              className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all flex items-center gap-1 ${
                commentText.trim()
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/30 hover:brightness-110 active:scale-95'
                  : 'text-slate-500 cursor-not-allowed opacity-50'
              }`}
            >
              <span>Post</span>
              <Send className="w-3 h-3" />
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

import React, { useState, useEffect } from 'react';
import { backendAPI } from '../api/api';
import { FiSend, FiMessageSquare, FiUser } from 'react-icons/fi';

function CommentsSection({ animeId, animeData }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [animeId]);

  const fetchComments = async () => {
    try {
      const res = await backendAPI.get(`/comments/${animeId}`);
      setComments(res.data);
    } catch (err) {
      console.error('Fetch comments error:', err);
    }
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || loading) return;

    setLoading(true);
    try {
      await backendAPI.post('/comments', {
        anime_id: animeId,
        content: newComment,
        // Send anime data for caching if it doesn't exist
        title: animeData.title,
        title_english: animeData.title_english,
        image_url: animeData.images?.jpg?.large_image_url,
        synopsis: animeData.synopsis,
        type: animeData.type,
        score: animeData.score,
        status: animeData.status
      });
      setNewComment('');
      fetchComments();
    } catch (err) {
      console.error('Post comment error:', err);
      alert('Failed to post comment. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <FiMessageSquare className="text-anime-primary" /> Comments ({comments.length})
      </h2>

      {/* Post Comment Form */}
      <form onSubmit={handlePostComment} className="glass-card p-4 flex gap-4">
        <div className="w-10 h-10 rounded-full bg-anime-800 flex items-center justify-center shrink-0 border border-white/10">
          <FiUser className="text-anime-muted" />
        </div>
        <div className="flex-1 relative">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="w-full bg-anime-900/50 border border-white/10 rounded-xl py-2 px-4 text-sm focus:outline-none focus:border-anime-primary transition-all resize-none min-h-[40px]"
            rows="2"
          />
          <button
            type="submit"
            disabled={loading}
            className="absolute right-2 bottom-2 p-2 text-anime-primary hover:text-anime-accent disabled:opacity-50 transition-colors"
          >
            <FiSend />
          </button>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-anime-muted text-center py-10 italic">No comments yet. Be the first to share your thoughts!</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="glass-card p-4 flex gap-4">
              <div className="w-10 h-10 rounded-full bg-anime-primary/20 flex items-center justify-center shrink-0 border border-anime-primary/30">
                <FiUser className="text-anime-primary" />
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm">{comment.username}</span>
                  <span className="text-[10px] text-anime-muted">
                    {new Date(comment.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-anime-text leading-relaxed">{comment.content}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default CommentsSection;

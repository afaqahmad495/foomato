import React, { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../../lib/api';
import './CommentsSheet.css';

function timeAgo(value) {
  if (!value) return '';
  const t = new Date(value).getTime();
  if (!Number.isFinite(t)) return '';
  const diff = Math.max(0, Date.now() - t);
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  const w = Math.floor(d / 7);
  if (w < 4) return `${w}w`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo`;
  const y = Math.floor(d / 365);
  return `${y}y`;
}

const CommentsSheet = ({
  open,
  foodId,
  onClose,
  onCommentAdded,
}) => {
  const [shouldRender, setShouldRender] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);
  const listRef = useRef(null);
  const inputRef = useRef(null);

  const title = useMemo(() => {
    const n = comments.length;
    if (!n) return 'Comments';
    return n === 1 ? '1 comment' : `${n} comments`;
  }, [comments.length]);

  const scrollToBottom = () => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  };

  useEffect(() => {
    if (!open || !foodId) return;
    setError('');
    setLoading(true);
    let mounted = true;
    (async () => {
      try {
        const res = await api.get(`/api/comments/${foodId}?limit=100&skip=0`);
        if (!mounted) return;
        setComments(res?.data?.comments || []);
        setTimeout(scrollToBottom, 0);
      } catch (err) {
        if (!mounted) return;
        setError(err?.response?.data?.message || 'Failed to load comments');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    setTimeout(() => inputRef.current?.focus?.(), 220);
    return () => { mounted = false; };
  }, [open, foodId]);

  useEffect(() => {
    if (open && foodId) {
      setShouldRender(true);
      // allow next paint so animations feel smooth
      setTimeout(() => setIsOpen(true), 0);
      return;
    }

    // closing
    if (shouldRender) {
      setIsOpen(false);
      const t = setTimeout(() => {
        setShouldRender(false);
        setComments([]);
        setText('');
        setError('');
      }, 260);
      return () => clearTimeout(t);
    }
  }, [open, foodId, shouldRender]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  const postComment = async (e) => {
    e.preventDefault();
    const msg = String(text || '').trim();
    if (!msg) return;

    setPosting(true);
    setError('');
    try {
      const res = await api.post(`/api/comments/${foodId}`, { text: msg });
      const newComment = res?.data?.comment;
      if (newComment) {
        setComments(prev => [...prev, newComment]);
        onCommentAdded?.(foodId, newComment);
        setText('');
        setTimeout(scrollToBottom, 0);
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to post comment');
    } finally {
      setPosting(false);
    }
  };

  if (!shouldRender || !foodId) return null;

  return (
    <div className="cs-root" role="dialog" aria-modal="true">
      <button
        className={`cs-overlay ${isOpen ? 'cs-overlay--in' : 'cs-overlay--out'}`}
        aria-label="Close comments"
        onClick={onClose}
      />

      <div className={`cs-sheet ${isOpen ? 'cs-sheet--open' : 'cs-sheet--closing'}`}>
        <div className="cs-grab" aria-hidden>
          <div className="cs-grab-bar" />
        </div>

        <div className="cs-header">
          <div className="cs-title">{title}</div>
          <button className="cs-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className={`cs-error ${error ? '' : 'cs-error--hidden'}`} aria-live="polite">
          {error || ''}
        </div>

        <div className="cs-list" ref={listRef}>
          {loading ? (
            <div className="cs-empty">Loading...</div>
          ) : !comments.length ? (
            <div className="cs-empty">No comments yet. Be the first.</div>
          ) : (
            comments.map((c) => {
              const username = c?.user?.username || 'User';
              const initial = String(username).trim().slice(0, 1).toUpperCase() || 'U';
              return (
                <div className="cs-item" key={c._id}>
                  <div className="cs-avatar" aria-hidden>{initial}</div>
                  <div className="cs-body">
                    <div className="cs-line">
                      <span className="cs-user">{username}</span>
                      <span className="cs-time">{timeAgo(c.createdAt)}</span>
                    </div>
                    <div className="cs-text">{c.text}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <form className="cs-composer" onSubmit={postComment}>
          <input
            ref={inputRef}
            className="cs-input"
            placeholder="Add a comment..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={500}
            disabled={posting}
          />
          <button className="cs-post" type="submit" disabled={posting || !String(text || '').trim()}>
            {posting ? 'Posting...' : 'Post'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CommentsSheet;

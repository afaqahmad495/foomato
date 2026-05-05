import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import './Comments.css';

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

const Comments = () => {
  const navigate = useNavigate();
  const { foodId } = useParams();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);
  const listRef = useRef(null);

  const total = comments.length;
  const title = useMemo(() => (total === 1 ? '1 comment' : `${total} comments`), [total]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get(`/api/comments/${foodId}?limit=100&skip=0`);
        if (!mounted) return;
        setComments(res?.data?.comments || []);
      } catch (err) {
        const status = err?.response?.status;
        if (status === 401) {
          navigate(`/user/login?next=/comments/${foodId}`, { replace: true });
          return;
        }
        if (mounted) setError(err?.response?.data?.message || 'Failed to load comments');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [foodId, navigate]);

  const scrollToBottom = () => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  };

  useEffect(() => {
    if (!loading) scrollToBottom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  const postComment = async (e) => {
    e.preventDefault();
    const msg = String(text || '').trim();
    if (!msg) return;

    setPosting(true);
    setError('');
    try {
      const res = await api.post(`/api/comments/${foodId}`, { text: msg });
      const newComment = res?.data?.comment;
      setComments(prev => [...prev, ...(newComment ? [newComment] : [])]);
      setText('');
      setTimeout(scrollToBottom, 0);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to post comment');
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="cwrap">
      <div className="cheader">
        <button className="cclose" onClick={() => navigate(-1)}>Close</button>
        <div className="ctitle">Comments</div>
        <div className="cmeta">{loading ? '' : title}</div>
      </div>

      {error ? <div className="cerror">{error}</div> : null}

      <div className="clist" ref={listRef}>
        {loading ? (
          <div className="cempty">Loading...</div>
        ) : !comments.length ? (
          <div className="cempty">No comments yet. Be the first.</div>
        ) : (
          comments.map((c) => {
            const username = c?.user?.username || 'User';
            const initial = String(username).trim().slice(0, 1).toUpperCase() || 'U';
            return (
              <div className="citem" key={c._id}>
                <div className="cavatar" aria-hidden>{initial}</div>
                <div className="cbody">
                  <div className="cline">
                    <span className="cuser">{username}</span>
                    <span className="ctime">{timeAgo(c.createdAt)}</span>
                  </div>
                  <div className="ctext">{c.text}</div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <form className="ccomposer" onSubmit={postComment}>
        <input
          className="cinput"
          placeholder="Add a comment..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={500}
          disabled={posting}
        />
        <button className="cpost" type="submit" disabled={posting || !String(text || '').trim()}>
          {posting ? 'Posting...' : 'Post'}
        </button>
      </form>
    </div>
  );
};

export default Comments;


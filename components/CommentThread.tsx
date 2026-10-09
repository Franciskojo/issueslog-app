'use client';

import { IComment } from '@/models/Issue';
import styles from './CommentThread.module.css';
import { useState } from 'react';
import { Send, MessageSquare } from './icons';

interface Props {
  comments: IComment[];
  issueId: string;
  currentUserId: string;
  onCommentAdded: (comment: IComment) => void;
  compact?: boolean; // When true, hides the comment list (used in timeline mode)
}

function timeAgo(date: Date | string): string {
  const now = new Date(), d = new Date(date);
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000), hours = Math.floor(diff / 3600000), days = Math.floor(diff / 86400000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export default function CommentThread({ comments, issueId, onCommentAdded, compact }: Props) {
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(`/api/issues/${issueId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onCommentAdded(data.comment);
      setMessage('');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      {/* Only show full comment list when not in compact/timeline mode */}
      {!compact && (
        <>
          <div className={styles.heading}>
            <MessageSquare size={14} />
            <span>Comments ({(comments || []).length})</span>
          </div>

          {(!comments || comments.length === 0) && (
            <p className={styles.empty}>No comments yet. Be the first to respond.</p>
          )}

          <div className={styles.thread}>
            {(comments || []).map((c, i) => {
              const authorName = c.authorName || 'User';
              const authorRole = c.authorRole || 'user';
              const isTech = authorRole === 'tech' || authorRole === 'admin';
              return (
                <div key={i} className={`${styles.comment} ${isTech ? styles.techComment : ''}`}>
                  <div className={styles.avatar}>
                    {authorName.charAt(0).toUpperCase()}
                  </div>
                  <div className={styles.body}>
                    <div className={styles.meta}>
                      <strong className={styles.author}>{authorName}</strong>
                      <span className={`badge ${isTech ? 'badge-role-tech' : 'badge-role-nontech'}`}>
                        {authorRole}
                      </span>
                      <span className={styles.time}>{c.createdAt ? timeAgo(c.createdAt) : 'just now'}</span>
                    </div>
                    <p className={styles.message}>{c.message}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Composer */}
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.textareaWrapper}>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Add a comment…"
            className={styles.textarea}
            rows={3}
            required
          />
          <div className={styles.composerFooter}>
            <span className={styles.charCount}>{message.length} chars</span>
            <button
              type="submit"
              className={`btn btn-primary btn-sm ${styles.sendBtn}`}
              disabled={submitting || !message.trim()}
            >
              <Send size={12} />
              {submitting ? 'Posting…' : 'Post Comment'}
            </button>
          </div>
        </div>
        {error && <p className="alert alert-error">{error}</p>}
      </form>
    </div>
  );
}

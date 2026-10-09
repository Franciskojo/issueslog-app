'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import CommentThread from './CommentThread';
import Avatar from './Avatar';
import PillSelect from './PillSelect';
import { X, ArrowUpRight, Trash2, Calendar, Tag, Building2, User, FileText, Paperclip, Activity, Download } from './icons';
import styles from './IssueDrawer.module.css';
import {
  statusMeta, priorityMeta, STATUS_ORDER, PRIORITY_ORDER,
  timeAgo, shortId, toDateInput,
  type IssueListItem, type IssuePatch, type TechUser,
} from '@/lib/issueMeta';
import type { IComment } from '@/models/Issue';

interface FullIssue extends Omit<IssueListItem, 'comments'> {
  comments: IComment[];
  attachments: { filename: string; originalName: string; mimetype: string; size: number; url: string }[];
  statusHistory: { status: string; changedBy: string; changedAt: string }[];
}

interface Props {
  /** Row data from the list — the source of truth for editable fields. */
  summary: IssueListItem;
  canEdit: boolean;
  canDelete: boolean;
  techUsers: TechUser[];
  currentUserId: string;
  onClose: () => void;
  onUpdate: (id: string, patch: IssuePatch) => void;
  onCommentAdded: (id: string, comment: IComment) => void;
  onDeleted: (id: string) => void;
}

const statusOptions = STATUS_ORDER.map((s) => ({ value: s, ...statusMeta[s] }));
const priorityOptions = PRIORITY_ORDER.map((p) => ({ value: p, ...priorityMeta[p] }));

export default function IssueDrawer({
  summary, canEdit, canDelete, techUsers, currentUserId,
  onClose, onUpdate, onCommentAdded, onDeleted,
}: Props) {
  const id = summary._id;
  const [full, setFull] = useState<FullIssue | null>(null);
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  // Fetch details (comments / attachments / history). Refetch when the status changes so history stays current.
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/issues/${id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => { if (!cancelled) { setFull(d.issue); setLoadedId(id); setFailed(false); } })
      .catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, [id, summary.status]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const detail = full && loadedId === id ? full : null;

  const handleDelete = async () => {
    if (!confirm('Delete this issue? This cannot be undone.')) return;
    const res = await fetch(`/api/issues/${id}`, { method: 'DELETE' });
    if (res.ok) onDeleted(id);
  };

  const timeline = detail
    ? [
        ...(detail.comments || []).map((c) => ({ type: 'comment' as const, ts: String(c.createdAt || ''), c })),
        ...(detail.statusHistory || []).map((h) => ({ type: 'status' as const, ts: h.changedAt, h })),
      ].sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime())
    : [];

  return (
    <aside className={styles.drawer} aria-label="Issue details">
      <header className={styles.top}>
        <span className={`mono ${styles.id}`}>#{shortId(id)}</span>
        <div className={styles.topActions}>
          <Link href={`/issues/${id}`} className={styles.iconBtn} title="Open full page" aria-label="Open full page">
            <ArrowUpRight size={15} />
          </Link>
          {canDelete && (
            <button type="button" className={`${styles.iconBtn} ${styles.danger}`} onClick={handleDelete} title="Delete issue" aria-label="Delete issue">
              <Trash2 size={15} />
            </button>
          )}
          <button type="button" className={styles.iconBtn} onClick={onClose} title="Close (Esc)" aria-label="Close panel">
            <X size={16} />
          </button>
        </div>
      </header>

      <div className={styles.scroll}>
        <h2 className={styles.title}>{summary.title}</h2>

        <dl className={styles.fields}>
          <dt><User size={13} />Assignee</dt>
          <dd>
            <label className={`${styles.assignee} ${canEdit ? styles.editable : ''}`}>
              <Avatar name={summary.assignedToName} size={22} />
              <span>{summary.assignedToName || 'Unassigned'}</span>
              {canEdit && (
                <select
                  className={styles.overlay}
                  aria-label="Assignee"
                  value={summary.assignedTo || ''}
                  onChange={(e) => {
                    const u = techUsers.find((t) => t._id === e.target.value);
                    onUpdate(id, { assignedTo: u?._id ?? null, assignedToName: u?.name ?? null });
                  }}
                >
                  <option value="">Unassigned</option>
                  {techUsers.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
                </select>
              )}
            </label>
          </dd>

          <dt><Calendar size={13} />Due date</dt>
          <dd>
            {canEdit ? (
              <input
                type="date"
                className={styles.dateInput}
                aria-label="Due date"
                value={toDateInput(summary.dueDate)}
                onChange={(e) => onUpdate(id, { dueDate: e.target.value || null })}
              />
            ) : (
              <span className={styles.plain}>
                {summary.dueDate ? new Date(summary.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) : 'No due date'}
              </span>
            )}
          </dd>

          <dt><Activity size={13} />Status</dt>
          <dd>
            <PillSelect ariaLabel="Status" value={summary.status} options={statusOptions} disabled={!canEdit} onChange={(v) => onUpdate(id, { status: v })} />
          </dd>

          <dt><Tag size={13} />Priority</dt>
          <dd>
            <PillSelect variant="tint" ariaLabel="Priority" value={summary.priority} options={priorityOptions} disabled={!canEdit} onChange={(v) => onUpdate(id, { priority: v })} />
          </dd>

          <dt><Building2 size={13} />Department</dt>
          <dd><span className={styles.plain}>{summary.submittedByDepartment}</span></dd>

          <dt><Tag size={13} />Category</dt>
          <dd><span className={styles.plain}>{summary.category}</span></dd>
        </dl>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}><FileText size={13} />Description</h3>
          <p className={styles.description}>{summary.description}</p>
        </section>

        {failed && !detail && <p className={styles.note}>Couldn’t load activity for this issue.</p>}

        {detail && detail.attachments?.length > 0 && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}><Paperclip size={13} />Attachments <span className={styles.count}>{detail.attachments.length}</span></h3>
            <div className={styles.attachments}>
              {detail.attachments.map((a, i) => (
                <a key={i} href={a.url} target="_blank" rel="noopener noreferrer" className={styles.attachment}>
                  {a.mimetype.startsWith('image/')
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={a.url} alt={a.originalName} />
                    : <span className={styles.fileIcon}><FileText size={18} /></span>}
                  <span className={styles.attachName}>{a.originalName}</span>
                  <Download size={12} />
                </a>
              ))}
            </div>
          </section>
        )}

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}><Activity size={13} />Activity {detail && <span className={styles.count}>{timeline.length}</span>}</h3>

          {!detail && !failed && <div className={`skeleton ${styles.skel}`} />}

          {detail && timeline.length === 0 && <p className={styles.note}>No activity yet.</p>}

          {detail && (
            <ol className={styles.timeline}>
              {timeline.map((item, i) =>
                item.type === 'status' ? (
                  <li key={i} className={styles.event}>
                    <span className={styles.eventDot} />
                    <span>
                      <strong>{item.h.changedBy}</strong> set status to{' '}
                      <span className={`badge badge-${item.h.status}`}>{statusMeta[item.h.status]?.label || item.h.status}</span>
                      <time className={styles.time}> · {timeAgo(item.h.changedAt)}</time>
                    </span>
                  </li>
                ) : (
                  <li key={i} className={styles.comment}>
                    <Avatar name={item.c.authorName || 'User'} size={26} />
                    <div className={styles.bubble}>
                      <div className={styles.commentHead}>
                        <strong>{item.c.authorName || 'User'}</strong>
                        <time className={styles.time}>{item.c.createdAt ? timeAgo(item.c.createdAt) : 'just now'}</time>
                      </div>
                      <p>{item.c.message}</p>
                    </div>
                  </li>
                )
              )}
            </ol>
          )}
        </section>
      </div>

      <footer className={styles.composer}>
        <CommentThread
          comments={[]}
          issueId={id}
          currentUserId={currentUserId}
          compact
          onCommentAdded={(c) => {
            setFull((f) => (f ? { ...f, comments: [...f.comments, c] } : f));
            onCommentAdded(id, c);
          }}
        />
      </footer>
    </aside>
  );
}

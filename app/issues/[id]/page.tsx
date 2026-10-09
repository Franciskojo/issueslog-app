'use client';

import { use, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import CommentThread from '@/components/CommentThread';
import { IComment } from '@/models/Issue';
import styles from './page.module.css';
import {
  ArrowLeft, Trash2, FileText, Paperclip, Tag,
  Building2, User, Clock, Calendar, CheckCircle2,
  Activity, Settings, Info, AlertTriangle, Download, Eye
} from '@/components/icons';

interface IssueData {
  _id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  category: string;
  submittedByName: string;
  submittedByDepartment: string;
  submittedBy: string;
  assignedTo?: string;
  assignedToName?: string;
  dueDate?: string;
  comments: IComment[];
  attachments: { filename: string; originalName: string; mimetype: string; size: number; url: string; uploadedAt: Date }[];
  statusHistory: { status: string; changedBy: string; changedAt: string }[];
  createdAt: string;
  updatedAt: string;
}

const STATUS_OPTIONS = ['open', 'in-progress', 'resolved', 'closed'];

interface TechUser { _id: string; name: string; email: string; department: string; }

const priorityColors: Record<string, string> = {
  low: 'badge-low', medium: 'badge-medium', high: 'badge-high', critical: 'badge-critical',
};
const statusColors: Record<string, string> = {
  open: 'badge-open', 'in-progress': 'badge-in-progress', resolved: 'badge-resolved', closed: 'badge-closed',
};
const priorityVar: Record<string, string> = {
  low: 'var(--priority-low)', medium: 'var(--priority-medium)',
  high: 'var(--priority-high)', critical: 'var(--priority-critical)',
};

function timeAgo(date: Date | string): string {
  const now = new Date(), d = new Date(date);
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000), hours = Math.floor(diff / 3600000), days = Math.floor(diff / 86400000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function IssueDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session } = useSession();
  const router = useRouter();
  const user = session?.user as { id?: string; name?: string; role?: string } | undefined;
  const isTech = user?.role === 'tech' || user?.role === 'admin';

  const [issue, setIssue] = useState<IssueData | null>(null);
  const [techUsers, setTechUsers] = useState<TechUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [selectedDueDate, setSelectedDueDate] = useState('');
  const [updateMsg, setUpdateMsg] = useState('');
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchIssue = async () => {
      try {
        const res = await fetch(`/api/issues/${id}`);
        if (!res.ok) { router.push('/dashboard'); return; }
        const data = await res.json();
        setIssue(data.issue);
        setSelectedStatus(data.issue.status);
        setSelectedAssignee(data.issue.assignedTo?.toString() || '');
        setSelectedDueDate(data.issue.dueDate ? new Date(data.issue.dueDate).toISOString().slice(0, 10) : '');
      } catch { router.push('/dashboard'); }
      finally { setLoading(false); }
    };
    const fetchTech = async () => {
      if (!isTech) return;
      const res = await fetch('/api/users');
      const data = await res.json();
      setTechUsers(data.users || []);
    };
    fetchIssue(); fetchTech();
  }, [id, router, isTech]);

  const handleUpdate = async () => {
    if (!issue) return;
    setUpdating(true); setUpdateMsg('');
    const assignee = techUsers.find((u) => u._id === selectedAssignee);
    const res = await fetch(`/api/issues/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: selectedStatus,
        assignedTo: selectedAssignee || null,
        assignedToName: assignee?.name || null,
        dueDate: selectedDueDate || null,
      }),
    });
    const data = await res.json();
    if (res.ok) { setIssue(data.issue); setUpdateMsg('Changes saved'); setTimeout(() => setUpdateMsg(''), 3000); }
    setUpdating(false);
  };

  const handleCommentAdded = (comment: IComment) => {
    if (!issue) return;
    setIssue({ ...issue, comments: [...issue.comments, comment] } as IssueData);
  };

  const handleDelete = async () => {
    if (!confirm('Delete this issue? This cannot be undone.')) return;
    await fetch(`/api/issues/${id}`, { method: 'DELETE' });
    router.push('/dashboard');
  };

  if (loading) return (
    <>
      <Navbar />
      <main className="page-wrapper">
        <div className="container" style={{ paddingTop: 40 }}>
          <div className={`skeleton ${styles.skeletonHeader}`} />
          <div className={styles.skeletonBody}>
            <div className={`skeleton ${styles.skeletonMain}`} />
            <div className={`skeleton ${styles.skeletonSide}`} />
          </div>
        </div>
      </main>
    </>
  );

  if (!issue) return null;

  const prioColor = priorityVar[issue.priority];

  // Build unified activity timeline: comments + status history
  const timeline: { type: 'comment' | 'status'; ts: string; data: IComment | { status: string; changedBy: string; changedAt: string } }[] = [
    ...(issue.comments || []).map(c => ({ type: 'comment' as const, ts: c.createdAt?.toString() || '', data: c })),
    ...(issue.statusHistory || []).map(h => ({ type: 'status' as const, ts: h.changedAt, data: h })),
  ].sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());

  return (
    <>
      <Navbar />

      {/* Lightbox */}
      {lightboxImg && (
        <div className={styles.lightbox} onClick={() => setLightboxImg(null)}>
          <img src={lightboxImg} alt="Attachment preview" className={styles.lightboxImg} />
          <button className={styles.lightboxClose} onClick={() => setLightboxImg(null)}>✕</button>
        </div>
      )}

      <main className={`page-wrapper ${styles.main}`}>
        <div className="container">

          {/* ── Header ── */}
          <div className={`${styles.header} fade-in`} style={{ '--prio-color': prioColor } as React.CSSProperties}>
            <div className={styles.headerNav}>
              <button className={styles.backBtn} onClick={() => router.push('/dashboard')}>
                <ArrowLeft size={14} />
                Back to Dashboard
              </button>
              <span className={styles.issueId}>#{issue._id.slice(-8).toUpperCase()}</span>
            </div>

            <div className={styles.headerTop}>
              <div className={styles.headerBadges}>
                <span className={`badge ${priorityColors[issue.priority]}`}>{issue.priority} priority</span>
                <span className={`badge ${statusColors[issue.status]}`}>
                  {issue.status === 'in-progress' ? 'In Progress' : issue.status}
                </span>
                {issue.assignedToName && (
                  <span className={styles.assignedBadge}>{issue.assignedToName}</span>
                )}
              </div>
              {isTech && (
                <button className="btn btn-danger btn-sm" onClick={handleDelete}>
                  <Trash2 size={13} />
                  Delete
                </button>
              )}
            </div>

            <h1 className={styles.issueTitle}>{issue.title}</h1>

            <div className={styles.issueMeta}>
              <span><Tag size={12} />{issue.category}</span>
              <span><Building2 size={12} />{issue.submittedByDepartment}</span>
              <span><User size={12} />{issue.submittedByName}</span>
              <span><Clock size={12} />{timeAgo(issue.createdAt)}</span>
            </div>
          </div>

          {/* ── Layout ── */}
          <div className={styles.layout}>

            {/* ── Main column ── */}
            <div className={styles.mainCol}>

              {/* Description */}
              <div className={`card ${styles.section}`}>
                <div className={styles.sectionHead}>
                  <FileText size={14} />
                  <h3 className={styles.sectionTitle}>Description</h3>
                </div>
                <p className={styles.description}>{issue.description}</p>
              </div>

              {/* Attachments */}
              {issue.attachments?.length > 0 && (
                <div className={`card ${styles.section}`}>
                  <div className={styles.sectionHead}>
                    <Paperclip size={14} />
                    <h3 className={styles.sectionTitle}>Attachments <span className={styles.sectionCount}>{issue.attachments.length}</span></h3>
                  </div>
                  <div className={styles.attachGrid}>
                    {issue.attachments.map((att, i) =>
                      att.mimetype.startsWith('image/') ? (
                        <button key={i} className={styles.attachThumb} onClick={() => setLightboxImg(att.url)} title={att.originalName}>
                          <img src={att.url} alt={att.originalName} />
                          <span className={styles.attachLabel}>
                            <Eye size={10} />
                            {att.originalName}
                          </span>
                        </button>
                      ) : (
                        <a key={i} href={att.url} target="_blank" rel="noopener noreferrer" className={styles.attachFile} download>
                          <span className={styles.attachFileIcon}><FileText size={18} /></span>
                          <div className={styles.attachFileBody}>
                            <span className={styles.attachFileName}>{att.originalName}</span>
                            <span className={styles.attachFileSize}>{(att.size / 1024).toFixed(1)} KB</span>
                          </div>
                          <Download size={13} className={styles.attachDownload} />
                        </a>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Activity Timeline */}
              <div className={`card ${styles.section}`}>
                <div className={styles.sectionHead}>
                  <Activity size={14} />
                  <h3 className={styles.sectionTitle}>Activity <span className={styles.sectionCount}>{timeline.length}</span></h3>
                </div>

                {timeline.length === 0 ? (
                  <p className={styles.noActivity}>No activity yet — add a comment below.</p>
                ) : (
                  <div className={styles.timeline}>
                    {timeline.map((item, i) => {
                      if (item.type === 'status') {
                        const h = item.data as { status: string; changedBy: string; changedAt: string };
                        return (
                          <div key={i} className={styles.timelineItem}>
                            <div className={`${styles.timelineDot} ${styles.timelineDotStatus}`} />
                            <div className={styles.timelineContent}>
                              <div className={styles.timelineStatus}>
                                <span className={styles.timelineStatusText}>Status changed to</span>
                                <span className={`badge ${statusColors[h.status] || ''}`}>{h.status}</span>
                                <span className={styles.timelineMeta}>by <strong>{h.changedBy}</strong> · {timeAgo(h.changedAt)}</span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      const c = item.data as IComment;
                      const isTechComment = c.authorRole === 'tech' || c.authorRole === 'admin';
                      return (
                        <div key={i} className={`${styles.timelineItem} ${isTechComment ? styles.timelineItemTech : ''}`}>
                          <div className={styles.timelineDot} />
                          <div className={styles.timelineContent}>
                            <div className={styles.commentBubble}>
                              <div className={styles.commentMeta}>
                                <div className={styles.commentAvatar}>
                                  {(c.authorName || 'U').charAt(0).toUpperCase()}
                                </div>
                                <strong className={styles.commentAuthor}>{c.authorName || 'User'}</strong>
                                <span className={`badge ${isTechComment ? 'badge-role-tech' : 'badge-role-nontech'}`}>
                                  {c.authorRole}
                                </span>
                                <span className={styles.commentTime}>{c.createdAt ? timeAgo(c.createdAt) : 'just now'}</span>
                              </div>
                              <p className={styles.commentMsg}>{c.message}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Comment composer */}
                <div className={styles.commentComposer}>
                  <CommentThread
                    comments={[]}
                    issueId={issue._id}
                    currentUserId={user?.id || ''}
                    onCommentAdded={handleCommentAdded}
                    compact
                  />
                </div>
              </div>
            </div>

            {/* ── Sidebar ── */}
            <aside className={styles.sidebar}>

              {/* Tech controls */}
              {isTech && (
                <div className={`card ${styles.section}`}>
                  <div className={styles.sectionHead}>
                    <Settings size={14} />
                    <h3 className={styles.sectionTitle}>Manage Issue</h3>
                  </div>

                  <div className={styles.field}>
                    <label htmlFor="status-select">Status</label>
                    <select id="status-select" value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>{s === 'in-progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)}</option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.field}>
                    <label htmlFor="assignee-select">Assign to</label>
                    <select id="assignee-select" value={selectedAssignee} onChange={(e) => setSelectedAssignee(e.target.value)}>
                      <option value="">Unassigned</option>
                      {techUsers.map((u) => (
                        <option key={u._id} value={u._id}>{u.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.field}>
                    <label htmlFor="duedate-select">Due date</label>
                    <input
                      id="duedate-select"
                      type="date"
                      value={selectedDueDate}
                      onChange={(e) => setSelectedDueDate(e.target.value)}
                      style={{ colorScheme: 'dark' }}
                    />
                  </div>

                  {updateMsg && (
                    <div className="alert alert-success">
                      <CheckCircle2 size={13} />
                      {updateMsg}
                    </div>
                  )}

                  <button className="btn btn-primary" onClick={handleUpdate} disabled={updating} style={{ width: '100%' }}>
                    {updating ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              )}

              {/* Properties */}
              <div className={`card ${styles.section}`}>
                <div className={styles.sectionHead}>
                  <Info size={14} />
                  <h3 className={styles.sectionTitle}>Properties</h3>
                </div>
                <dl className={styles.infoGrid}>
                  <dt>Category</dt>     <dd>{issue.category}</dd>
                  <dt>Department</dt>   <dd>{issue.submittedByDepartment}</dd>
                  <dt>Reporter</dt>     <dd>{issue.submittedByName}</dd>
                  <dt>Created</dt>      <dd>{formatDate(issue.createdAt)}</dd>
                  <dt>Updated</dt>      <dd>{timeAgo(issue.updatedAt)}</dd>
                  {issue.dueDate && <><dt>Due Date</dt><dd>{formatDate(issue.dueDate)}</dd></>}
                  {issue.assignedToName && <><dt>Assigned To</dt><dd>{issue.assignedToName}</dd></>}
                </dl>
              </div>

              {/* Danger zone */}
              {isTech && (
                <div className={`card ${styles.dangerSection}`}>
                  <div className={styles.sectionHead}>
                    <AlertTriangle size={14} className={styles.dangerIcon} />
                    <h3 className={`${styles.sectionTitle} ${styles.dangerTitle}`}>Danger Zone</h3>
                  </div>
                  <p className={styles.dangerDesc}>Permanently delete this issue and all its data.</p>
                  <button className="btn btn-danger btn-sm" onClick={handleDelete} style={{ width: '100%' }}>
                    <Trash2 size={13} />
                    Delete Issue
                  </button>
                </div>
              )}
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}

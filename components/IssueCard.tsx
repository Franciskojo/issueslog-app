import Link from 'next/link';
import styles from './IssueCard.module.css';
import { Paperclip, MessageSquare, Tag, Building2, ChevronRight } from './icons';

interface IssueCardData {
  _id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  category: string;
  submittedByDepartment: string;
  assignedToName?: string;
  attachments?: { url: string }[];
  comments?: { _id?: string }[];
  createdAt: Date | string;
}

interface Props {
  issue: IssueCardData;
  showAssign?: boolean;
}

function timeAgo(date: Date | string): string {
  const now = new Date();
  const d = new Date(date);
  const diff = now.getTime() - d.getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

const priorityVar: Record<string, string> = {
  low:      'var(--priority-low)',
  medium:   'var(--priority-medium)',
  high:     'var(--priority-high)',
  critical: 'var(--priority-critical)',
};

export default function IssueCard({ issue, showAssign }: Props) {
  const prioColor = priorityVar[issue.priority] || 'var(--border-muted)';

  return (
    <Link
      href={`/issues/${issue._id}`}
      className={styles.card}
      style={{ '--prio-color': prioColor } as React.CSSProperties}
    >
      {/* Priority left border */}
      <div className={styles.prioBorder} />

      {/* Header row */}
      <div className={styles.header}>
        <div className={styles.badges}>
          <span className={`badge badge-${issue.priority}`}>
            {issue.priority}
          </span>
          <span className={`badge badge-${issue.status.replace(' ', '-')}`}>
            {issue.status === 'in-progress' ? 'In Progress' : issue.status}
          </span>
        </div>
        <span className={styles.time}>{timeAgo(issue.createdAt)}</span>
      </div>

      {/* Title */}
      <h3 className={styles.title}>{issue.title}</h3>

      {/* Description */}
      <p className={styles.description}>
        {issue.description.length > 110
          ? issue.description.slice(0, 110) + '…'
          : issue.description}
      </p>

      {/* Footer */}
      <div className={styles.footer}>
        <div className={styles.meta}>
          <span className={styles.metaItem}>
            <Tag size={10} />
            {issue.category}
          </span>
          <span className={styles.metaItem}>
            <Building2 size={10} />
            {issue.submittedByDepartment}
          </span>
          {(issue.attachments?.length ?? 0) > 0 && (
            <span className={styles.metaItem}>
              <Paperclip size={10} />
              {issue.attachments!.length}
            </span>
          )}
          {(issue.comments?.length ?? 0) > 0 && (
            <span className={styles.metaItem}>
              <MessageSquare size={10} />
              {issue.comments!.length}
            </span>
          )}
        </div>

        <div className={styles.right}>
          {showAssign && issue.assignedToName && (
            <span className={styles.assignee}>{issue.assignedToName}</span>
          )}
          <ChevronRight size={13} className={styles.arrow} />
        </div>
      </div>
    </Link>
  );
}

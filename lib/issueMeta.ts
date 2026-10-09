// Client-safe shared helpers for issue UI (no server/mongoose imports).

export interface IssueListItem {
  _id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  category: string;
  submittedByName?: string;
  submittedByDepartment: string;
  assignedTo?: string;
  assignedToName?: string;
  dueDate?: string;
  attachments?: { url: string }[];
  comments?: { _id?: string }[];
  createdAt: string;
}

export interface TechUser {
  _id: string;
  name: string;
  email?: string;
  department?: string;
  role?: string;
}

export const STATUS_ORDER = ['open', 'in-progress', 'resolved', 'closed'] as const;
export const PRIORITY_ORDER = ['critical', 'high', 'medium', 'low'] as const;

export const statusMeta: Record<string, { label: string; color: string }> = {
  open:          { label: 'Open',        color: 'var(--status-open)' },
  'in-progress': { label: 'In Progress', color: 'var(--status-in-progress)' },
  resolved:      { label: 'Resolved',    color: 'var(--status-resolved)' },
  closed:        { label: 'Closed',      color: 'var(--status-closed)' },
};

export const priorityMeta: Record<string, { label: string; color: string }> = {
  critical: { label: 'Critical', color: 'var(--priority-critical)' },
  high:     { label: 'High',     color: 'var(--priority-high)' },
  medium:   { label: 'Medium',   color: 'var(--priority-medium)' },
  low:      { label: 'Low',      color: 'var(--priority-low)' },
};

export function timeAgo(date: Date | string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export function shortId(id: string): string {
  return id.slice(-6).toUpperCase();
}

/** Convert an ISO date string to the yyyy-mm-dd value used by <input type="date">. */
export function toDateInput(iso?: string | null): string {
  return iso ? new Date(iso).toISOString().slice(0, 10) : '';
}

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** Whole days between today and the due date (negative = overdue). Uses UTC date parts of the stored value. */
export function daysUntil(iso: string): number {
  const due = new Date(iso);
  const dueDay = new Date(due.getUTCFullYear(), due.getUTCMonth(), due.getUTCDate()).getTime();
  return Math.round((dueDay - startOfDay(new Date())) / 86400000);
}

export function isDone(status: string): boolean {
  return status === 'resolved' || status === 'closed';
}

export function dueLabel(iso: string): { text: string; tone: 'overdue' | 'today' | 'soon' | 'normal' } {
  const n = daysUntil(iso);
  if (n < 0) return { text: n === -1 ? 'Yesterday' : `${Math.abs(n)}d overdue`, tone: 'overdue' };
  if (n === 0) return { text: 'Today', tone: 'today' };
  if (n === 1) return { text: 'Tomorrow', tone: 'soon' };
  const d = new Date(iso);
  const text = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
  return { text, tone: n <= 7 ? 'soon' : 'normal' };
}

export interface IssuePatch {
  status?: string;
  priority?: string;
  dueDate?: string | null;
  assignedTo?: string | null;
  assignedToName?: string | null;
}

/** PATCH an issue; resolves to the updated issue or throws. */
export async function patchIssue(id: string, patch: IssuePatch) {
  const res = await fetch(`/api/issues/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Update failed');
  return data.issue as IssueListItem;
}

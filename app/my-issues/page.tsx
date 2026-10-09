'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import IssueList, { type IssueGroup } from '@/components/IssueList';
import IssueBoard from '@/components/IssueBoard';
import IssueDrawer from '@/components/IssueDrawer';
import styles from '@/app/dashboard/page.module.css';
import { Plus, Search, X, Inbox, ListChecks, Columns } from '@/components/icons';
import { useIssues } from '@/lib/useIssues';
import { useIssueUpdater } from '@/lib/useIssueUpdater';
import {
  statusMeta, priorityMeta, PRIORITY_ORDER, daysUntil, isDone,
  type IssueListItem,
} from '@/lib/issueMeta';

type View = 'list' | 'board';

function buildMyTasksGroups(issues: IssueListItem[]): IssueGroup[] {
  const overdue: IssueListItem[] = [];
  const today: IssueListItem[] = [];
  const upcoming: IssueListItem[] = [];
  const later: IssueListItem[] = [];
  const completed: IssueListItem[] = [];

  for (const item of issues) {
    if (isDone(item.status)) {
      completed.push(item);
      continue;
    }
    if (!item.dueDate) {
      later.push(item);
      continue;
    }
    const days = daysUntil(item.dueDate);
    if (days < 0) {
      overdue.push(item);
    } else if (days === 0) {
      today.push(item);
    } else if (days <= 7) {
      upcoming.push(item);
    } else {
      later.push(item);
    }
  }

  const groups: IssueGroup[] = [];
  if (overdue.length) {
    groups.push({ key: 'overdue', label: 'Overdue', color: 'var(--color-danger)', issues: overdue });
  }
  if (today.length) {
    groups.push({ key: 'today', label: 'Today', color: 'var(--status-resolved)', issues: today });
  }
  if (upcoming.length) {
    groups.push({ key: 'upcoming', label: 'Upcoming (Next 7 Days)', color: 'var(--priority-medium)', issues: upcoming });
  }
  if (later.length) {
    groups.push({ key: 'later', label: 'Later / No Due Date', color: 'var(--text-muted)', issues: later });
  }
  if (completed.length) {
    groups.push({ key: 'completed', label: 'Completed', color: 'var(--status-closed)', issues: completed });
  }

  if (!groups.length) {
    groups.push({ key: 'empty', label: 'My Issues', issues: [] });
  }

  return groups;
}

export default function MyIssuesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const user = session?.user as { id?: string; name?: string; role?: string; department?: string } | undefined;
  const isTech = user?.role === 'tech' || user?.role === 'admin';

  // For tech users, fetch assigned to them; for non-tech users, API automatically filters to submittedBy them
  const { issues, setIssues, techUsers, loading, error } = useIssues({
    enabled: status === 'authenticated',
    isTech: !!isTech,
    assignedToMe: isTech,
  });
  const { update, error: updateError } = useIssueUpdater(issues, setIssues);

  const [view, setView] = useState<View>('list');
  const [filterPriority, setFilterPriority] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/');
  }, [status, router]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return issues.filter((i) =>
      (filterPriority === 'all' || i.priority === filterPriority) &&
      (!q || i.title.toLowerCase().includes(q) || i.description.toLowerCase().includes(q) || i.category.toLowerCase().includes(q))
    );
  }, [issues, filterPriority, search]);

  const groups = useMemo(() => buildMyTasksGroups(filtered), [filtered]);
  const selected = issues.find((i) => i._id === selectedId) || null;
  const filtersActive = filterPriority !== 'all' || !!search;
  const clearFilters = () => { setFilterPriority('all'); setSearch(''); };
  const closeDrawer = useCallback(() => setSelectedId(null), []);

  const pendingCount = issues.filter((i) => !isDone(i.status)).length;

  if (status === 'loading') {
    return <div className={styles.loadingScreen}><div className={styles.spinner} /></div>;
  }

  return (
    <>
      <Navbar />
      <main className={`page-wrapper ${styles.main} ${selected ? styles.withDrawer : ''}`}>
        <div className={styles.shell}>

          <header className={`${styles.pageHeader} fade-in`}>
            <div>
              <h1 className={styles.pageTitle}>My Issues</h1>
              <p className={styles.pageSubtitle}>
                {isTech
                  ? `${pendingCount} active issue${pendingCount === 1 ? '' : 's'} assigned to you`
                  : `${pendingCount} active issue${pendingCount === 1 ? '' : 's'} submitted by you`}
              </p>
            </div>
            {!isTech && (
              <Link href="/issues/new" className="btn btn-primary">
                <Plus size={14} strokeWidth={2.5} />
                Create
              </Link>
            )}
          </header>

          {/* View tabs */}
          <div className={styles.tabs} role="tablist" aria-label="View">
            <button
              role="tab" aria-selected={view === 'list'} id="view-list"
              className={`${styles.tab} ${view === 'list' ? styles.tabActive : ''}`}
              onClick={() => setView('list')}
            ><ListChecks size={14} />List</button>
            <button
              role="tab" aria-selected={view === 'board'} id="view-board"
              className={`${styles.tab} ${view === 'board' ? styles.tabActive : ''}`}
              onClick={() => setView('board')}
            ><Columns size={14} />Board</button>
          </div>

          {/* Toolbar */}
          <div className={styles.toolbar}>
            <div className={styles.searchBox}>
              <Search size={14} className={styles.searchIcon} />
              <input
                type="text" id="issues-search"
                placeholder="Search my issues…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={styles.searchInput}
              />
              {search && (
                <button className={styles.clearBtn} onClick={() => setSearch('')} aria-label="Clear search"><X size={12} /></button>
              )}
            </div>

            <div className={styles.selects}>
              <label className={styles.selectLabel}>
                Priority
                <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} aria-label="Filter by priority">
                  <option value="all">All Priorities</option>
                  {PRIORITY_ORDER.map((p) => <option key={p} value={p}>{priorityMeta[p].label}</option>)}
                </select>
              </label>
            </div>
          </div>

          {(error || updateError) && <div className="alert alert-error" role="alert">{updateError || error}</div>}

          {/* Content */}
          {loading ? (
            <div className={styles.skeletons}>
              {[...Array(6)].map((_, i) => <div key={i} className={`skeleton ${styles.skeletonRow}`} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}><Inbox size={40} strokeWidth={1.2} /></div>
              <h3>{filtersActive ? 'No matching issues' : 'All caught up!'}</h3>
              <p>
                {filtersActive
                  ? 'Try adjusting your filters or search terms.'
                  : isTech
                  ? 'You have no issues assigned to you right now.'
                  : 'You have not submitted any issues yet.'}
              </p>
              {filtersActive
                ? <button className="btn btn-secondary btn-sm" onClick={clearFilters}>Clear filters</button>
                : !isTech && <Link href="/issues/new" className="btn btn-primary"><Plus size={14} />Log an Issue</Link>}
            </div>
          ) : view === 'list' ? (
            <IssueList
              groups={groups}
              canEdit={!!isTech}
              techUsers={techUsers}
              activeId={selectedId}
              onOpen={setSelectedId}
              onUpdate={update}
            />
          ) : (
            <IssueBoard
              issues={filtered}
              canEdit={!!isTech}
              activeId={selectedId}
              onOpen={setSelectedId}
              onUpdate={update}
            />
          )}

          {!loading && filtered.length > 0 && (
            <div className={styles.resultCount}>
              Showing <strong>{filtered.length}</strong> of {issues.length} issue{issues.length !== 1 ? 's' : ''}
              {filtersActive && <button className={styles.clearFilters} onClick={clearFilters}>Clear filters</button>}
            </div>
          )}
        </div>
      </main>

      {selected && (
        <IssueDrawer
          key={selected._id}
          summary={selected}
          canEdit={!!isTech}
          canDelete={!!isTech}
          techUsers={techUsers}
          currentUserId={user?.id || ''}
          onClose={closeDrawer}
          onUpdate={update}
          onCommentAdded={(id, c) =>
            setIssues((list) => list.map((i) => (i._id === id ? { ...i, comments: [...(i.comments || []), { _id: String(c._id) }] } : i)))
          }
          onDeleted={(id) => { setIssues((list) => list.filter((i) => i._id !== id)); setSelectedId(null); }}
        />
      )}
    </>
  );
}

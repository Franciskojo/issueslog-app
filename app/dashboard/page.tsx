'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import IssueList, { type IssueGroup } from '@/components/IssueList';
import IssueBoard from '@/components/IssueBoard';
import IssueDrawer from '@/components/IssueDrawer';
import styles from './page.module.css';
import { Plus, Search, X, Inbox, ListChecks, Columns } from '@/components/icons';
import { useIssues } from '@/lib/useIssues';
import { useIssueUpdater } from '@/lib/useIssueUpdater';
import {
  statusMeta, priorityMeta, STATUS_ORDER, PRIORITY_ORDER,
  type IssueListItem,
} from '@/lib/issueMeta';

type View = 'list' | 'board';
type GroupBy = 'status' | 'priority' | 'assignee' | 'none';

function buildGroups(issues: IssueListItem[], by: GroupBy): IssueGroup[] {
  if (by === 'none') return [{ key: 'all', label: 'All issues', issues }];

  if (by === 'status') {
    return STATUS_ORDER.map((s) => ({
      key: s, label: statusMeta[s].label, color: statusMeta[s].color,
      issues: issues.filter((i) => i.status === s),
    })).filter((g) => g.issues.length);
  }

  if (by === 'priority') {
    return PRIORITY_ORDER.map((p) => ({
      key: p, label: priorityMeta[p].label, color: priorityMeta[p].color,
      issues: issues.filter((i) => i.priority === p),
    })).filter((g) => g.issues.length);
  }

  const names = Array.from(new Set(issues.map((i) => i.assignedToName).filter(Boolean))) as string[];
  const groups: IssueGroup[] = names.sort().map((n) => ({
    key: `a:${n}`, label: n, issues: issues.filter((i) => i.assignedToName === n),
  }));
  const none = issues.filter((i) => !i.assignedToName);
  if (none.length) groups.push({ key: 'a:none', label: 'Unassigned', issues: none });
  return groups;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const user = session?.user as { id?: string; name?: string; role?: string; department?: string } | undefined;
  const isTech = user?.role === 'tech' || user?.role === 'admin';

  const { issues, setIssues, techUsers, loading, error } = useIssues({ enabled: status === 'authenticated', isTech });
  const { update, error: updateError } = useIssueUpdater(issues, setIssues);

  const [view, setView] = useState<View>('list');
  const [groupBy, setGroupBy] = useState<GroupBy>('status');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/');
  }, [status, router]);

  const stats = useMemo(() => ({
    total: issues.length,
    open: issues.filter((i) => i.status === 'open').length,
    'in-progress': issues.filter((i) => i.status === 'in-progress').length,
    resolved: issues.filter((i) => i.status === 'resolved').length,
    closed: issues.filter((i) => i.status === 'closed').length,
  }), [issues]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return issues.filter((i) =>
      (filterStatus === 'all' || i.status === filterStatus) &&
      (filterPriority === 'all' || i.priority === filterPriority) &&
      (!q || i.title.toLowerCase().includes(q) || i.description.toLowerCase().includes(q) || i.category.toLowerCase().includes(q))
    );
  }, [issues, filterStatus, filterPriority, search]);

  const groups = useMemo(() => buildGroups(filtered, groupBy), [filtered, groupBy]);
  const selected = issues.find((i) => i._id === selectedId) || null;
  const filtersActive = filterStatus !== 'all' || filterPriority !== 'all' || !!search;
  const clearFilters = () => { setFilterStatus('all'); setFilterPriority('all'); setSearch(''); };
  const closeDrawer = useCallback(() => setSelectedId(null), []);

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
              <h1 className={styles.pageTitle}>{isTech ? 'All Issues' : 'Issue Board'}</h1>
              <p className={styles.pageSubtitle}>
                {isTech
                  ? `${stats.total} issues across all teams`
                  : `Issues submitted by ${user?.department || 'your team'}`}
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
                placeholder="Search issues…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={styles.searchInput}
              />
              {search && (
                <button className={styles.clearBtn} onClick={() => setSearch('')} aria-label="Clear search"><X size={12} /></button>
              )}
            </div>

            <div className={styles.chips}>
              {(['open', 'in-progress', 'resolved', 'closed'] as const).map((s) => (
                <button
                  key={s}
                  id={`kpi-${s}`}
                  className={`${styles.chip} ${filterStatus === s ? styles.chipActive : ''}`}
                  style={{ '--chip-color': statusMeta[s].color } as React.CSSProperties}
                  onClick={() => setFilterStatus(filterStatus === s ? 'all' : s)}
                >
                  <span className={styles.chipDot} />
                  {statusMeta[s].label}
                  <span className={styles.chipCount}>{stats[s]}</span>
                </button>
              ))}
            </div>

            <div className={styles.selects}>
              <label className={styles.selectLabel}>
                Priority
                <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} aria-label="Filter by priority">
                  <option value="all">All</option>
                  {PRIORITY_ORDER.map((p) => <option key={p} value={p}>{priorityMeta[p].label}</option>)}
                </select>
              </label>
              {view === 'list' && (
                <label className={styles.selectLabel}>
                  Group by
                  <select value={groupBy} onChange={(e) => setGroupBy(e.target.value as GroupBy)} aria-label="Group by">
                    <option value="status">Status</option>
                    <option value="priority">Priority</option>
                    {isTech && <option value="assignee">Assignee</option>}
                    <option value="none">None</option>
                  </select>
                </label>
              )}
            </div>
          </div>

          {(error || updateError) && <div className="alert alert-error" role="alert">{updateError || error}</div>}

          {/* Content */}
          {loading ? (
            <div className={styles.skeletons}>
              {[...Array(7)].map((_, i) => <div key={i} className={`skeleton ${styles.skeletonRow}`} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}><Inbox size={40} strokeWidth={1.2} /></div>
              <h3>{filtersActive ? 'No matching issues' : 'No issues yet'}</h3>
              <p>
                {filtersActive
                  ? 'Try adjusting your filters or search terms'
                  : isTech ? 'When non-tech teams log issues, they will appear here' : 'Got a problem? Let the tech team know!'}
              </p>
              {filtersActive
                ? <button className="btn btn-secondary btn-sm" onClick={clearFilters}>Clear filters</button>
                : !isTech && <Link href="/issues/new" className="btn btn-primary"><Plus size={14} />Log Your First Issue</Link>}
            </div>
          ) : view === 'list' ? (
            <IssueList
              groups={groups}
              canEdit={isTech}
              techUsers={techUsers}
              activeId={selectedId}
              onOpen={setSelectedId}
              onUpdate={update}
            />
          ) : (
            <IssueBoard
              issues={filtered}
              canEdit={isTech}
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
          canEdit={isTech}
          canDelete={isTech}
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

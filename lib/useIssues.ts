'use client';

import { useCallback, useEffect, useState } from 'react';
import type { IssueListItem, TechUser } from './issueMeta';

/** Loads issues (optionally only those assigned to me) plus the assignee list for tech users. */
export function useIssues({ enabled, isTech, assignedToMe = false }: { enabled: boolean; isTech: boolean; assignedToMe?: boolean }) {
  const [issues, setIssues] = useState<IssueListItem[]>([]);
  const [techUsers, setTechUsers] = useState<TechUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams({ limit: '500' });
      if (assignedToMe) params.set('assignedTo', 'me');
      const res = await fetch(`/api/issues?${params}`);
      if (!res.ok) throw new Error('Failed to load issues');
      const data = await res.json();
      setIssues(data.issues || []);
      setError('');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [assignedToMe]);

  useEffect(() => {
    if (!enabled) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [enabled, load]);

  useEffect(() => {
    if (!enabled || !isTech) return;
    fetch('/api/users')
      .then((r) => (r.ok ? r.json() : { users: [] }))
      .then((d) => setTechUsers(d.users || []))
      .catch(() => {});
  }, [enabled, isTech]);

  return { issues, setIssues, techUsers, loading, error, reload: load };
}

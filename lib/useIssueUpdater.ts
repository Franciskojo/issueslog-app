'use client';

import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { patchIssue, type IssueListItem, type IssuePatch } from './issueMeta';

function applyPatch(issue: IssueListItem, patch: IssuePatch): IssueListItem {
  const next = { ...issue };
  if (patch.status) next.status = patch.status;
  if (patch.priority) next.priority = patch.priority;
  if (patch.dueDate !== undefined) next.dueDate = patch.dueDate || undefined;
  if (patch.assignedTo !== undefined) {
    next.assignedTo = patch.assignedTo || undefined;
    next.assignedToName = patch.assignedToName || undefined;
  }
  return next;
}

/**
 * Optimistic inline-edit helper: applies the patch locally at once, persists it,
 * and rolls back (exposing `error`) if the server rejects it.
 */
export function useIssueUpdater(
  issues: IssueListItem[],
  setIssues: Dispatch<SetStateAction<IssueListItem[]>>
) {
  const ref = useRef(issues);
  const [error, setError] = useState('');

  useEffect(() => { ref.current = issues; }, [issues]);

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(''), 4000);
    return () => clearTimeout(t);
  }, [error]);

  const update = useCallback(async (id: string, patch: IssuePatch) => {
    const before = ref.current.find((i) => i._id === id);
    if (!before) return;
    setIssues((list) => list.map((i) => (i._id === id ? applyPatch(i, patch) : i)));
    try {
      await patchIssue(id, patch);
    } catch (e) {
      setIssues((list) => list.map((i) => (i._id === id ? before : i)));
      setError((e as Error).message || 'Could not save change');
    }
  }, [setIssues]);

  return { update, error };
}

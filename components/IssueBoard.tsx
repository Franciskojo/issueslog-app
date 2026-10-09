'use client';

import { useState } from 'react';
import { Calendar, MessageSquare, Paperclip } from './icons';
import Avatar from './Avatar';
import styles from './IssueBoard.module.css';
import {
  statusMeta, priorityMeta, STATUS_ORDER, dueLabel, isDone, shortId,
  type IssueListItem, type IssuePatch,
} from '@/lib/issueMeta';

interface Props {
  issues: IssueListItem[];
  canEdit: boolean;
  activeId?: string | null;
  onOpen: (id: string) => void;
  onUpdate: (id: string, patch: IssuePatch) => void;
}

/** Kanban board: one column per status. Tech/admin users can drag cards between columns. */
export default function IssueBoard({ issues, canEdit, activeId, onOpen, onUpdate }: Props) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<string | null>(null);

  const drop = (status: string) => {
    if (dragId) {
      const issue = issues.find((i) => i._id === dragId);
      if (issue && issue.status !== status) onUpdate(dragId, { status });
    }
    setDragId(null);
    setOverCol(null);
  };

  return (
    <div className={styles.board}>
      {STATUS_ORDER.map((status) => {
        const meta = statusMeta[status];
        const items = issues.filter((i) => i.status === status);
        return (
          <section
            key={status}
            className={`${styles.column} ${overCol === status ? styles.over : ''}`}
            style={{ '--col-color': meta.color } as React.CSSProperties}
            onDragOver={(e) => { if (canEdit && dragId) { e.preventDefault(); setOverCol(status); } }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) setOverCol(null);
            }}
            onDrop={(e) => { e.preventDefault(); drop(status); }}
            aria-label={`${meta.label} column`}
          >
            <header className={styles.colHead}>
              <span className={styles.colDot} />
              <h3 className={styles.colTitle}>{meta.label}</h3>
              <span className={styles.colCount}>{items.length}</span>
            </header>

            <div className={styles.cards}>
              {items.map((issue) => {
                const due = issue.dueDate && !isDone(issue.status) ? dueLabel(issue.dueDate) : null;
                const prio = priorityMeta[issue.priority];
                return (
                  <article
                    key={issue._id}
                    className={`${styles.card} ${activeId === issue._id ? styles.active : ''} ${dragId === issue._id ? styles.dragging : ''}`}
                    draggable={canEdit}
                    onDragStart={(e) => { setDragId(issue._id); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', issue._id); }}
                    onDragEnd={() => { setDragId(null); setOverCol(null); }}
                    onClick={() => onOpen(issue._id)}
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter') onOpen(issue._id); }}
                  >
                    <span className={styles.prio} style={{ background: prio?.color }} title={`${prio?.label} priority`} />
                    <h4 className={styles.cardTitle}>{issue.title}</h4>
                    <div className={styles.cardCategory}>{issue.category}</div>
                    <footer className={styles.cardFoot}>
                      <span className={styles.footLeft}>
                        <span className="mono">#{shortId(issue._id)}</span>
                        {!!issue.comments?.length && <span className={styles.footIcon}><MessageSquare size={11} />{issue.comments.length}</span>}
                        {!!issue.attachments?.length && <span className={styles.footIcon}><Paperclip size={11} />{issue.attachments.length}</span>}
                        {due && <span className={`${styles.footIcon} ${styles[`due_${due.tone}`]}`}><Calendar size={11} />{due.text}</span>}
                      </span>
                      <Avatar name={issue.assignedToName} size={22} />
                    </footer>
                  </article>
                );
              })}
              {items.length === 0 && <div className={styles.emptyCol}>{canEdit ? 'Drop issues here' : 'Nothing here'}</div>}
            </div>
          </section>
        );
      })}
    </div>
  );
}

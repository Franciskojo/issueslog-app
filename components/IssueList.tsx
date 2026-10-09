'use client';

import { useState } from 'react';
import { ChevronDown, MessageSquare, Paperclip, Calendar } from './icons';
import Avatar from './Avatar';
import PillSelect from './PillSelect';
import styles from './IssueList.module.css';
import {
  statusMeta, priorityMeta, STATUS_ORDER, PRIORITY_ORDER,
  dueLabel, isDone, toDateInput, shortId,
  type IssueListItem, type IssuePatch, type TechUser,
} from '@/lib/issueMeta';

export interface IssueGroup {
  key: string;
  label: string;
  color?: string;
  issues: IssueListItem[];
}

interface Props {
  groups: IssueGroup[];
  canEdit: boolean;
  techUsers: TechUser[];
  activeId?: string | null;
  onOpen: (id: string) => void;
  onUpdate: (id: string, patch: IssuePatch) => void;
}

const statusOptions = STATUS_ORDER.map((s) => ({ value: s, ...statusMeta[s] }));
const priorityOptions = PRIORITY_ORDER.map((p) => ({ value: p, ...priorityMeta[p] }));

export default function IssueList({ groups, canEdit, techUsers, activeId, onOpen, onUpdate }: Props) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggle = (key: string) => setCollapsed((c) => ({ ...c, [key]: !c[key] }));

  return (
    <div className={styles.list} role="table" aria-label="Issues">
      <div className={`${styles.row} ${styles.head}`} role="row">
        <div role="columnheader">Name</div>
        <div role="columnheader">Assignee</div>
        <div role="columnheader">Due date</div>
        <div role="columnheader">Priority</div>
        <div role="columnheader">Status</div>
      </div>

      {groups.map((g) => {
        const isCollapsed = !!collapsed[g.key];
        return (
          <section key={g.key} className={styles.group}>
            <button
              type="button"
              className={styles.groupHead}
              onClick={() => toggle(g.key)}
              aria-expanded={!isCollapsed}
            >
              <ChevronDown size={14} className={`${styles.caret} ${isCollapsed ? styles.caretClosed : ''}`} />
              {g.color && <span className={styles.groupDot} style={{ background: g.color }} />}
              <span className={styles.groupLabel}>{g.label}</span>
              <span className={styles.groupCount}>{g.issues.length}</span>
            </button>

            {!isCollapsed && g.issues.map((issue) => {
              const done = isDone(issue.status);
              const due = issue.dueDate ? dueLabel(issue.dueDate) : null;
              return (
                <div
                  key={issue._id}
                  role="row"
                  className={`${styles.row} ${styles.item} ${activeId === issue._id ? styles.active : ''} ${done ? styles.done : ''}`}
                  onClick={() => onOpen(issue._id)}
                >
                  <div className={styles.nameCell} role="cell">
                    <span className={`${styles.check} ${done ? styles.checkDone : ''}`} aria-hidden>
                      {done && '✓'}
                    </span>
                    <button
                      type="button"
                      className={styles.title}
                      onClick={(e) => { e.stopPropagation(); onOpen(issue._id); }}
                    >
                      {issue.title}
                    </button>
                    <span className={styles.meta}>
                      <span className="mono">#{shortId(issue._id)}</span>
                      {!!issue.comments?.length && (
                        <span className={styles.metaIcon}><MessageSquare size={11} />{issue.comments.length}</span>
                      )}
                      {!!issue.attachments?.length && (
                        <span className={styles.metaIcon}><Paperclip size={11} />{issue.attachments.length}</span>
                      )}
                    </span>
                  </div>

                  <div className={styles.cell} role="cell" data-label="Assignee">
                    <label
                      className={`${styles.assignee} ${canEdit ? styles.editable : ''}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Avatar name={issue.assignedToName} size={22} />
                      <span className={issue.assignedToName ? styles.assigneeName : styles.unassigned}>
                        {issue.assignedToName || 'Unassigned'}
                      </span>
                      {canEdit && (
                        <select
                          className={styles.overlaySelect}
                          aria-label={`Assignee for ${issue.title}`}
                          value={issue.assignedTo || ''}
                          onChange={(e) => {
                            const u = techUsers.find((t) => t._id === e.target.value);
                            onUpdate(issue._id, { assignedTo: u?._id ?? null, assignedToName: u?.name ?? null });
                          }}
                        >
                          <option value="">Unassigned</option>
                          {techUsers.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
                        </select>
                      )}
                    </label>
                  </div>

                  <div className={styles.cell} role="cell" data-label="Due date">
                    <label
                      className={`${styles.due} ${due ? styles[`due_${due.tone}`] : ''} ${canEdit ? styles.editable : ''}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Calendar size={13} />
                      <span>{due ? due.text : canEdit ? 'Set date' : '—'}</span>
                      {canEdit && (
                        <input
                          type="date"
                          className={styles.overlaySelect}
                          aria-label={`Due date for ${issue.title}`}
                          value={toDateInput(issue.dueDate)}
                          onClick={(e) => (e.currentTarget as HTMLInputElement).showPicker?.()}
                          onChange={(e) => onUpdate(issue._id, { dueDate: e.target.value || null })}
                        />
                      )}
                    </label>
                  </div>

                  <div className={styles.cell} role="cell" data-label="Priority">
                    <PillSelect
                      variant="tint"
                      ariaLabel={`Priority for ${issue.title}`}
                      value={issue.priority}
                      options={priorityOptions}
                      disabled={!canEdit}
                      onChange={(v) => onUpdate(issue._id, { priority: v })}
                    />
                  </div>

                  <div className={styles.cell} role="cell" data-label="Status">
                    <PillSelect
                      ariaLabel={`Status for ${issue.title}`}
                      value={issue.status}
                      options={statusOptions}
                      disabled={!canEdit}
                      onChange={(v) => onUpdate(issue._id, { status: v })}
                    />
                  </div>
                </div>
              );
            })}
          </section>
        );
      })}
    </div>
  );
}

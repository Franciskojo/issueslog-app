'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import FileUpload from '@/components/FileUpload';
import styles from './page.module.css';
import {
  ArrowLeft, FileText, Paperclip, Flag, AlertTriangle, Send, Calendar
} from '@/components/icons';

const CATEGORIES = [
  'Software / App Issue', 'Hardware Problem', 'Network / Connectivity',
  'Email / Communication', 'Printer / Scanner', 'Access / Permissions',
  'Data / Report Issue', 'Website Problem', 'Other',
];

const PRIORITY_OPTIONS = [
  { value: 'low',      label: 'Low',      desc: 'Minor inconvenience, can wait',       color: 'var(--priority-low)' },
  { value: 'medium',   label: 'Medium',   desc: 'Affecting work, needs attention',      color: 'var(--priority-medium)' },
  { value: 'high',     label: 'High',     desc: 'Major disruption to workflow',         color: 'var(--priority-high)' },
  { value: 'critical', label: 'Critical', desc: 'Work completely blocked — urgent',     color: 'var(--priority-critical)' },
];

interface Attachment {
  filename: string; originalName: string; mimetype: string;
  size: number; url: string; uploadedAt: Date;
}

export default function NewIssuePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const user = session?.user as { department?: string } | undefined;

  const [form, setForm] = useState({ title: '', description: '', category: '', priority: 'medium', dueDate: '' });
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, attachments }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push(`/issues/${data.issue._id}`);
    } catch (e) {
      setError((e as Error).message);
      setLoading(false);
    }
  };

  const selectedPriority = PRIORITY_OPTIONS.find(p => p.value === form.priority);

  return (
    <>
      <Navbar />
      <main className={`page-wrapper ${styles.main}`}>
        <div className={`container ${styles.container}`}>

          {/* Header */}
          <div className={`${styles.header} fade-in`}>
            <button className={styles.backBtn} onClick={() => router.back()}>
              <ArrowLeft size={14} />
              Back
            </button>
            <div>
              <h1 className={styles.title}>Log a New Issue</h1>
              <p className={styles.subtitle}>
                Describe the problem clearly — the more detail, the faster it gets resolved.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className={styles.formLayout}>

            {/* ── Main form ── */}
            <div className={styles.formMain}>

              {/* Issue Details */}
              <div className={`card ${styles.section}`}>
                <div className={styles.sectionHead}>
                  <FileText size={14} />
                  <h3 className={styles.sectionTitle}>Issue Details</h3>
                </div>

                <div className={styles.field}>
                  <label htmlFor="title">
                    Title <span className={styles.required}>*</span>
                  </label>
                  <input
                    id="title"
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Brief, clear summary of the issue…"
                    maxLength={150}
                    required
                    autoFocus
                  />
                  <div className={styles.fieldFooter}>
                    <span className={styles.hint}>Be specific — e.g. &quot;Outlook crashes when opening attachments&quot;</span>
                    <span className={`${styles.charCount} ${form.title.length > 130 ? styles.charCountWarn : ''}`}>
                      {form.title.length}/150
                    </span>
                  </div>
                </div>

                <div className={styles.field}>
                  <label htmlFor="category">
                    Category <span className={styles.required}>*</span>
                  </label>
                  <select
                    id="category"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    required
                  >
                    <option value="">Select a category…</option>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className={styles.field}>
                  <label htmlFor="description">
                    Description <span className={styles.required}>*</span>
                  </label>
                  <textarea
                    id="description"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder={`Describe the issue in detail:\n• When did it start?\n• What exactly happens?\n• What were you trying to do?\n• Does it happen every time?`}
                    rows={8}
                    required
                  />
                  <span className={styles.charCount}>{form.description.length} characters</span>
                </div>
              </div>

              {/* Attachments */}
              <div className={`card ${styles.section}`}>
                <div className={styles.sectionHead}>
                  <Paperclip size={14} />
                  <h3 className={styles.sectionTitle}>Attachments <span className={styles.optional}>(optional)</span></h3>
                </div>
                <p className={styles.sectionDesc}>
                  Screenshots, error logs, or documents that help explain the issue.
                </p>
                <FileUpload onUpload={setAttachments} />
              </div>
            </div>

            {/* ── Sidebar ── */}
            <aside className={styles.sidebar}>

              {/* Priority */}
              <div className={`card ${styles.section}`}>
                <div className={styles.sectionHead}>
                  <Flag size={14} />
                  <h3 className={styles.sectionTitle}>Priority Level</h3>
                </div>

                <div className={styles.priorityGrid}>
                  {PRIORITY_OPTIONS.map(({ value, label, desc, color }) => (
                    <label
                      key={value}
                      className={`${styles.priorityOption} ${form.priority === value ? styles.prioritySelected : ''}`}
                      style={{ '--prio-color': color } as React.CSSProperties}
                    >
                      <input
                        type="radio"
                        name="priority"
                        value={value}
                        checked={form.priority === value}
                        onChange={() => setForm({ ...form, priority: value })}
                        className={styles.hiddenRadio}
                      />
                      <div className={styles.priorityRow}>
                        <div className={styles.priorityDot} />
                        <span className={styles.priorityLabel}>{label}</span>
                      </div>
                      <span className={styles.priorityDesc}>{desc}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Due Date */}
              <div className={`card ${styles.section}`}>
                <div className={styles.sectionHead}>
                  <Calendar size={14} />
                  <h3 className={styles.sectionTitle}>Target Due Date <span className={styles.optional}>(optional)</span></h3>
                </div>
                <input
                  type="date"
                  id="dueDate"
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  style={{ colorScheme: 'dark' }}
                />
              </div>

              {/* Summary */}
              <div className={`card ${styles.section}`}>
                <div className={styles.sectionHead}>
                  <AlertTriangle size={14} />
                  <h3 className={styles.sectionTitle}>Before You Submit</h3>
                </div>
                <ul className={styles.checklist}>
                  <li className={form.title.length > 5 ? styles.checkDone : ''}>Clear, specific title</li>
                  <li className={form.category ? styles.checkDone : ''}>Category selected</li>
                  <li className={form.description.length > 20 ? styles.checkDone : ''}>Detailed description</li>
                </ul>
              </div>

              {/* Submit */}
              <div className={styles.submitSection}>
                {error && (
                  <div className="alert alert-error">{error}</div>
                )}

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                  style={{ width: '100%', padding: '11px' }}
                >
                  {loading ? (
                    <><span className={styles.spinner} /> Submitting…</>
                  ) : (
                    <><Send size={14} /> Submit Issue</>
                  )}
                </button>

                <p className={styles.submitHint}>
                  The Tech Team will be notified immediately and respond as soon as possible.
                </p>
              </div>
            </aside>
          </form>
        </div>
      </main>
    </>
  );
}

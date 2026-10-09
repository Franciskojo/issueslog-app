'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';
import {
  Zap, User, Mail, Lock, Building2, Shield, Eye, EyeOff,
  AlertCircle, CheckCircle2, ArrowRight, Users, Activity, Layers
} from '@/components/icons';

const DEPARTMENTS = [
  'Finance', 'HR', 'Sales', 'Marketing', 'Operations',
  'Logistics', 'Customer Service', 'Legal', 'Management', 'IT / Tech', 'Other',
];

const FEATURES = [
  { icon: Activity,  title: 'Track Everything',     desc: 'Full audit trail on every issue from open to close.' },
  { icon: Users,     title: 'Team Collaboration',   desc: 'Comment threads keep all context in one place.' },
  { icon: Layers,    title: 'Organised Workflows',  desc: 'Category, priority, and department filtering.' },
];

function getPasswordStrength(pw: string): { level: number; label: string; color: string } {
  if (pw.length === 0) return { level: 0, label: '', color: '' };
  const hasLower  = /[a-z]/.test(pw);
  const hasUpper  = /[A-Z]/.test(pw);
  const hasNumber = /[0-9]/.test(pw);
  const hasSpec   = /[^a-zA-Z0-9]/.test(pw);
  const score = [pw.length >= 8, hasLower, hasUpper, hasNumber, hasSpec].filter(Boolean).length;
  if (score <= 2) return { level: 1, label: 'Weak',   color: 'var(--priority-critical)' };
  if (score === 3) return { level: 2, label: 'Fair',   color: 'var(--priority-high)' };
  if (score === 4) return { level: 3, label: 'Good',   color: 'var(--priority-medium)' };
  return            { level: 4, label: 'Strong', color: 'var(--priority-low)' };
}

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', department: '', role: 'non-tech' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const strength = getPasswordStrength(form.password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess('Account created! Redirecting to sign in…');
      setTimeout(() => router.push('/'), 1800);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>

      {/* ── Left brand panel ── */}
      <div className={styles.brandPanel}>
        <div className={styles.brandBg}>
          <div className={styles.orb1} />
          <div className={styles.orb2} />
          <div className={styles.grid} />
        </div>

        <div className={styles.brandContent}>
          <div className={styles.brandLogo}>
            <div className={styles.brandLogoIcon}><Zap size={22} strokeWidth={2.5} /></div>
            <span className={styles.brandLogoText}>Issues<span>Log</span></span>
          </div>

          <div className={styles.brandHeadline}>
            <h1 className={styles.brandTitle}>Join your<br /><span className={styles.brandTitleAccent}>team today.</span></h1>
            <p className={styles.brandDesc}>
              Create your IssuesLog account and start reporting, tracking, and resolving issues with your team.
            </p>
          </div>

          <div className={styles.features}>
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className={styles.feature}>
                <div className={styles.featureIcon}><Icon size={16} strokeWidth={2} /></div>
                <div>
                  <div className={styles.featureTitle}>{title}</div>
                  <div className={styles.featureDesc}>{desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.brandBadge}>
            <Shield size={13} />
            <span>Secure · Role-based · Audited</span>
          </div>
        </div>
      </div>

      {/* ── Right auth panel ── */}
      <div className={styles.authPanel}>
        <div className={styles.authContent}>

          <div className={styles.mobileLogo}>
            <div className={styles.mobileLogoIcon}><Zap size={16} strokeWidth={2.5} /></div>
            <span>IssuesLog</span>
          </div>

          <div className={styles.authHeader}>
            <h2 className={styles.authTitle}>Create an account</h2>
            <p className={styles.authSubtitle}>Join your organization on IssuesLog</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.row}>
              <div className={styles.field}>
                <label htmlFor="name">Full Name</label>
                <div className={styles.inputWrapper}>
                  <span className={styles.inputIcon}><User size={14} /></span>
                  <input id="name" type="text" value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Jane Doe" required autoFocus
                    className={styles.inputWithIcon} autoComplete="name"
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label htmlFor="email">Work Email</label>
                <div className={styles.inputWrapper}>
                  <span className={styles.inputIcon}><Mail size={14} /></span>
                  <input id="email" type="email" value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="you@company.com" required
                    className={styles.inputWithIcon} autoComplete="email"
                  />
                </div>
              </div>
            </div>

            <div className={styles.field}>
              <label htmlFor="password">Password</label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputIcon}><Lock size={14} /></span>
                <input id="password" type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Min. 6 characters" minLength={6} required
                  className={`${styles.inputWithIcon} ${styles.inputWithAction}`}
                  autoComplete="new-password"
                />
                <button type="button" className={styles.eyeBtn}
                  onClick={() => setShowPass(!showPass)}
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {form.password && (
                <div className={styles.strength}>
                  <div className={styles.strengthBars}>
                    {[1,2,3,4].map(n => (
                      <div
                        key={n}
                        className={styles.strengthBar}
                        style={{ background: n <= strength.level ? strength.color : 'var(--border-subtle)' }}
                      />
                    ))}
                  </div>
                  <span style={{ color: strength.color }} className={styles.strengthLabel}>{strength.label}</span>
                </div>
              )}
            </div>

            <div className={styles.row}>
              <div className={styles.field}>
                <label htmlFor="department">Department</label>
                <div className={styles.inputWrapper}>
                  <span className={styles.inputIcon}><Building2 size={14} /></span>
                  <input
                    id="department-input"
                    type="text"
                    list="dept-list"
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                    placeholder="Your department…"
                    required
                    className={styles.inputWithIcon}
                  />
                  <datalist id="dept-list">
                    {DEPARTMENTS.map(d => <option key={d} value={d} />)}
                  </datalist>
                </div>
              </div>

              <div className={styles.field}>
                <label htmlFor="role">I am a…</label>
                <div className={styles.inputWrapper}>
                  <span className={styles.inputIcon}><Shield size={14} /></span>
                  <select id="role" value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className={styles.inputWithIcon}
                  >
                    <option value="non-tech">Non-Tech Staff</option>
                    <option value="tech">Tech Team Member</option>
                  </select>
                </div>
              </div>
            </div>

            {error   && <div className="alert alert-error"><AlertCircle size={13} />{error}</div>}
            {success && <div className="alert alert-success"><CheckCircle2 size={13} />{success}</div>}

            <button type="submit" className={`btn btn-primary ${styles.submitBtn}`} disabled={loading}>
              {loading ? (
                <><span className={styles.spinner} />Creating account…</>
              ) : (
                <>Create Account<ArrowRight size={14} strokeWidth={2.5} /></>
              )}
            </button>
          </form>

          <p className={styles.loginLink}>
            Already have an account? <Link href="/">Sign in</Link>
          </p>
        </div>

        <div className={styles.authFooter}>
          <span>© {new Date().getFullYear()} IssuesLog</span>
          <span>·</span>
          <span>Enterprise Issue Tracking</span>
        </div>
      </div>
    </div>
  );
}

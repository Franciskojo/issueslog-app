'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';
import {
  Zap, Shield, Users, Activity, AlertCircle,
  Eye, EyeOff, ArrowRight, CheckCircle2, Lock, Mail
} from '@/components/icons';

const FEATURES = [
  {
    icon: Activity,
    title: 'Real-time Tracking',
    desc: 'Live status updates and instant notifications across all teams.',
  },
  {
    icon: Shield,
    title: 'Role-Based Access',
    desc: 'Secure separation between reporters and technical resolvers.',
  },
  {
    icon: Users,
    title: 'Cross-Team Collaboration',
    desc: 'Comment threads, assignments, and full audit history.',
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'non-tech' | 'tech' | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError('Invalid email or password. Please check your credentials.');
      setLoading(false);
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className={styles.page}>
      {/* ── Left brand panel ── */}
      <div className={styles.brandPanel}>
        <div className={styles.brandBg}>
          <div className={styles.orb1} />
          <div className={styles.orb2} />
          <div className={styles.orb3} />
          <div className={styles.grid} />
        </div>

        <div className={styles.brandContent}>
          {/* Logo */}
          <div className={styles.brandLogo}>
            <div className={styles.brandLogoIcon}>
              <Zap size={22} strokeWidth={2.5} />
            </div>
            <span className={styles.brandLogoText}>
              Issues<span>Log</span>
            </span>
          </div>

          {/* Headline */}
          <div className={styles.brandHeadline}>
            <h1 className={styles.brandTitle}>
              Issue tracking<br />
              <span className={styles.brandTitleAccent}>done right.</span>
            </h1>
            <p className={styles.brandDesc}>
              A professional bridge between your technical and non-technical teams — log, track, and resolve faster.
            </p>
          </div>

          {/* Feature list */}
          <div className={styles.features}>
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className={styles.feature}>
                <div className={styles.featureIcon}>
                  <Icon size={16} strokeWidth={2} />
                </div>
                <div>
                  <div className={styles.featureTitle}>{title}</div>
                  <div className={styles.featureDesc}>{desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom badge */}
          <div className={styles.brandBadge}>
            <CheckCircle2 size={13} />
            <span>International standard · Enterprise ready</span>
          </div>
        </div>
      </div>

      {/* ── Right auth panel ── */}
      <div className={styles.authPanel}>
        <div className={styles.authContent}>

          {/* Mobile logo */}
          <div className={styles.mobileLogo}>
            <div className={styles.mobileLogoIcon}><Zap size={16} strokeWidth={2.5} /></div>
            <span>IssuesLog</span>
          </div>

          {!selectedRole ? (
            /* Role selector */
            <div className={styles.roleSection}>
              <div className={styles.authHeader}>
                <h2 className={styles.authTitle}>Welcome back</h2>
                <p className={styles.authSubtitle}>Choose how you&apos;re accessing the platform today.</p>
              </div>

              <div className={styles.roleCards}>
                <button
                  id="role-reporter"
                  className={styles.roleCard}
                  onClick={() => setSelectedRole('non-tech')}
                >
                  <div className={styles.roleCardIcon}>
                    <Users size={20} />
                  </div>
                  <div className={styles.roleCardBody}>
                    <strong>Reporting an Issue</strong>
                    <span>Non-technical team member</span>
                  </div>
                  <ArrowRight size={16} className={styles.roleCardArrow} />
                </button>

                <button
                  id="role-tech"
                  className={styles.roleCard}
                  onClick={() => setSelectedRole('tech')}
                >
                  <div className={`${styles.roleCardIcon} ${styles.roleCardIconAccent}`}>
                    <Shield size={20} />
                  </div>
                  <div className={styles.roleCardBody}>
                    <strong>Tech / Admin Access</strong>
                    <span>Technical or admin user</span>
                  </div>
                  <ArrowRight size={16} className={styles.roleCardArrow} />
                </button>
              </div>

              <p className={styles.noAccount}>
                No account?{' '}
                <Link href="/register">Create one here</Link>
              </p>
            </div>
          ) : (
            /* Login form */
            <div className={styles.formSection}>
              <div className={styles.authHeader}>
                <button
                  className={styles.backBtn}
                  onClick={() => { setSelectedRole(null); setError(''); }}
                >
                  ← Back
                </button>
                <h2 className={styles.authTitle}>
                  {selectedRole === 'tech' ? 'Tech Team Sign In' : 'Sign In'}
                </h2>
                <p className={styles.authSubtitle}>
                  {selectedRole === 'tech'
                    ? 'Access the technical dashboard and issue management.'
                    : 'Log issues and track progress with your team.'}
                </p>
              </div>

              <form onSubmit={handleLogin} className={styles.form}>
                <div className={styles.field}>
                  <label htmlFor="email">Email address</label>
                  <div className={styles.inputWrapper}>
                    <span className={styles.inputIcon}><Mail size={14} /></span>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      required
                      autoFocus
                      autoComplete="email"
                      className={styles.inputWithIcon}
                    />
                  </div>
                </div>

                <div className={styles.field}>
                  <div className={styles.fieldLabel}>
                    <label htmlFor="password">Password</label>
                  </div>
                  <div className={styles.inputWrapper}>
                    <span className={styles.inputIcon}><Lock size={14} /></span>
                    <input
                      id="password"
                      type={showPass ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••"
                      required
                      autoComplete="current-password"
                      className={`${styles.inputWithIcon} ${styles.inputWithAction}`}
                    />
                    <button
                      type="button"
                      className={styles.eyeBtn}
                      onClick={() => setShowPass(!showPass)}
                      aria-label={showPass ? 'Hide password' : 'Show password'}
                    >
                      {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="alert alert-error" role="alert">
                    <AlertCircle size={14} />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className={`btn btn-primary ${styles.submitBtn}`}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className={styles.spinner} />
                      Signing in…
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight size={14} strokeWidth={2.5} />
                    </>
                  )}
                </button>
              </form>

              <p className={styles.registerLink}>
                Don&apos;t have an account?{' '}
                <Link href="/register">Register here</Link>
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.authFooter}>
          <span>© {new Date().getFullYear()} IssuesLog</span>
          <span>·</span>
          <span>Enterprise Issue Tracking</span>
        </div>
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import styles from './Navbar.module.css';
import {
  Zap, Shield, LogOut, ListChecks, CircleCheck, Menu, X, ChevronDown
} from './icons';

/**
 * Navigation shell:
 * - Left sidebar for workspace navigation
 * - Top-right corner profile pill with dropdown menu
 * - Mobile responsive drawer
 */
export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname() || '';
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const user = session?.user as { name?: string; role?: string; email?: string } | undefined;
  const isTech = user?.role === 'tech' || user?.role === 'admin';
  const isAdmin = user?.role === 'admin';

  // Close mobile drawer and dropdown on route change
  useEffect(() => {
    setOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  // Close dropdown on click outside or Esc key
  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [menuOpen]);

  const roleClass =
    user?.role === 'admin' ? styles.roleAdmin :
    user?.role === 'tech'  ? styles.roleTech  : styles.roleNontech;
  const roleLabel =
    user?.role === 'admin' ? 'Admin' :
    user?.role === 'tech'  ? 'Tech'  : 'Non-Tech';

  const items = [
    { href: '/my-issues', label: 'My Issues', Icon: CircleCheck, show: true },
    { href: '/dashboard', label: isTech ? 'All Issues' : 'Issue Board', Icon: ListChecks, show: true },
    { href: '/admin',     label: 'Admin',      Icon: Shield,      show: isTech },
  ].filter((i) => i.show);

  const initial = (user?.name || user?.email || 'U').charAt(0).toUpperCase();

  return (
    <>
      {/* ── Mobile top bar ── */}
      <header className={styles.topbar}>
        <div className={styles.topbarLeft}>
          <button className={styles.menuBtn} onClick={() => setOpen(true)} aria-label="Open navigation">
            <Menu size={18} />
          </button>
          <Link href="/my-issues" className={styles.logo} aria-label="IssuesLog home">
            <span className={styles.logoIcon}><Zap size={14} strokeWidth={2.5} /></span>
            <span className={styles.logoText}>Issues<span className={styles.logoAccent}>Log</span></span>
          </Link>
        </div>
      </header>

      {/* ── Top-right Corner Profile ── */}
      {user && (
        <div className={styles.topRightProfile} ref={dropdownRef}>
          <button
            type="button"
            className={`${styles.profileBtn} ${menuOpen ? styles.profileBtnActive : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-expanded={menuOpen}
            aria-haspopup="true"
            aria-label="User menu"
          >
            <div className={styles.avatar} aria-hidden>{initial}</div>
            <span className={styles.profileName}>{user.name || user.email}</span>
            <span className={`${styles.roleTag} ${roleClass}`}>{roleLabel}</span>
            <ChevronDown size={14} className={`${styles.chevron} ${menuOpen ? styles.chevronOpen : ''}`} />
          </button>

          {menuOpen && (
            <div className={styles.dropdown} role="menu">
              <div className={styles.dropdownHeader}>
                <div className={styles.dropdownAvatar} aria-hidden>{initial}</div>
                <div className={styles.dropdownUserInfo}>
                  <div className={styles.dropdownName}>{user.name || 'User'}</div>
                  <div className={styles.dropdownEmail}>{user.email}</div>
                  <span className={`${styles.roleTag} ${roleClass}`} style={{ marginTop: 4 }}>{roleLabel}</span>
                </div>
              </div>

              <div className={styles.dropdownDivider} />

              <Link
                href="/my-issues"
                className={styles.dropdownItem}
                onClick={() => setMenuOpen(false)}
                role="menuitem"
              >
                <CircleCheck size={14} />
                <span>My Issues</span>
              </Link>

              <Link
                href="/dashboard"
                className={styles.dropdownItem}
                onClick={() => setMenuOpen(false)}
                role="menuitem"
              >
                <ListChecks size={14} />
                <span>{isTech ? 'All Issues' : 'Issue Board'}</span>
              </Link>

              {isAdmin && (
                <Link
                  href="/admin"
                  className={styles.dropdownItem}
                  onClick={() => setMenuOpen(false)}
                  role="menuitem"
                >
                  <Shield size={14} />
                  <span>Admin Panel</span>
                </Link>
              )}

              <div className={styles.dropdownDivider} />

              <button
                type="button"
                className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}
                onClick={() => signOut({ callbackUrl: '/' })}
                role="menuitem"
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Mobile backdrop ── */}
      {open && <div className={styles.backdrop} onClick={() => setOpen(false)} aria-hidden />}

      {/* ── Left Sidebar ── */}
      <nav className={`${styles.sidebar} ${open ? styles.sidebarOpen : ''}`} aria-label="Primary">
        <div className={styles.brandRow}>
          <Link href="/my-issues" className={styles.logo} aria-label="IssuesLog home">
            <span className={styles.logoIcon}><Zap size={15} strokeWidth={2.5} /></span>
            <span className={styles.logoText}>Issues<span className={styles.logoAccent}>Log</span></span>
          </Link>
          <button className={styles.closeBtn} onClick={() => setOpen(false)} aria-label="Close navigation">
            <X size={16} />
          </button>
        </div>

        <ul className={styles.nav}>
          {items.map(({ href, label, Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`${styles.navItem} ${active ? styles.navItemActive : ''}`}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon size={16} />
                  <span>{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}

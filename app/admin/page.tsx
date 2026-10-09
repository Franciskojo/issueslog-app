'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import styles from './page.module.css';
import {
  Users, Shield, Search, CheckCircle2, X,
  User, Building2, Calendar, Settings, Activity
} from '@/components/icons';

interface UserData {
  _id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  createdAt: string;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const user = session?.user as { role?: string } | undefined;

  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (status === 'authenticated') {
      if (user?.role !== 'admin' && user?.role !== 'tech') { router.push('/dashboard'); return; }
      fetchUsers();
    } else if (status === 'unauthenticated') {
      router.push('/');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      setUsers(data.users || []);
    } catch { console.error('Failed to fetch users'); }
    finally { setLoading(false); }
  };

  const updateRole = async (userId: string, newRole: string) => {
    setUpdating(userId);
    const res = await fetch('/api/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, role: newRole }),
    });
    if (res.ok) {
      setUsers((prev) => prev.map((u) => u._id === userId ? { ...u, role: newRole } : u));
      setMsg('Role updated successfully');
      setTimeout(() => setMsg(''), 3000);
    }
    setUpdating(null);
  };

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.department.toLowerCase().includes(search.toLowerCase())
  );

  const roleCount = (role: string) => users.filter((u) => u.role === role).length;

  const kpiCards = [
    { label: 'Total Users',  value: users.length,                          Icon: Users,    color: 'var(--accent)' },
    { label: 'Tech Team',    value: roleCount('tech') + roleCount('admin'), Icon: Shield,   color: 'var(--status-resolved)' },
    { label: 'Non-Tech',     value: roleCount('non-tech'),                  Icon: User,     color: 'var(--status-open)' },
    { label: 'Admins',       value: roleCount('admin'),                     Icon: Settings, color: 'var(--priority-high)' },
  ];

  const getRoleBadge = (role: string) => {
    if (role === 'admin')    return 'badge-role-admin';
    if (role === 'tech')     return 'badge-role-tech';
    return 'badge-role-nontech';
  };

  const getRoleLabel = (role: string) => {
    if (role === 'admin')    return 'Admin';
    if (role === 'tech')     return 'Tech';
    return 'Non-Tech';
  };

  return (
    <>
      <Navbar />
      <main className={`page-wrapper ${styles.main}`}>
        <div className="container">

          {/* Header */}
          <div className={`${styles.header} fade-in`}>
            <div>
              <h1 className={styles.title}>Admin Panel</h1>
              <p className={styles.subtitle}>Manage team members, roles, and access permissions</p>
            </div>
          </div>

          {/* KPI strip */}
          <div className={`${styles.kpiStrip} fade-in fade-in-delay-1`}>
            {kpiCards.map(({ label, value, Icon, color }) => (
              <div key={label} className={styles.kpiCard} style={{ '--kpi-color': color } as React.CSSProperties}>
                <div className={styles.kpiIconWrap}><Icon size={15} /></div>
                <div className={styles.kpiBody}>
                  <span className={styles.kpiValue}>{value}</span>
                  <span className={styles.kpiLabel}>{label}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Search + message */}
          <div className={`${styles.toolbar} fade-in fade-in-delay-2`}>
            <div className={styles.searchBox}>
              <span className={styles.searchIcon}><Search size={14} /></span>
              <input
                id="admin-search"
                type="text"
                placeholder="Search by name, email, or department…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={styles.searchInput}
              />
              {search && (
                <button className={styles.clearBtn} onClick={() => setSearch('')} aria-label="Clear search">
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {msg && (
            <div className="alert alert-success fade-in" style={{ marginBottom: 16 }}>
              <CheckCircle2 size={13} />
              {msg}
            </div>
          )}

          {/* Table */}
          {loading ? (
            <div className={styles.skeletonList}>
              {[...Array(5)].map((_, i) => (
                <div key={i} className={`skeleton ${styles.skeletonRow}`} />
              ))}
            </div>
          ) : (
            <div className={`${styles.tableWrapper} fade-in fade-in-delay-2`}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th><User size={11} /> User</th>
                    <th><Building2 size={11} /> Department</th>
                    <th><Activity size={11} /> Role</th>
                    <th><Calendar size={11} /> Joined</th>
                    {user?.role === 'admin' && <th><Settings size={11} /> Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => (
                    <tr key={u._id} className={styles.tableRow}>
                      <td>
                        <div className={styles.userCell}>
                          <div className={styles.avatar}>
                            {(u.name || u.email || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div className={styles.userInfo}>
                            <span className={styles.userName}>{u.name || u.email}</span>
                            <span className={styles.userEmail}>{u.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className={styles.tdMuted}>{u.department}</td>
                      <td>
                        <span className={`badge ${getRoleBadge(u.role)}`}>
                          {getRoleLabel(u.role)}
                        </span>
                      </td>
                      <td className={styles.tdDate}>
                        {new Date(u.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      {user?.role === 'admin' && (
                        <td>
                          <select
                            value={u.role}
                            onChange={(e) => updateRole(u._id, e.target.value)}
                            className={styles.roleSelect}
                            disabled={updating === u._id}
                            aria-label={`Change role for ${u.name}`}
                          >
                            <option value="non-tech">Non-Tech</option>
                            <option value="tech">Tech</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>

              {filtered.length === 0 && (
                <div className={styles.emptyTable}>
                  <Search size={28} strokeWidth={1.2} />
                  <p>No users match &quot;{search}&quot;</p>
                </div>
              )}

              <div className={styles.tableFooter}>
                Showing <strong>{filtered.length}</strong> of <strong>{users.length}</strong> users
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

import styles from './Avatar.module.css';

const PALETTE = ['#7857ff', '#06b6d4', '#f472b6', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#a855f7'];

function colorFor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

export default function Avatar({ name, size = 24 }: { name?: string; size?: number }) {
  if (!name) {
    return (
      <span
        className={`${styles.avatar} ${styles.empty}`}
        style={{ width: size, height: size }}
        aria-label="Unassigned"
      />
    );
  }
  return (
    <span
      className={styles.avatar}
      title={name}
      style={{ width: size, height: size, fontSize: size * 0.42, background: colorFor(name) }}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

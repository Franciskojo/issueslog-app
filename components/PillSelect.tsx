'use client';

import styles from './PillSelect.module.css';

export interface PillOption {
  value: string;
  label: string;
  color?: string;
}

interface Props {
  value: string;
  options: PillOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  ariaLabel: string;
  /** Show a leading dot in the option colour (status) or fill the pill tint (priority). */
  variant?: 'dot' | 'tint';
}

/** A native <select> dressed as a coloured pill — editable inline, accessible by default. */
export default function PillSelect({ value, options, onChange, disabled, ariaLabel, variant = 'dot' }: Props) {
  const current = options.find((o) => o.value === value);
  const color = current?.color || 'var(--text-secondary)';

  return (
    <span
      className={`${styles.pill} ${variant === 'tint' ? styles.tint : ''} ${disabled ? styles.readonly : ''}`}
      style={{ '--pill-color': color } as React.CSSProperties}
      onClick={(e) => e.stopPropagation()}
    >
      {variant === 'dot' && <span className={styles.dot} />}
      <span className={styles.label}>{current?.label ?? value}</span>
      {!disabled && (
        <select
          className={styles.select}
          value={value}
          aria-label={ariaLabel}
          onChange={(e) => onChange(e.target.value)}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      )}
    </span>
  );
}

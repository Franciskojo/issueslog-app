'use client';

import { useState, useRef } from 'react';
import styles from './FileUpload.module.css';

interface Attachment {
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  url: string;
  uploadedAt: Date;
}

interface Props {
  onUpload: (attachments: Attachment[]) => void;
  existingAttachments?: Attachment[];
}

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function FileUpload({ onUpload, existingAttachments = [] }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>(existingAttachments);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList) => {
    if (!files.length) return;
    setError('');
    setUploading(true);

    try {
      const form = new FormData();
      Array.from(files).forEach((f) => form.append('files', f));

      const res = await fetch('/api/upload', { method: 'POST', body: form });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Upload failed');

      const newAttachments = [...attachments, ...data.attachments];
      setAttachments(newAttachments);
      onUpload(newAttachments);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = (index: number) => {
    const updated = attachments.filter((_, i) => i !== index);
    setAttachments(updated);
    onUpload(updated);
  };

  const isImage = (mime: string) => mime.startsWith('image/');

  return (
    <div className={styles.wrapper}>
      <div
        className={`${styles.dropzone} ${dragging ? styles.dragging : ''} ${uploading ? styles.uploading : ''}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.txt,.doc,.docx"
          className={styles.hiddenInput}
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
        <div className={styles.dropContent}>
          {uploading ? (
            <>
              <span className={styles.uploadIcon}>⏳</span>
              <span className={styles.dropText}>Uploading…</span>
            </>
          ) : (
            <>
              <span className={styles.uploadIcon}>📎</span>
              <span className={styles.dropText}>
                <strong>Click to attach</strong> or drag & drop
              </span>
              <span className={styles.dropHint}>Images, PDF, DOC — max 10MB each</span>
            </>
          )}
        </div>
      </div>

      {error && <p className={`alert alert-error ${styles.error}`}>{error}</p>}

      {attachments.length > 0 && (
        <ul className={styles.list}>
          {attachments.map((att, i) => (
            <li key={i} className={styles.item}>
              {isImage(att.mimetype) ? (
                <img src={att.url} alt={att.originalName} className={styles.thumb} />
              ) : (
                <div className={styles.fileIcon}>📄</div>
              )}
              <div className={styles.itemInfo}>
                <span className={styles.itemName}>{att.originalName}</span>
                <span className={styles.itemSize}>{formatSize(att.size)}</span>
              </div>
              <button
                type="button"
                className={styles.removeBtn}
                onClick={() => removeAttachment(i)}
                title="Remove"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

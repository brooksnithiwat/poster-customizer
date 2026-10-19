import { useEffect } from 'react';

export default function Toast({ toast, onDismiss }) {
  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(onDismiss, toast.kind === 'error' ? 6000 : 3000);
    return () => clearTimeout(t);
  }, [toast, onDismiss]);

  if (!toast) return null;
  return (
    <div className={`toast ${toast.kind}`} role={toast.kind === 'error' ? 'alert' : 'status'}>
      <span>{toast.message}</span>
      <button type="button" className="icon-btn small" onClick={onDismiss} aria-label="Dismiss">×</button>
    </div>
  );
}

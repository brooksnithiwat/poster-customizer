import { useCallback, useRef, useState } from 'react';

const HISTORY_LIMIT = 100;
const COALESCE_MS = 900;

/**
 * Undo/redo history for an immutable value.
 * commit(updater, { key }) — consecutive commits with the same key inside a short window
 * (typing, dragging a slider) are merged into one undo step.
 */
export function useHistory(initialPresent) {
  const [history, setHistory] = useState({ past: [], present: initialPresent, future: [] });
  const lastCommit = useRef({ key: null, time: 0 });

  const commit = useCallback((updater, options = {}) => {
    const now = Date.now();
    const key = options.key || null;
    const coalesce = Boolean(key) && lastCommit.current.key === key && now - lastCommit.current.time < COALESCE_MS;
    lastCommit.current = { key, time: now };

    setHistory((h) => {
      const next = typeof updater === 'function' ? updater(h.present) : updater;
      if (next === h.present) return h;
      if (coalesce && h.past.length > 0) return { past: h.past, present: next, future: [] };
      return { past: [...h.past, h.present].slice(-HISTORY_LIMIT), present: next, future: [] };
    });
  }, []);

  const undo = useCallback(() => {
    lastCommit.current = { key: null, time: 0 };
    setHistory((h) => {
      if (!h.past.length) return h;
      return { past: h.past.slice(0, -1), present: h.past[h.past.length - 1], future: [h.present, ...h.future] };
    });
  }, []);

  const redo = useCallback(() => {
    lastCommit.current = { key: null, time: 0 };
    setHistory((h) => {
      if (!h.future.length) return h;
      return { past: [...h.past, h.present], present: h.future[0], future: h.future.slice(1) };
    });
  }, []);

  /** Replace the value and clear history (e.g. a brand-new poster). */
  const resetHistory = useCallback((present) => {
    lastCommit.current = { key: null, time: 0 };
    setHistory({ past: [], present, future: [] });
  }, []);

  return {
    history,
    present: history.present,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    commit,
    undo,
    redo,
    resetHistory,
  };
}

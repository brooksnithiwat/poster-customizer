import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Toolbar from './components/Toolbar.jsx';
import Sidebar from './components/sidebar/Sidebar.jsx';
import PosterCanvas from './components/canvas/PosterCanvas.jsx';
import Toast from './components/Toast.jsx';
import { useHistory } from './state/useHistory.js';
import { collectAssetIds, useAssets } from './state/useAssets.js';
import {
  TEMPLATE,
  createInitialElements,
  createPhotoElement,
  createRoleText,
  createTextElement,
  moveElement,
  parseSelectionKey,
} from './state/editorModel.js';
import { PHOTO_TYPES, loadImageFile, loadTemplateImage } from './lib/imageLoader.js';
import { downloadBlob, exportFileName } from './lib/exportPoster.js';
import { SYSTEM_FONTS } from './lib/fonts.js'; // loadFontFile: font loading hidden

const isTypingTarget = (t) => t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);

export default function App() {
  const [poster, setPoster] = useState(null); // the bundled template: { id, img, url, width, height, name }
  const { history, present: elements, canUndo, canRedo, commit, undo, redo, resetHistory } = useHistory([]);
  const { addAsset, getAsset, pruneAssets } = useAssets();
  const [selectedKey, setSelectedKey] = useState(null);
  const [keepInside, setKeepInside] = useState(true);
  const [toast, setToast] = useState(null);
  const [busy, setBusy] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [customFonts, setCustomFonts] = useState([]);
  const [fontVersion, setFontVersion] = useState(0);
  const canvasRef = useRef(null);

  const fonts = useMemo(() => [...customFonts, ...SYSTEM_FONTS], [customFonts]);
  const notify = useCallback((message, kind = 'info') => setToast({ message, kind, id: Date.now() }), []);
  const dismissToast = useCallback(() => setToast(null), []);

  // The poster is always the bundled template: load it once at startup with its default fields.
  useEffect(() => {
    let cancelled = false;
    loadTemplateImage(TEMPLATE)
      .then((loaded) => {
        if (cancelled) return;
        const next = { ...loaded, id: 1 };
        resetHistory(createInitialElements(next));
        setPoster(next);
      })
      .catch((err) => !cancelled && notify(err.message, 'error'));
    return () => {
      cancelled = true;
    };
  }, [resetHistory, notify]);

  // Free character images no longer referenced by any undo/redo state.
  useEffect(() => {
    pruneAssets(collectAssetIds(history));
  }, [history, pruneAssets]);

  // Drop the selection if its element disappeared (undo, delete…).
  const { elementId: selectedId, optionId: selectedOptionId } = parseSelectionKey(selectedKey);
  const selectedEl = elements.find((el) => el.id === selectedId) || null;
  useEffect(() => {
    if (!selectedKey) return;
    if (!selectedEl) {
      setSelectedKey(null);
      return;
    }
    if (selectedOptionId) {
      const opt = selectedEl.options?.find((o) => o.id === selectedOptionId);
      const visible = opt && selectedEl.mode === 'markers' && (opt.selected || selectedEl.showUnselected);
      if (!visible) setSelectedKey(null);
    }
  }, [selectedKey, selectedEl, selectedOptionId]);

  // ---------- element actions ----------
  const update = useCallback(
    (id, patch, key) =>
      commit(
        (els) => els.map((el) => (el.id === id ? { ...el, ...(typeof patch === 'function' ? patch(el) : patch) } : el)),
        { key },
      ),
    [commit],
  );

  const updateOption = useCallback(
    (elId, optId, patch) => update(elId, (el) => ({ options: el.options.map((o) => (o.id === optId ? { ...o, ...patch } : o)) })),
    [update],
  );

  const remove = useCallback(
    (id) => {
      commit((els) => els.filter((el) => el.id !== id));
      setSelectedKey((k) => (parseSelectionKey(k).elementId === id ? null : k));
    },
    [commit],
  );

  const move = useCallback((id, dir) => commit((els) => moveElement(els, id, dir)), [commit]);

  const addText = useCallback(() => {
    if (!poster) return;
    const el = createTextElement(poster);
    commit((els) => [...els, el]);
    setSelectedKey(el.id);
  }, [poster, commit]);

  const setRoleText = useCallback(
    (role, text) => {
      if (!poster) return;
      commit(
        (els) => {
          const existing = els.find((el) => el.type === 'text' && el.role === role);
          if (existing) return els.map((el) => (el === existing ? { ...el, text } : el));
          return [...els, { ...createRoleText(poster, role), text }];
        },
        { key: `role:${role}` },
      );
    },
    [poster, commit],
  );

  // ---------- photo (the single image that goes in the template's white box) ----------
  const setPhoto = useCallback(
    async (file) => {
      if (!poster) return;
      setBusy(true);
      try {
        const loaded = await loadImageFile(file, PHOTO_TYPES);
        const assetId = addAsset(loaded);
        const photo = createPhotoElement({ assetId, width: loaded.width, height: loaded.height, name: loaded.name });
        commit((els) => {
          const existing = els.find((el) => el.type === 'image');
          if (!existing) return [photo, ...els]; // sits right above the template, below text and ticks
          return els.map((el) => (el === existing ? { ...photo, id: existing.id, flipX: existing.flipX } : el));
        });
      } catch (err) {
        notify(err.message, 'error');
      } finally {
        setBusy(false);
      }
    },
    [poster, addAsset, commit, notify],
  );

  // // ---------- fonts ----------
  // const loadFont = useCallback(
  //   async (file) => {
  //     try {
  //       const family = await loadFontFile(file);
  //       setCustomFonts((list) => (list.includes(family) ? list : [family, ...list]));
  //       setFontVersion((v) => v + 1);
  //       notify(`Font "${family}" is ready to use.`);
  //     } catch (err) {
  //       notify(err.message, 'error');
  //     }
  //   },
  //   [notify],
  // );

  // ---------- toolbar ----------
  const reset = useCallback(() => {
    if (!poster) return;
    commit(createInitialElements(poster));
    setSelectedKey(null);
    notify('Reset to the template defaults. Use Undo to bring your changes back.');
  }, [poster, commit, notify]);

  const download = useCallback(async () => {
    if (!poster || !canvasRef.current) return;
    setExporting(true);
    try {
      const blob = await canvasRef.current.exportPNG();
      downloadBlob(blob, exportFileName(poster.name));
      notify(`Exported ${poster.width} × ${poster.height}px PNG.`);
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setExporting(false);
    }
  }, [poster, notify]);

  // ---------- keyboard shortcuts ----------
  useEffect(() => {
    const onKey = (e) => {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === 'z' && !isTypingTarget(e.target)) {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if (mod && e.key.toLowerCase() === 'y' && !isTypingTarget(e.target)) {
        e.preventDefault();
        redo();
        return;
      }
      if (isTypingTarget(e.target) || !selectedEl) return;
      if (e.key === 'Escape') setSelectedKey(null);
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        if (selectedOptionId) updateOption(selectedEl.id, selectedOptionId, { selected: false });
        else if (selectedEl.type !== 'objectives') remove(selectedEl.id);
      }
      const arrows = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
      if (arrows[e.key]) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const [dx, dy] = arrows[e.key];
        if (selectedOptionId) {
          update(
            selectedEl.id,
            (el) => ({
              options: el.options.map((o) => (o.id === selectedOptionId ? { ...o, mx: (o.mx ?? el.x) + dx * step, my: (o.my ?? el.y) + dy * step } : o)),
            }),
            `nudge:${selectedKey}`,
          );
        } else {
          update(selectedEl.id, (el) => ({ x: el.x + dx * step, y: el.y + dy * step }), `nudge:${selectedKey}`);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo, selectedEl, selectedOptionId, selectedKey, update, updateOption, remove]);

  const actions = {
    addText,
    setRoleText,
    select: setSelectedKey,
    update,
    remove,
    move,
    setPhoto,
    // loadFont,
  };

  return (
    <div className="app">
      <Toolbar
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        onReset={reset}
        onDownload={download}
        hasPoster={Boolean(poster)}
        exporting={exporting}
      />
      <div className="editor">
        <Sidebar
          poster={poster}
          elements={elements}
          selectedEl={selectedEl}
          selectedKey={selectedKey}
          fonts={fonts}
          customFonts={customFonts}
          busy={busy}
          actions={actions}
          getAsset={getAsset}
        />
        <main className="main">
          {poster ? (
            <PosterCanvas
              key={poster.id}
              ref={canvasRef}
              poster={poster}
              elements={elements}
              getAsset={getAsset}
              selectedKey={selectedKey}
              onSelect={setSelectedKey}
              onChange={update}
              onOptionChange={updateOption}
              keepInside={keepInside}
              onToggleKeepInside={setKeepInside}
              fontVersion={fontVersion}
            />
          ) : (
            <div className="empty-state">Loading template…</div>
          )}
        </main>
      </div>
      <Toast toast={toast} onDismiss={dismissToast} />
    </div>
  );
}

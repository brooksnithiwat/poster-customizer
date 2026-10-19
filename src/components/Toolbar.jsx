export default function Toolbar({ canUndo, canRedo, onUndo, onRedo, onReset, onDownload, hasPoster, exporting }) {
  return (
    <header className="toolbar">
      <div className="brand">
        <img className="brand-mark" src={`${import.meta.env.BASE_URL}pumpkin.svg`} alt="" aria-hidden="true" />
        <span>Siam Halloween Poster Customizer</span>
      </div>
      <div className="toolbar-actions">
        <button type="button" className="btn ghost" onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl+Z)">↶ Undo</button>
        <button type="button" className="btn ghost" onClick={onRedo} disabled={!canRedo} title="Redo (Ctrl+Y)">↷ Redo</button>
        <button type="button" className="btn ghost" onClick={onReset} disabled={!hasPoster} title="Clear customizations, keep the poster">Reset</button>
        <button type="button" className="btn bg-green-600" onClick={onDownload} disabled={!hasPoster || exporting}>
          {exporting ? 'Exporting…' : '⬇ ดาวน์โหลดรูป'}
        </button>
      </div>
    </header>
  );
}

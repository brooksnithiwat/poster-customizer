export default function ZoomControls({ scale, isFit, onZoomIn, onZoomOut, onFit, onActual, keepInside, onToggleKeepInside, posterSize }) {
  return (
    <div className="zoom-bar">
      <div className="zoom-group">
        <button type="button" className="icon-btn" onClick={onZoomOut} title="Zoom out" aria-label="Zoom out">−</button>
        <span className="zoom-value" aria-live="polite">{Math.round(scale * 100)}%</span>
        <button type="button" className="icon-btn" onClick={onZoomIn} title="Zoom in" aria-label="Zoom in">+</button>
        <button type="button" className={`chip ${isFit ? 'active' : ''}`} onClick={onFit}>Fit</button>
        <button type="button" className="chip" onClick={onActual}>100%</button>
      </div>
      <label className="keep-inside">
        <input type="checkbox" checked={keepInside} onChange={(e) => onToggleKeepInside(e.target.checked)} />
        Keep inside poster
      </label>
      <span className="poster-size">{posterSize}</span>
    </div>
  );
}

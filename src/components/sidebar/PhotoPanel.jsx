import { FileButton, RangeField, Section, Toggle } from '../ui/Controls.jsx';

// Keeps the angle inside the slider's -180..180 range.
const wrap180 = (deg) => ((((deg + 180) % 360) + 360) % 360) - 180;

const ACCEPT = 'image/png,image/jpeg,image/webp';

export default function PhotoPanel({ photo, getAsset, disabled, onUpload, onUpdate, onRemove }) {
  const asset = photo ? getAsset(photo.assetId) : null;
  const set = (prop) => (value) => onUpdate(photo.id, { [prop]: value }, `${photo.id}:${prop}`);

  return (
    <Section title="1 · Photo">
      <p className="hint">อัพโหลดรูปเป็นไฟล์ PNG, JPG หรือ WebP ได้เลย</p>
      <div className="row">
        <FileButton accept={ACCEPT} onFile={onUpload} className="btn primary" disabled={disabled}>
          {photo ? 'Replace photo' : 'Upload photo'}
        </FileButton>
        {photo && (
          <button type="button" className="link danger" onClick={() => onRemove(photo.id)}>Remove</button>
        )}
      </div>
      {photo && (
        <div className="editor-card">
          {asset && (
            <div className="poster-info">
              <img src={asset.url} alt="" className="poster-thumb" />
              <div>
                <strong title={photo.name}>{photo.name}</strong>
                <span>{photo.naturalWidth} × {photo.naturalHeight}px</span>
              </div>
            </div>
          )}
          <RangeField label="Zoom" value={photo.zoom} min={1} max={4} step={0.01} onChange={set('zoom')} suffix="×" />
          <div className="grid-2">
            <RangeField label="ขยับแนวนอน" value={photo.panX} min={-1} max={1} step={0.01} onChange={set('panX')} />
            <RangeField label="ขยับแนวตั้ง" value={photo.panY} min={-1} max={1} step={0.01} onChange={set('panY')} />
          </div>
          <RangeField label="Rotate" value={photo.rotate || 0} min={-180} max={180} step={1} onChange={set('rotate')} suffix="°" />
          <div className="row wrap">
            <button type="button" className="btn small" onClick={() => onUpdate(photo.id, { rotate: wrap180((photo.rotate || 0) - 90) })}>↺ 90°</button>
            <button type="button" className="btn small" onClick={() => onUpdate(photo.id, { rotate: wrap180((photo.rotate || 0) + 90) })}>↻ 90°</button>
          </div>
          <div className="row wrap">
            <Toggle label="Flip" checked={photo.flipX} onChange={set('flipX')} />
            <button type="button" className="btn small" onClick={() => onUpdate(photo.id, { zoom: 1, panX: 0, panY: 0, rotate: 0 })}>Reset framing</button>
          </div>
          <p className="hint">หมายเหตุ : สามารถกดลากรูปไปมาได้</p>
        </div>
      )}
    </Section>
  );
}

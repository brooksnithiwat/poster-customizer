import { ColorField, Field, FontSelect, RangeField, Section, Segmented, Toggle } from '../ui/Controls.jsx';
import { elementLabel } from '../../state/editorModel.js';

const MAX_ROLE_CHARS = 15;

function TextEditor({ el, fonts, onUpdate, onRemove }) {
  const set = (prop) => (value) => onUpdate(el.id, { [prop]: value }, `${el.id}:${prop}`);
  return (
    <div className="editor-card">
      <div className="editor-card-head">
        <strong>Edit selected text</strong>
        <button type="button" className="link danger" onClick={() => onRemove(el.id)}>Remove</button>
      </div>
      <Field label="Text">
        <textarea rows={2} value={el.text} onChange={(e) => set('text')(e.target.value)} placeholder="Type here…" />
      </Field>
      <Field label="Font">
        <FontSelect value={el.fontFamily} fonts={fonts} onChange={set('fontFamily')} />
      </Field>
      <div className="row">
        <Toggle label="Bold" checked={el.bold} onChange={set('bold')} />
        <Toggle label="Italic" checked={el.italic} onChange={set('italic')} />
      </div>
      <RangeField label="Font size" value={el.fontSize} min={4} max={600} onChange={set('fontSize')} suffix="px" />
      <Segmented
        label="Alignment"
        value={el.align}
        onChange={set('align')}
        options={[
          { value: 'left', label: 'Left' },
          { value: 'center', label: 'Center' },
          { value: 'right', label: 'Right' },
        ]}
      />
      <div className="grid-2">
        <ColorField label="Color" value={el.fill} onChange={set('fill')} />
        <ColorField label="Outline" value={el.stroke} onChange={set('stroke')} />
      </div>
      <RangeField label="Outline width" value={el.strokeWidth} min={0} max={60} step={0.5} onChange={set('strokeWidth')} suffix="px" />
      <Toggle label="Drop shadow" checked={el.shadowEnabled} onChange={set('shadowEnabled')} />
      {el.shadowEnabled && (
        <div className="grid-2">
          <ColorField label="Shadow" value={el.shadowColor} onChange={set('shadowColor')} />
          <RangeField label="Blur" value={el.shadowBlur} min={0} max={100} onChange={set('shadowBlur')} />
        </div>
      )}
      <details className="more">
        <summary>Position & spacing</summary>
        <div className="grid-2">
          <RangeField label="X" value={el.x} min={-2000} max={20000} onChange={set('x')} />
          <RangeField label="Y" value={el.y} min={-2000} max={20000} onChange={set('y')} />
        </div>
        <RangeField label="Box width" value={el.width} min={20} max={20000} onChange={set('width')} suffix="px" />
        <RangeField label="Rotation" value={el.rotation} min={-180} max={180} onChange={set('rotation')} suffix="°" />
        <RangeField label="Line height" value={el.lineHeight} min={0.6} max={3} step={0.05} onChange={set('lineHeight')} />
        <RangeField label="Letter spacing" value={el.letterSpacing} min={-20} max={100} step={0.5} onChange={set('letterSpacing')} />
        <RangeField label="Opacity" value={el.opacity} min={0} max={1} step={0.01} onChange={set('opacity')} />
      </details>
    </div>
  );
}

export default function TextPanel({ elements, selectedEl, fonts, onSetRoleText, onAddText, onSelect, onUpdate, onRemove, disabled }) {
  const nameEl = elements.find((el) => el.type === 'text' && el.role === 'name');
  const charEl = elements.find((el) => el.type === 'text' && el.role === 'character');
  const texts = elements.filter((el) => el.type === 'text');

  return (
    <Section title="2 · Text" badge={texts.length || null}>
      <Field label="ชื่อ | Name">
        <input type="text" value={nameEl?.text || ''} placeholder="Your name" maxLength={MAX_ROLE_CHARS} disabled={disabled} onChange={(e) => onSetRoleText('name', e.target.value)} />
        <small className="hint" style={{ color: "#e5484d" }}>หมายเหตุ : ใส่ได้ไม่เกิน {MAX_ROLE_CHARS} ตัวอักษร</small>
      </Field>
      
      <Field label="คอสเป็นใคร | Character">
        <input type="text" value={charEl?.text || ''} placeholder="Character you are cosplaying" maxLength={MAX_ROLE_CHARS} disabled={disabled} onChange={(e) => onSetRoleText('character', e.target.value)} />
        <small className="hint" style={{ color: "#e5484d" }}>หมายเหตุ : ใส่ได้ไม่เกิน {MAX_ROLE_CHARS} ตัวอักษร</small>
      </Field>
      {/* <button type="button" className="btn" onClick={onAddText} disabled={disabled}>+ Add text</button>

      {texts.length > 0 && (
        <ul className="item-list">
          {texts.map((el) => (
            <li key={el.id}>
              <button type="button" className={selectedEl?.id === el.id ? 'active' : ''} onClick={() => onSelect(el.id)}>
                <span className="dot" style={{ background: el.fill }} />
                {elementLabel(el)}
              </button>
            </li>
          ))}
        </ul>
      )} */}

      {/* {selectedEl?.type === 'text' ? (
        <TextEditor el={selectedEl} fonts={fonts} onUpdate={onUpdate} onRemove={onRemove} />
      ) : (
        texts.length > 0 && <p className="hint">Select a text on the poster or in the list to style it.</p>
      )} */}
    </Section>
  );
}

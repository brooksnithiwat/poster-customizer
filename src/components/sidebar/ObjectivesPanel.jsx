import { ColorField, Field, RangeField, Section, Toggle } from '../ui/Controls.jsx';

export default function ObjectivesPanel({ el, onUpdate, onSelect, selectedKey, disabled }) {
  if (!el) {
    return (
      <Section title="3 · Objective | มาทำอะไร?">
        <p className="hint">Loading template…</p>
      </Section>
    );
  }

  const set = (prop) => (value) => onUpdate(el.id, { [prop]: value }, `${el.id}:${prop}`);
  const updateOption = (optId, patch, key) =>
    onUpdate(el.id, (cur) => ({ options: cur.options.map((o) => (o.id === optId ? { ...o, ...patch } : o)) }), key);

  const selectedCount = el.options.filter((o) => o.selected).length;

  return (
    <Section title="3 · Objective | มาทำอะไร?" badge={selectedCount || null}>
      <ul className="option-list">
        {el.options.map((opt) => (
          <li key={opt.id} className={selectedKey === `${el.id}::${opt.id}` ? 'active' : ''}>
            <input
              type="checkbox"
              checked={opt.selected}
              disabled={disabled}
              aria-label={`Select ${opt.label}`}
              onChange={(e) => updateOption(opt.id, { selected: e.target.checked })}
            />
            <span
              role="presentation"
              onClick={() => opt.selected && onSelect(`${el.id}::${opt.id}`)}
            >
              {opt.label}
            </span>
          </li>
        ))}
      </ul>
      {/* <Field label="Mark style">
        <select value={el.markerStyle} onChange={(e) => set('markerStyle')(e.target.value)}>
          <option value="check">Check mark ✓</option>
          <option value="cross">Cross mark ✗</option>
          <option value="circle">Filled dot ◉</option>
        </select>
      </Field>
      <div className="grid-2">
        <ColorField label="Mark color" value={el.markerColor} onChange={set('markerColor')} />
        <RangeField label="Mark size" value={el.markerSize} min={10} max={80} onChange={set('markerSize')} suffix="px" />
      </div>
      <Toggle label="Hidden" checked={el.hidden} onChange={set('hidden')} /> */}
      {/* <p className="hint">Ticked options are drawn inside the circles printed on the poster. Drag a mark to fine-tune it.</p> */}
    </Section>
  );
}

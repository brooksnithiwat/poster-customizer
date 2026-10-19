import { useRef } from 'react';

export function Section({ title, children, defaultOpen = true, badge }) {
  return (
    <details className="section" open={defaultOpen}>
      <summary>
        <span>{title}</span>
        {badge != null && <span className="badge">{badge}</span>}
      </summary>
      <div className="section-body">{children}</div>
    </details>
  );
}

export function Field({ label, children, inline = false }) {
  return (
    <label className={`field ${inline ? 'inline' : ''}`}>
      <span className="field-label">{label}</span>
      {children}
    </label>
  );
}

export function RangeField({ label, value, min, max, step = 1, onChange, suffix = '' }) {
  const display = Number.isFinite(value) ? Math.round(value * 100) / 100 : 0;
  return (
    <div className="field range-field">
      <div className="range-head">
        <span className="field-label">{label}</span>
        <span className="range-number">
          <input
            type="number"
            value={display}
            min={min}
            max={max}
            step={step}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              if (Number.isFinite(v)) onChange(v);
            }}
          />
          {suffix && <em>{suffix}</em>}
        </span>
      </div>
      <input type="range" value={Math.min(max, Math.max(min, display))} min={min} max={max} step={step} onChange={(e) => onChange(parseFloat(e.target.value))} />
    </div>
  );
}

export function ColorField({ label, value, onChange }) {
  return (
    <label className="field color-field">
      <span className="field-label">{label}</span>
      <span className="color-input">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} />
        <code>{value}</code>
      </span>
    </label>
  );
}

export function Segmented({ value, options, onChange, label }) {
  return (
    <div className="field">
      {label && <span className="field-label">{label}</span>}
      <div className="segmented" role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={value === o.value}
            className={value === o.value ? 'active' : ''}
            onClick={() => onChange(o.value)}
            title={o.title || o.label}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Toggle({ label, checked, onChange }) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="toggle-track" aria-hidden="true" />
      <span>{label}</span>
    </label>
  );
}

export function FileButton({ accept, onFile, children, className = 'btn', disabled }) {
  const inputRef = useRef(null);
  return (
    <>
      <button type="button" className={className} onClick={() => inputRef.current?.click()} disabled={disabled}>
        {children}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (file) onFile(file);
        }}
      />
    </>
  );
}

export function FontSelect({ value, fonts, onChange }) {
  const list = fonts.includes(value) ? fonts : [value, ...fonts];
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} style={{ fontFamily: value }}>
      {list.map((f) => (
        <option key={f} value={f} style={{ fontFamily: f }}>
          {f}
        </option>
      ))}
    </select>
  );
}

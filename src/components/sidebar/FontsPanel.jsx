import { FileButton, Section } from '../ui/Controls.jsx';

export default function FontsPanel({ customFonts, onFontFile }) {
  return (
    <Section title="6 · Fonts" defaultOpen={false} badge={customFonts.length || null}>
      <p className="hint">Use any font installed on this computer, or load a font file (.ttf, .otf, .woff, .woff2). Fonts are not uploaded anywhere.</p>
      <FileButton accept=".ttf,.otf,.woff,.woff2" onFile={onFontFile} className="btn">Load font file</FileButton>
      {customFonts.length > 0 && (
        <ul className="font-list">
          {customFonts.map((f) => (
            <li key={f} style={{ fontFamily: f }}>{f}</li>
          ))}
        </ul>
      )}
    </Section>
  );
}

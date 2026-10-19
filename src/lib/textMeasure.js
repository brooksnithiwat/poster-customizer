// Text measurement shared by layout code (objectives list). Uses an offscreen 2D context
// with the same font string Konva builds, so widths match what is drawn.

const GENERIC_FAMILIES = new Set(['serif', 'sans-serif', 'monospace', 'cursive', 'fantasy', 'system-ui']);

let measureCtx = null;

function getContext() {
  if (!measureCtx) {
    measureCtx = document.createElement('canvas').getContext('2d');
  }
  return measureCtx;
}

export function normalizeFontFamily(family) {
  return String(family || 'Arial')
    .split(',')
    .map((part) => {
      const name = part.trim();
      if (!name || GENERIC_FAMILIES.has(name) || /^["'].*["']$/.test(name)) return name;
      return `"${name.replace(/"/g, '')}"`;
    })
    .filter(Boolean)
    .join(', ');
}

export function fontStyleOf({ bold, italic }) {
  return [italic ? 'italic' : '', bold ? 'bold' : ''].filter(Boolean).join(' ') || 'normal';
}

export function measureTextWidth(text, { fontSize, fontFamily, bold, italic, letterSpacing = 0 }) {
  const ctx = getContext();
  ctx.font = `${fontStyleOf({ bold, italic })} ${fontSize}px ${normalizeFontFamily(fontFamily)}`;
  const value = String(text ?? '');
  return ctx.measureText(value).width + Math.max(0, value.length) * letterSpacing;
}

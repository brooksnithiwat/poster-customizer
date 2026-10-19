// Layout math for the objectives block. Returns plain numbers (poster px, element-local)
// that ObjectivesNode turns into Konva shapes.

import { measureTextWidth } from './textMeasure.js';

export function getRowMetrics(el, opt) {
  const f = el.fontSize;
  const m = el.markerSize;
  const textWidth = el.showLabels
    ? measureTextWidth(opt.label, { fontSize: f, fontFamily: el.fontFamily, bold: el.bold, italic: el.italic })
    : 0;

  if (el.markerStyle === 'ring') {
    if (el.showLabels) {
      const padX = f * 0.5;
      const padY = f * 0.32;
      const width = textWidth + padX * 2;
      const height = f + padY * 2;
      return { width, height, textX: padX, textY: padY, textWidth, ring: { cx: width / 2, cy: height / 2, rx: width / 2, ry: height / 2 } };
    }
    const width = m * el.markerAspect;
    const height = m;
    return { width, height, textX: 0, textY: 0, textWidth: 0, ring: { cx: width / 2, cy: height / 2, rx: width / 2, ry: height / 2 } };
  }

  const height = Math.max(m, f);
  const innerGap = el.showLabels ? f * 0.4 : 0;
  return {
    width: m + innerGap + textWidth,
    height,
    marker: { x: 0, y: (height - m) / 2, size: m },
    textX: m + innerGap,
    textY: (height - f) / 2,
    textWidth,
  };
}

export function visibleOptions(el) {
  return el.options.filter((o) => o.selected || el.showUnselected);
}

/** Positions rows for the single-block ('list') mode. */
export function layoutObjectiveList(el) {
  const options = visibleOptions(el);
  const metrics = options.map((opt) => getRowMetrics(el, opt));
  const gap = el.gap;
  const rows = [];

  if (el.layout === 'horizontal') {
    let x = 0;
    const rowH = Math.max(0, ...metrics.map((m) => m.height));
    options.forEach((opt, i) => {
      rows.push({ opt, metrics: metrics[i], x, y: (rowH - metrics[i].height) / 2 });
      x += metrics[i].width + gap;
    });
    return { rows, width: Math.max(0, x - gap), height: rowH };
  }

  if (el.layout === 'grid') {
    const cols = Math.max(1, Math.round(el.columns) || 1);
    const colW = Math.max(0, ...metrics.map((m) => m.width));
    const rowH = Math.max(0, ...metrics.map((m) => m.height));
    options.forEach((opt, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      rows.push({ opt, metrics: metrics[i], x: col * (colW + gap * 2), y: row * (rowH + gap) });
    });
    const usedCols = Math.min(cols, options.length);
    const usedRows = Math.ceil(options.length / cols);
    return {
      rows,
      width: Math.max(0, usedCols * colW + (usedCols - 1) * gap * 2),
      height: Math.max(0, usedRows * rowH + (usedRows - 1) * gap),
    };
  }

  let y = 0;
  options.forEach((opt, i) => {
    rows.push({ opt, metrics: metrics[i], x: 0, y });
    y += metrics[i].height + gap;
  });
  return { rows, width: Math.max(0, ...metrics.map((m) => m.width)), height: Math.max(0, y - gap) };
}

/** Initial individual positions when switching to 'markers' mode: start where the list showed them. */
export function seedMarkerPositions(el) {
  const { rows } = layoutObjectiveList({ ...el, showUnselected: true });
  const byId = new Map(rows.map((r) => [r.opt.id, r]));
  return el.options.map((o) => {
    if (o.mx != null && o.my != null) return o;
    const r = byId.get(o.id);
    return { ...o, mx: el.x + (r ? r.x : 0), my: el.y + (r ? r.y : 0) };
  });
}

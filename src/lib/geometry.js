// Pure geometry helpers: image fitting/cropping and keeping nodes inside the poster.

export const NO_CROP = { left: 0, right: 0, top: 0, bottom: 0 };

/** Source rectangle of an image after the user's percentage crop. */
export function getCroppedSource(img, crop = NO_CROP) {
  const iw = img.naturalWidth || img.width || 1;
  const ih = img.naturalHeight || img.height || 1;
  const c = { ...NO_CROP, ...crop };
  return {
    x: iw * c.left,
    y: ih * c.top,
    width: Math.max(1, iw * (1 - c.left - c.right)),
    height: Math.max(1, ih * (1 - c.top - c.bottom)),
  };
}

/**
 * Cover-fit view of a source rect: visible source size (vw x vh), how many source px per frame px
 * (`scale` is the inverse) and the half-range the crop can move on each axis (`rangeX`/`rangeY`).
 */
export function getCoverView(el, src) {
  const w = Math.max(1, el.width);
  const h = Math.max(1, el.height);
  const scale = Math.max(w / src.width, h / src.height) * Math.max(1, el.zoom || 1);
  const vw = w / scale;
  const vh = h / scale;
  return { scale, vw, vh, rangeX: (src.width - vw) / 2, rangeY: (src.height - vh) / 2 };
}

/**
 * Where an image is drawn inside its frame (element width x height), in frame-local coords.
 * fit: 'stretch' fills the frame, 'contain' fits inside it, 'cover' fills it and crops the rest.
 */
export function getImageLayout(el, img) {
  const src = getCroppedSource(img, el.crop);
  const w = Math.max(1, el.width);
  const h = Math.max(1, el.height);

  if (el.fit === 'contain') {
    const s = Math.min(w / src.width, h / src.height);
    const dw = src.width * s;
    const dh = src.height * s;
    return { crop: src, x: (w - dw) / 2, y: (h - dh) / 2, width: dw, height: dh };
  }

  if (el.fit === 'cover') {
    const { vw, vh, rangeX, rangeY } = getCoverView(el, src);
    const px = clamp(el.panX || 0, -1, 1);
    const py = clamp(el.panY || 0, -1, 1);
    return {
      crop: { x: src.x + rangeX * (1 + px), y: src.y + rangeY * (1 + py), width: vw, height: vh },
      x: 0,
      y: 0,
      width: w,
      height: h,
    };
  }

  return { crop: src, x: 0, y: 0, width: w, height: h };
}

/**
 * Moves a Konva node so its bounding box stays within [0, width] x [0, height] of its parent.
 * Nodes larger than the poster are kept covering it instead.
 */
export function clampNodeToBounds(node, width, height) {
  const parent = node.getParent();
  if (!parent) return;
  const r = node.getClientRect({ relativeTo: parent, skipShadow: true });
  const dx = clampDelta(r.x, r.width, width);
  const dy = clampDelta(r.y, r.height, height);
  if (dx || dy) node.position({ x: node.x() + dx, y: node.y() + dy });
}

function clampDelta(start, size, limit) {
  if (size >= limit) {
    if (start > 0) return -start;
    if (start + size < limit) return limit - (start + size);
    return 0;
  }
  if (start < 0) return -start;
  if (start + size > limit) return limit - (start + size);
  return 0;
}

export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

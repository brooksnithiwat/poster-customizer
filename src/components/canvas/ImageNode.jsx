import { useRef } from 'react';
import { Group, Image as KImage, Rect, Text } from 'react-konva';
import { getCoverView, getCroppedSource, getImageLayout } from '../../lib/geometry.js';

const clamp1 = (v) => Math.max(-1, Math.min(1, v));

/** Extra scale so a photo rotated by `deg` inside its w x h frame still covers the whole frame. */
function rotationCover(w, h, deg) {
  const a = (deg * Math.PI) / 180;
  const c = Math.abs(Math.cos(a));
  const s = Math.abs(Math.sin(a));
  return Math.max((w * c + h * s) / w, (w * s + h * c) / h);
}

/** Rounded-rect clip so the photo keeps the template box's corners. */
function roundedClip(width, height, radius) {
  const r = Math.min(radius || 0, width / 2, height / 2);
  return (ctx) => {
    ctx.beginPath();
    ctx.moveTo(r, 0);
    ctx.arcTo(width, 0, width, height, r);
    ctx.arcTo(width, height, 0, height, r);
    ctx.arcTo(0, height, 0, 0, r);
    ctx.arcTo(0, 0, width, 0, r);
    ctx.closePath();
  };
}

/**
 * The user's photo inside the template's fixed frame. The frame never moves: dragging pans the
 * photo inside it (zoom / pan are also available in the sidebar).
 */
export default function ImageNode({ el, asset, onChange }) {
  const img = asset?.img || null;
  const layout = img ? getImageLayout(el, img) : null;
  const drag = useRef(null);
  const rotate = el.rotate || 0;
  const cover = rotationCover(el.width, el.height, rotate);

  const handleDragStart = (e) => {
    const p = e.target.getStage().getPointerPosition();
    drag.current = { px: p.x, py: p.y, panX: el.panX || 0, panY: el.panY || 0 };
  };

  const handleDragMove = (e) => {
    const node = e.target;
    const start = drag.current;
    if (!start || !img) return;
    const p = node.getStage().getPointerPosition();
    const view = getCoverView(el, getCroppedSource(img, el.crop));
    // Pointer movement in frame px, then into the (rotated, enlarged) photo's own axes, then source px.
    const abs = node.getAbsoluteScale().x;
    const fx = (p.x - start.px) / abs;
    const fy = (p.y - start.py) / abs;
    const a = (-rotate * Math.PI) / 180;
    const ix = (fx * Math.cos(a) - fy * Math.sin(a)) / cover;
    const iy = (fx * Math.sin(a) + fy * Math.cos(a)) / cover;
    const dx = (ix / view.scale) * (el.flipX ? -1 : 1);
    const dy = iy / view.scale;
    // Dragging right shows more of the left side of the photo, hence the minus.
    onChange(
      el.id,
      {
        panX: view.rangeX > 0 ? clamp1(start.panX - dx / view.rangeX) : 0,
        panY: view.rangeY > 0 ? clamp1(start.panY - dy / view.rangeY) : 0,
      },
      `${el.id}:pan`,
    );
  };

  return (
    <Group
      x={el.x}
      y={el.y}
      opacity={el.opacity}
      visible={!el.hidden}
      clipFunc={roundedClip(el.width, el.height, el.radius)}
      draggable={Boolean(layout)}
      dragBoundFunc={function lockPosition() {
        return this.absolutePosition();
      }}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
    >
      <Rect width={el.width} height={el.height} fill="transparent" />
      {layout ? (
        <Group x={el.width / 2} y={el.height / 2} rotation={rotate} scaleX={cover * (el.flipX ? -1 : 1)} scaleY={cover}>
          <KImage
            image={img}
            crop={layout.crop}
            x={layout.x - el.width / 2}
            y={layout.y - el.height / 2}
            width={layout.width}
            height={layout.height}
          />
        </Group>
      ) : (
        <Group name="ui-only">
          <Rect width={el.width} height={el.height} stroke="#ff5d73" strokeWidth={2} dash={[8, 6]} fill="rgba(255,93,115,0.12)" />
          <Text width={el.width} height={el.height} align="center" verticalAlign="middle" text="Image missing" fill="#ff5d73" fontSize={Math.max(12, el.width / 12)} />
        </Group>
      )}
    </Group>
  );
}

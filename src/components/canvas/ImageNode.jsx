import { useRef } from 'react';
import { Group, Image as KImage, Rect, Text } from 'react-konva';
import { getCoverView, getCroppedSource, getImageLayout } from '../../lib/geometry.js';

const clamp1 = (v) => Math.max(-1, Math.min(1, v));

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
    const k = node.getAbsoluteScale().x * view.scale; // screen px per source px
    const dx = ((p.x - start.px) / k) * (el.flipX ? -1 : 1);
    const dy = (p.y - start.py) / k;
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
        <KImage
          image={img}
          crop={layout.crop}
          x={el.flipX ? layout.x + layout.width : layout.x}
          y={layout.y}
          width={layout.width}
          height={layout.height}
          scaleX={el.flipX ? -1 : 1}
        />
      ) : (
        <Group name="ui-only">
          <Rect width={el.width} height={el.height} stroke="#ff5d73" strokeWidth={2} dash={[8, 6]} fill="rgba(255,93,115,0.12)" />
          <Text width={el.width} height={el.height} align="center" verticalAlign="middle" text="Image missing" fill="#ff5d73" fontSize={Math.max(12, el.width / 12)} />
        </Group>
      )}
    </Group>
  );
}

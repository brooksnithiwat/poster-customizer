import { Circle, Ellipse, Group, Line, Rect, Text } from 'react-konva';
import { getRowMetrics, layoutObjectiveList, visibleOptions } from '../../lib/objectivesLayout.js';
import { fontStyleOf } from '../../lib/textMeasure.js';

function Marker({ el, selected, metrics }) {
  const color = el.markerColor;
  if (el.markerStyle === 'ring') {
    if (!selected || !metrics.ring) return null;
    const { cx, cy, rx, ry } = metrics.ring;
    const sw = Math.max(1.5, (el.showLabels ? el.fontSize : el.markerSize) * 0.09);
    return <Ellipse x={cx} y={cy} radiusX={Math.max(1, rx - sw / 2)} radiusY={Math.max(1, ry - sw / 2)} stroke={color} strokeWidth={sw} />;
  }

  const { x, y, size: m } = metrics.marker;
  const sw = Math.max(1.5, m * 0.1);
  const check = [0.2, 0.52, 0.42, 0.74, 0.82, 0.26].map((v, i) => (i % 2 === 0 ? x + v * m : y + v * m));
  const checkLine = <Line points={check} stroke={color} strokeWidth={sw * 1.5} lineCap="round" lineJoin="round" />;

  if (el.markerStyle === 'checkbox') {
    return (
      <>
        <Rect x={x + sw / 2} y={y + sw / 2} width={m - sw} height={m - sw} cornerRadius={m * 0.15} stroke={color} strokeWidth={sw} />
        {selected && checkLine}
      </>
    );
  }
  if (el.markerStyle === 'circle') {
    return (
      <>
        <Circle x={x + m / 2} y={y + m / 2} radius={m / 2 - sw / 2} stroke={color} strokeWidth={sw} />
        {selected && <Circle x={x + m / 2} y={y + m / 2} radius={m * 0.26} fill={color} />}
      </>
    );
  }
  if (el.markerStyle === 'cross') {
    if (!selected) return null;
    const p = m * 0.2;
    return (
      <>
        <Line points={[x + p, y + p, x + m - p, y + m - p]} stroke={color} strokeWidth={sw * 1.5} lineCap="round" />
        <Line points={[x + m - p, y + p, x + p, y + m - p]} stroke={color} strokeWidth={sw * 1.5} lineCap="round" />
      </>
    );
  }
  // 'check'
  return selected ? checkLine : null;
}

function ObjectiveRow({ el, opt, metrics }) {
  return (
    <>
      <Rect width={metrics.width} height={metrics.height} fill="transparent" />
      <Marker el={el} selected={opt.selected} metrics={metrics} />
      {el.showLabels && (
        <Text
          x={metrics.textX}
          y={metrics.textY}
          text={opt.label}
          fontSize={el.fontSize}
          fontFamily={el.fontFamily}
          fontStyle={fontStyleOf(el)}
          lineHeight={1}
          fill={el.textColor}
          stroke={el.textStrokeWidth > 0 ? el.textStroke : undefined}
          strokeWidth={el.textStrokeWidth}
          fillAfterStrokeEnabled
          lineJoin="round"
        />
      )}
    </>
  );
}

export default function ObjectivesNode({ el, onSelect, onChange, onOptionChange, registerNode, onDragMove }) {
  if (el.hidden) return null;

  if (el.mode === 'markers') {
    return visibleOptions(el).map((opt) => {
      const key = `${el.id}::${opt.id}`;
      return (
        <Group
          key={opt.id}
          ref={(node) => registerNode(key, node)}
          x={opt.mx ?? el.x}
          y={opt.my ?? el.y}
          opacity={el.opacity}
          draggable
          onMouseDown={() => onSelect(key)}
          onTouchStart={() => onSelect(key)}
          onDragMove={onDragMove}
          onDragEnd={(e) => onOptionChange(el.id, opt.id, { mx: e.target.x(), my: e.target.y() })}
        >
          <ObjectiveRow el={el} opt={opt} metrics={getRowMetrics(el, opt)} />
        </Group>
      );
    });
  }

  const { rows, width, height } = layoutObjectiveList(el);
  if (!rows.length) return null;

  const handleTransformEnd = (e) => {
    const node = e.target;
    const s = Math.abs(node.scaleY());
    node.scaleX(1);
    node.scaleY(1);
    onChange(el.id, {
      x: node.x(),
      y: node.y(),
      rotation: node.rotation(),
      fontSize: Math.max(4, el.fontSize * s),
      markerSize: Math.max(4, el.markerSize * s),
      gap: el.gap * s,
      textStrokeWidth: el.textStrokeWidth * s,
    });
  };

  return (
    <Group
      ref={(node) => registerNode(el.id, node)}
      x={el.x}
      y={el.y}
      rotation={el.rotation}
      opacity={el.opacity}
      draggable
      onMouseDown={() => onSelect(el.id)}
      onTouchStart={() => onSelect(el.id)}
      onDragMove={onDragMove}
      onDragEnd={(e) => onChange(el.id, { x: e.target.x(), y: e.target.y() })}
      onTransformEnd={handleTransformEnd}
    >
      <Rect width={width} height={height} fill="transparent" />
      {rows.map((row) => (
        <Group key={row.opt.id} x={row.x} y={row.y}>
          <ObjectiveRow el={el} opt={row.opt} metrics={row.metrics} />
        </Group>
      ))}
    </Group>
  );
}

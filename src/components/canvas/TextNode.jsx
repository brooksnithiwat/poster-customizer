import { Text } from 'react-konva';
import { fontStyleOf } from '../../lib/textMeasure.js';

const SIDE_ANCHORS = new Set(['middle-left', 'middle-right']);

export default function TextNode({ el, onSelect, onChange, registerNode, onDragMove, getActiveAnchor }) {
  const handleTransform = (e) => {
    // Side handles change the text box width instead of stretching the glyphs.
    const node = e.target;
    if (SIDE_ANCHORS.has(getActiveAnchor())) {
      node.width(Math.max(20, node.width() * node.scaleX()));
      node.scaleX(1);
      node.scaleY(1);
    }
  };

  const handleTransformEnd = (e) => {
    const node = e.target;
    const sx = node.scaleX();
    const sy = node.scaleY();
    node.scaleX(1);
    node.scaleY(1);
    const s = Math.abs(sy);
    onChange(el.id, {
      x: node.x(),
      y: node.y(),
      rotation: node.rotation(),
      width: Math.max(20, node.width() * Math.abs(sx)),
      fontSize: Math.max(4, el.fontSize * s),
      strokeWidth: el.strokeWidth * s,
      shadowBlur: el.shadowBlur * s,
    });
  };

  return (
    <Text
      ref={(node) => registerNode(el.id, node)}
      x={el.x}
      y={el.y}
      width={el.width}
      rotation={el.rotation}
      opacity={el.opacity}
      visible={!el.hidden}
      text={el.text}
      fontSize={el.fontSize}
      fontFamily={el.fontFamily}
      fontStyle={fontStyleOf(el)}
      fill={el.fill}
      stroke={el.strokeWidth > 0 ? el.stroke : undefined}
      strokeWidth={el.strokeWidth}
      fillAfterStrokeEnabled
      lineJoin="round"
      align={el.align}
      lineHeight={el.lineHeight}
      letterSpacing={el.letterSpacing}
      wrap="word"
      shadowEnabled={el.shadowEnabled}
      shadowColor={el.shadowColor}
      shadowBlur={el.shadowBlur}
      shadowOffsetX={el.shadowBlur * 0.25}
      shadowOffsetY={el.shadowBlur * 0.25}
      shadowOpacity={0.8}
      draggable
      onMouseDown={() => onSelect(el.id)}
      onTouchStart={() => onSelect(el.id)}
      onDragMove={onDragMove}
      onDragEnd={(e) => onChange(el.id, { x: e.target.x(), y: e.target.y() })}
      onTransform={handleTransform}
      onTransformEnd={handleTransformEnd}
    />
  );
}

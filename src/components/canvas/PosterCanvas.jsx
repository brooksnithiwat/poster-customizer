import { forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';
import { Group, Image as KImage, Layer, Stage, Transformer } from 'react-konva';
import TextNode from './TextNode.jsx';
import ImageNode from './ImageNode.jsx';
import ObjectivesNode from './ObjectivesNode.jsx';
import ZoomControls from './ZoomControls.jsx';
import { clamp, clampNodeToBounds } from '../../lib/geometry.js';
import { exportPosterPNG } from '../../lib/exportPoster.js';
import { parseSelectionKey } from '../../state/editorModel.js';

const PADDING = 32;
const MIN_ZOOM = 0.05;
const MAX_ZOOM = 8;

function transformerConfig(el, optionId) {
  if (!el || optionId) {
    return { resizeEnabled: false, rotateEnabled: false, keepRatio: true, enabledAnchors: [] };
  }
  if (el.type === 'text') {
    return {
      resizeEnabled: true,
      rotateEnabled: true,
      keepRatio: true,
      enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'middle-left', 'middle-right'],
    };
  }
  if (el.type === 'objectives') {
    return { resizeEnabled: true, rotateEnabled: true, keepRatio: true, enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right'] };
  }
  return {
    resizeEnabled: true,
    rotateEnabled: true,
    keepRatio: el.lockRatio,
    enabledAnchors: ['top-left', 'top-center', 'top-right', 'middle-right', 'middle-left', 'bottom-left', 'bottom-center', 'bottom-right'],
  };
}

const PosterCanvas = forwardRef(function PosterCanvas(
  { poster, elements, getAsset, selectedKey, onSelect, onChange, onOptionChange, keepInside, onToggleKeepInside, fontVersion },
  ref,
) {
  const workspaceRef = useRef(null);
  const contentRef = useRef(null);
  const trRef = useRef(null);
  const nodesRef = useRef(new Map());
  const [box, setBox] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState('fit'); // 'fit' or an absolute scale

  useLayoutEffect(() => {
    const node = workspaceRef.current;
    if (!node) return undefined;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setBox({ width, height });
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const fitScale = box.width
    ? clamp(Math.min((box.width - PADDING * 2) / poster.width, (box.height - PADDING * 2) / poster.height), MIN_ZOOM, 2)
    : 0.2;
  const scale = zoom === 'fit' ? fitScale : zoom;

  const setZoomClamped = useCallback((value) => setZoom(clamp(value, MIN_ZOOM, MAX_ZOOM)), []);

  // Ctrl/⌘ + wheel zoom (native listener so preventDefault works).
  useEffect(() => {
    const node = workspaceRef.current;
    if (!node) return undefined;
    const onWheel = (e) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      setZoom((z) => clamp((z === 'fit' ? fitScale : z) * (e.deltaY < 0 ? 1.1 : 1 / 1.1), MIN_ZOOM, MAX_ZOOM));
    };
    node.addEventListener('wheel', onWheel, { passive: false });
    return () => node.removeEventListener('wheel', onWheel);
  }, [fitScale]);

  const registerNode = useCallback((key, node) => {
    if (node) nodesRef.current.set(key, node);
    else nodesRef.current.delete(key);
  }, []);

  const { elementId, optionId } = parseSelectionKey(selectedKey);
  const selectedEl = elements.find((el) => el.id === elementId) || null;
  const trConfig = transformerConfig(selectedEl, optionId);

  useEffect(() => {
    const tr = trRef.current;
    if (!tr) return;
    const node = selectedKey ? nodesRef.current.get(selectedKey) : null;
    tr.nodes(node && node.getStage() && node.isVisible() ? [node] : []);
    tr.getLayer()?.batchDraw();
  });

  useEffect(() => {
    // Custom fonts finished loading: redraw so text uses them.
    contentRef.current?.getLayer()?.batchDraw();
  }, [fontVersion]);

  useImperativeHandle(ref, () => ({
    exportPNG: () => exportPosterPNG(contentRef.current, poster.width, poster.height),
  }), [poster.width, poster.height]);

  const handleDragMove = useCallback(
    (e) => {
      if (keepInside) clampNodeToBounds(e.target, poster.width, poster.height);
    },
    [keepInside, poster.width, poster.height],
  );

  const handleStagePointerDown = (e) => {
    const target = e.target;
    if (target === target.getStage() || target.name() === 'poster-bg') onSelect(null);
  };

  const commonProps = { onSelect, onChange, registerNode, onDragMove: handleDragMove };

  return (
    <div className="canvas-area">
      <div className="workspace" ref={workspaceRef}>
        <div className="stage-scroller">
          <div className="stage-frame" style={{ width: poster.width * scale, height: poster.height * scale }}>
            <Stage
              width={poster.width * scale}
              height={poster.height * scale}
              onMouseDown={handleStagePointerDown}
              onTouchStart={handleStagePointerDown}
            >
              <Layer>
                <Group
                  ref={contentRef}
                  scaleX={scale}
                  scaleY={scale}
                  clipX={0}
                  clipY={0}
                  clipWidth={poster.width}
                  clipHeight={poster.height}
                >
                  <KImage name="poster-bg" image={poster.img} x={0} y={0} width={poster.width} height={poster.height} />
                  {elements.map((el) => {
                    if (el.type === 'text') return <TextNode key={el.id} el={el} {...commonProps} getActiveAnchor={() => trRef.current?.getActiveAnchor()} />;
                    if (el.type === 'image') return <ImageNode key={el.id} el={el} asset={getAsset(el.assetId)} {...commonProps} />;
                    if (el.type === 'objectives') return <ObjectivesNode key={el.id} el={el} {...commonProps} onOptionChange={onOptionChange} />;
                    return null;
                  })}
                </Group>
              </Layer>
              <Layer>
                <Transformer
                  ref={trRef}
                  {...trConfig}
                  rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
                  rotationSnapTolerance={4}
                  anchorSize={11}
                  anchorCornerRadius={3}
                  anchorStroke="#5b4cf0"
                  anchorFill="#ffffff"
                  borderStroke="#5b4cf0"
                  borderStrokeWidth={1.5}
                  padding={trConfig.resizeEnabled ? 0 : 4}
                  ignoreStroke
                  flipEnabled={false}
                  boundBoxFunc={(oldBox, newBox) => (Math.abs(newBox.width) < 8 || Math.abs(newBox.height) < 8 ? oldBox : newBox)}
                />
              </Layer>
            </Stage>
          </div>
        </div>
      </div>
      <ZoomControls
        scale={scale}
        isFit={zoom === 'fit'}
        onZoomIn={() => setZoomClamped(scale * 1.25)}
        onZoomOut={() => setZoomClamped(scale / 1.25)}
        onFit={() => setZoom('fit')}
        onActual={() => setZoom(1)}
        keepInside={keepInside}
        onToggleKeepInside={onToggleKeepInside}
        posterSize={`${poster.width} × ${poster.height}px`}
      />
    </div>
  );
});

export default PosterCanvas;

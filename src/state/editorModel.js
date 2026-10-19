// Editor data model. All coordinates and sizes are in ORIGINAL poster pixels, never preview pixels.
// Defaults are derived from the uploaded poster's dimensions — nothing is tied to one template.

import { NO_CROP } from '../lib/geometry.js';

let idCounter = 0;
export function createId(prefix = 'el') {
  idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${idCounter.toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

const unit = (poster) => Math.min(poster.width, poster.height);

/**
 * The one and only poster template (public/template.png). Every coordinate below is in its pixels.
 * - nameField / characterField: the two empty pill-shaped inputs printed on the poster
 * - objectives: the six empty circles, in print order (row by row)
 * - photoSlot: the white rounded box where the user's photo goes
 */
export const TEMPLATE = {
  src: 'template.png',
  name: 'siam-halloween-template.png',
  width: 1440,
  height: 1207,
  nameField: { x: 64, y: 581, width: 474, height: 79 },
  characterField: { x: 64, y: 763, width: 474, height: 79 },
  objectives: {
    markerSize: 38,
    centers: [
      [85, 967],
      [259, 967],
      [424, 967],
      [85, 1027],
      [259, 1027],
      [424, 1027],
    ],
    labels: ['มาคอส', 'มาถ่าย', 'มาเต้น', 'มากิน', 'มาเล่น', 'มาเที่ยว'],
  },
  photoSlot: { x: 586, y: 262, width: 800, height: 800, radius: 52 },
};

export function createTextElement(poster, overrides = {}) {
  const fontSize = Math.max(12, Math.round(unit(poster) * 0.06));
  const width = Math.round(poster.width * 0.7);
  return {
    id: createId('text'),
    type: 'text',
    role: null, // 'name' | 'character' | null
    text: 'Your text',
    x: Math.round((poster.width - width) / 2),
    y: Math.round(poster.height * 0.45),
    width,
    rotation: 0,
    opacity: 1,
    hidden: false,
    fontSize,
    fontFamily: 'Arial',
    bold: true,
    italic: false,
    fill: '#ffffff',
    stroke: '#000000',
    strokeWidth: Math.max(1, Math.round(fontSize * 0.08)),
    align: 'center',
    lineHeight: 1.15,
    letterSpacing: 0,
    shadowEnabled: false,
    shadowColor: '#000000',
    shadowBlur: Math.round(fontSize * 0.25),
    ...overrides,
  };
}

export function createRoleText(poster, role) {
  const field = role === 'name' ? TEMPLATE.nameField : TEMPLATE.characterField;
  const fontSize = 44;
  const base = createTextElement(poster, { role, text: '' });
  const lineHeight = base.lineHeight;
  return {
    ...base,
    x: field.x,
    y: Math.round(field.y + (field.height - fontSize * lineHeight) / 2),
    width: field.width,
    fontFamily: 'Leelawadee UI',
    fontSize,
    fill: '#ffffff',
    stroke: '#1a1a40',
    strokeWidth: 3,
    shadowBlur: 0,
  };
}

export function createObjectivesElement() {
  const { markerSize, centers, labels } = TEMPLATE.objectives;
  const fontSize = 36;
  return {
    id: createId('obj'),
    type: 'objectives',
    x: 0,
    y: 0,
    rotation: 0,
    opacity: 1,
    hidden: false,
    mode: 'markers', // each option sits on its own printed circle
    layout: 'vertical',
    columns: 2,
    markerStyle: 'check', // draws only the tick inside the printed circle
    showUnselected: false,
    showLabels: false,
    fontSize,
    fontFamily: 'Leelawadee UI',
    bold: true,
    italic: false,
    textColor: '#ffffff',
    textStroke: '#000000',
    textStrokeWidth: 0,
    markerColor: '#ffd166',
    markerSize,
    markerAspect: 2.4,
    gap: 18,
    options: labels.map((label, i) => ({
      id: createId('opt'),
      label,
      selected: false,
      mx: centers[i][0] - markerSize / 2,
      my: centers[i][1] - markerSize / 2,
    })),
  };
}

/** The user's photo, fitted to the template's white box. `zoom` >= 1; panX/panY in -1..1 move the crop. */
export function createPhotoElement({ assetId, width, height, name }) {
  const { x, y, width: w, height: h, radius } = TEMPLATE.photoSlot;
  return {
    id: createId('img'),
    type: 'image',
    name: name || 'Photo',
    assetId,
    naturalWidth: width,
    naturalHeight: height,
    x,
    y,
    width: w,
    height: h,
    radius,
    rotation: 0,
    opacity: 1,
    hidden: false,
    fit: 'cover',
    zoom: 1,
    panX: 0,
    panY: 0,
    rotate: 0, // degrees, turns the photo inside the fixed frame
    flipX: false,
    crop: { ...NO_CROP },
  };
}

export function createInitialElements(poster) {
  return [
    createObjectivesElement(),
    createRoleText(poster, 'name'),
    createRoleText(poster, 'character'),
  ];
}

/** Moves an element in the stacking order. Later in the array = drawn on top. */
export function moveElement(elements, id, direction) {
  const index = elements.findIndex((el) => el.id === id);
  if (index < 0) return elements;
  const next = elements.slice();
  const [item] = next.splice(index, 1);
  let target = index;
  if (direction === 'up') target = Math.min(next.length, index + 1);
  if (direction === 'down') target = Math.max(0, index - 1);
  if (direction === 'top') target = next.length;
  if (direction === 'bottom') target = 0;
  next.splice(target, 0, item);
  return next;
}

export function elementLabel(el) {
  if (el.type === 'text') {
    if (el.role === 'name') return `Name: ${el.text || '(empty)'}`;
    if (el.role === 'character') return `Character: ${el.text || '(empty)'}`;
    return el.text?.trim() ? el.text.trim().slice(0, 28) : '(empty text)';
  }
  if (el.type === 'objectives') return 'Objectives';
  if (el.type === 'image') return el.name || 'Photo';
  return el.type;
}

/** Selection keys: an element id, or `${elementId}::${optionId}` for an individually placed objective marker. */
export function parseSelectionKey(key) {
  if (!key) return { elementId: null, optionId: null };
  const [elementId, optionId = null] = key.split('::');
  return { elementId, optionId };
}

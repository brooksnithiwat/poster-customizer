// Local font support: system fonts plus user-supplied font files (loaded with FontFace).

export const SYSTEM_FONTS = [
  'Arial',
  'Helvetica',
  'Verdana',
  'Tahoma',
  'Trebuchet MS',
  'Segoe UI',
  'Leelawadee UI',
  'Georgia',
  'Times New Roman',
  'Palatino Linotype',
  'Courier New',
  'Impact',
  'Comic Sans MS',
  'Brush Script MT',
];

const FONT_EXT = /\.(ttf|otf|woff2?)$/i;

export async function loadFontFile(file) {
  if (!file || !FONT_EXT.test(file.name)) {
    throw new Error('Please choose a .ttf, .otf, .woff or .woff2 font file.');
  }
  if (typeof FontFace === 'undefined') {
    throw new Error('This browser does not support loading custom fonts.');
  }
  const family = file.name.replace(FONT_EXT, '').replace(/[^\w\s-]/g, ' ').trim() || 'Custom Font';
  const data = await file.arrayBuffer();
  const face = new FontFace(family, data);
  try {
    await face.load();
  } catch {
    throw new Error(`"${file.name}" could not be read as a font.`);
  }
  document.fonts.add(face);
  return family;
}

// Local image loading helpers. Files never leave the browser: they are read via
// object URLs, which the caller is responsible for revoking (see useAssets / App).

export const PHOTO_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

const EXTENSION_TYPES = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
};

const MAX_FILE_BYTES = 60 * 1024 * 1024; // 60 MB

/** Some platforms report an empty MIME type; fall back to the file extension. */
export function getFileType(file) {
  if (file.type) return file.type;
  const ext = file.name?.split('.').pop()?.toLowerCase();
  return EXTENSION_TYPES[ext] || '';
}

function describeTypes(types) {
  return types.map((t) => t.replace('image/', '').toUpperCase().replace('JPEG', 'JPG')).join(', ');
}

/**
 * Load an image file into an HTMLImageElement.
 * Resolves to { img, url, width, height, name }. The object URL stays valid until
 * the caller revokes it, so the image can be re-decoded by the browser if needed.
 */
export function loadImageFile(file, allowedTypes) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No file was selected.'));
      return;
    }
    const type = getFileType(file);
    if (!allowedTypes.includes(type)) {
      reject(new Error(`"${file.name}" is not supported. Please choose a ${describeTypes(allowedTypes)} image.`));
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      reject(new Error(`"${file.name}" is too large (max ${MAX_FILE_BYTES / 1024 / 1024} MB).`));
      return;
    }

    const url = URL.createObjectURL(file);
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      if (!img.naturalWidth || !img.naturalHeight) {
        URL.revokeObjectURL(url);
        reject(new Error(`"${file.name}" could not be decoded as an image.`));
        return;
      }
      resolve({ img, url, width: img.naturalWidth, height: img.naturalHeight, name: file.name });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`"${file.name}" could not be loaded. The file may be damaged.`));
    };
    img.src = url;
  });
}

/** Loads the bundled poster template. Resolves to { img, url, width, height, name }. */
export function loadTemplateImage({ src, name }) {
  return new Promise((resolve, reject) => {
    const url = `${import.meta.env.BASE_URL}${src}`;
    const img = new Image();
    img.onload = () => resolve({ img, url, width: img.naturalWidth, height: img.naturalHeight, name });
    img.onerror = () => reject(new Error('Could not load the poster template.'));
    img.src = url;
  });
}

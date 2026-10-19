// Export logic: renders only the content group (poster + layers) at the poster's
// original resolution. The transformer lives in a separate layer, so selection
// borders and handles never appear in the output.

/**
 * @param {import('konva').default.Group} contentGroup  group holding the poster and all elements
 * @param {number} width   original poster width in px
 * @param {number} height  original poster height in px
 * @returns {Promise<Blob>}
 */
export function exportPosterPNG(contentGroup, width, height) {
  return new Promise((resolve, reject) => {
    if (!contentGroup) {
      reject(new Error('Nothing to export yet. Upload a poster first.'));
      return;
    }

    const stage = contentGroup.getStage();
    const prevScale = contentGroup.scale();
    const uiOnly = contentGroup.find('.ui-only').filter((n) => n.visible());

    let canvas;
    try {
      // Render at 1:1 in poster coordinates, regardless of the current zoom level.
      contentGroup.scale({ x: 1, y: 1 });
      uiOnly.forEach((n) => n.visible(false));
      canvas = contentGroup.toCanvas({ x: 0, y: 0, width, height, pixelRatio: 1 });
    } catch (err) {
      reject(new Error(`Export failed: ${err.message || err}`));
      return;
    } finally {
      contentGroup.scale(prevScale);
      uiOnly.forEach((n) => n.visible(true));
      stage?.batchDraw();
    }

    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('The browser could not create the PNG. The poster may be too large for this device.'));
        return;
      }
      resolve(blob);
    }, 'image/png');
  });
}

export function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Give the browser a moment to start the download before releasing the URL.
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function exportFileName(posterName) {
  const base = (posterName || 'poster').replace(/\.[^.]+$/, '').replace(/[^\w฀-๿-]+/g, '-');
  return `${base || 'poster'}-custom.png`;
}

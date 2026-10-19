import { useCallback, useEffect, useRef } from 'react';
import { createId } from './editorModel.js';

/**
 * Registry of uploaded character images ({ img, url }) referenced by id from elements.
 * Images stay alive while any undo/redo state still references them; unreferenced ones
 * have their object URLs revoked.
 */
export function useAssets() {
  const assetsRef = useRef(new Map());

  const addAsset = useCallback(({ img, url, width, height, name }) => {
    const id = createId('asset');
    assetsRef.current.set(id, { img, url, width, height, name });
    return id;
  }, []);

  const getAsset = useCallback((id) => assetsRef.current.get(id) || null, []);

  const pruneAssets = useCallback((referencedIds) => {
    for (const [id, asset] of assetsRef.current) {
      if (!referencedIds.has(id)) {
        URL.revokeObjectURL(asset.url);
        assetsRef.current.delete(id);
      }
    }
  }, []);

  useEffect(() => {
    const assets = assetsRef.current;
    return () => {
      for (const asset of assets.values()) URL.revokeObjectURL(asset.url);
      assets.clear();
    };
  }, []);

  return { addAsset, getAsset, pruneAssets };
}

export function collectAssetIds(history) {
  const ids = new Set();
  const visit = (elements) => elements.forEach((el) => el.assetId && ids.add(el.assetId));
  history.past.forEach(visit);
  visit(history.present);
  history.future.forEach(visit);
  return ids;
}

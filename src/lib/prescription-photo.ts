/**
 * Photo d'ordonnance (mode Pharmacie, docs/01-prd.md).
 * Web : sélecteur de fichier puis compression via canvas (max 720 px, JPEG).
 * Natif : caméra via expo-image-picker.
 */

import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export interface PrescriptionPhotoResult {
  ok: boolean;
  uri?: string;
  message?: string;
}

const MAX_DIMENSION = 720;
const JPEG_QUALITY = 0.7;

/** Compresse et convertit la photo en data URL persistable (web). */
function downscaleForWeb(uri: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const scale = Math.min(1, MAX_DIMENSION / Math.max(image.width, image.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const context = canvas.getContext('2d');
      if (!context) {
        resolve(uri);
        return;
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
    };
    image.onerror = () => reject(new Error('Image illisible.'));
    image.src = uri;
  });
}

export async function pickPrescriptionPhoto(): Promise<PrescriptionPhotoResult> {
  try {
    if (Platform.OS === 'web') {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'] });
      const asset = result.canceled ? null : result.assets?.[0] ?? null;
      if (!asset) return { ok: false };
      const dataUrl = await downscaleForWeb(asset.uri);
      if (asset.uri.startsWith('blob:')) URL.revokeObjectURL(asset.uri);
      return { ok: true, uri: dataUrl };
    }

    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      return { ok: false, message: 'Autorisez la caméra pour photographier l’ordonnance.' };
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.6 });
    const asset = result.canceled ? null : result.assets?.[0] ?? null;
    if (!asset) return { ok: false };
    return { ok: true, uri: asset.uri };
  } catch {
    return { ok: false, message: 'Impossible de charger la photo.' };
  }
}

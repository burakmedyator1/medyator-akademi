import * as ImagePicker from 'expo-image-picker';
import { UploadAsset } from '@/api/client';

/**
 * Galeriden görsel seçtirir ve backend upload uçları için RN asset
 * ({uri,name,type}) döndürür. İptal edilirse null.
 */
export async function pickImageAsset(): Promise<UploadAsset | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) throw new Error('Galeri izni gerekli');

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.8,
  });
  if (result.canceled || !result.assets?.length) return null;

  const asset = result.assets[0];
  const name = asset.fileName || asset.uri.split('/').pop() || `image_${Date.now()}.jpg`;
  const type = asset.mimeType || 'image/jpeg';
  return { uri: asset.uri, name, type };
}

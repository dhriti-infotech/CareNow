import { File, Paths } from 'expo-file-system';
import { fetch } from 'expo/fetch';
import * as ImageManipulator from 'expo-image-manipulator';

import { API_BASE_URL } from '../config/env';
import { AuthStorage } from '../services/auth-storage';

/**
 * Downloads an authenticated image to the device cache and normalizes it to
 * JPEG before rendering. This avoids relying on a native <Image> request to
 * carry the JWT and also makes HEIC/HEIF uploads display consistently on
 * Android and iOS.
 */
export async function downloadAuthenticatedImage(
  endpoint: string,
  cacheKey: string,
): Promise<string | null> {
  const token = await AuthStorage.getToken();
  if (!token) return null;

  const safeKey = cacheKey.replace(/[^a-zA-Z0-9_-]/g, '_');
  const sourceFile = new File(Paths.cache, `carenow-${safeKey}.jpg`);
  const url = `${API_BASE_URL}${endpoint}`;

  try {
    // Use expo/fetch + File.write instead of File.downloadFileAsync here.
    // On some Android/Expo Go combinations, authenticated image downloads
    // to a File destination can fail with java.io.FileNotFoundException.
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'image/jpeg,image/png,image/webp,image/heic,image/heif,image/*',
        'Cache-Control': 'no-cache',
      },
    });

    if (!response.ok) {
      throw new Error(`Profile picture request failed with HTTP ${response.status}`);
    }

    sourceFile.create({ overwrite: true, intermediates: true });
    sourceFile.write(await response.bytes());

    // Always normalize the downloaded image to JPEG. This is particularly
    // important when the original photo came from an iPhone as HEIC/HEIF.
    const normalized = await ImageManipulator.manipulateAsync(
      sourceFile.uri,
      [],
      {
        compress: 0.88,
        format: ImageManipulator.SaveFormat.JPEG,
      },
    );

    return normalized.uri;
  } catch (error) {
    console.warn('[CareNow Profile Picture] Failed to download/normalize image:', {
      endpoint,
      message: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

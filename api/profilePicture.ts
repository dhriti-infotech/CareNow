import apiClient from './client';
import { downloadAuthenticatedImage } from './authenticatedImage';

export type ProfilePictureOwner = 'USER' | 'PROFESSIONAL';

const endpointFor = (owner: ProfilePictureOwner) =>
  owner === 'USER' ? '/api/user/patient/profile-picture' : '/api/professional-auth/profile-picture';

export async function uploadProfilePicture(owner: ProfilePictureOwner, asset: {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
}) {
  const formData = new FormData();
  formData.append('file', {
    uri: asset.uri,
    name: asset.fileName || `profile-${Date.now()}.jpg`,
    type: asset.mimeType || 'image/jpeg',
  } as any);

  await apiClient.put(endpointFor(owner), formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 30000,
  });
}

/**
 * Returns a local file URI rather than an authenticated remote URL.
 * The image is downloaded with the existing JWT and normalized to JPEG so
 * Android and iOS render the same bytes.
 */
export async function getProfilePictureSource(owner: ProfilePictureOwner, version: number) {
  return downloadAuthenticatedImage(
    `${endpointFor(owner)}?v=${version}`,
    `profile-${owner}-${version}`,
  );
}

import apiClient from './client';
import { API_BASE_URL } from '../config/env';
import { AuthStorage } from '../services/auth-storage';

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

export async function getProfilePictureSource(owner: ProfilePictureOwner, version: number) {
  const token = await AuthStorage.getToken();
  if (!token) return null;

  return {
    uri: `${API_BASE_URL}${endpointFor(owner)}?v=${version}`,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
}

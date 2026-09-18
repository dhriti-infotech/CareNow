import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, StyleSheet, TouchableOpacity, View } from 'react-native';

import { getProfilePictureSource, uploadProfilePicture, type ProfilePictureOwner } from '../api/profilePicture';
import type { AuthUser } from '../types/auth';

const COLORS = {
  primary: '#0A9FB5',
  primaryDark: '#087F91',
  white: '#FFFFFF',
  border: '#CDE9ED',
  background: '#E7F8F6',
};

type Props = {
  owner: ProfilePictureOwner;
  user: AuthUser | null;
  size?: number;
  onUpdated?: () => void;
};

export default function ProfilePicturePicker({ owner, user, size = 104, onUpdated }: Props) {
  const [version, setVersion] = useState(0);
  const [source, setSource] = useState<{ uri: string; headers: { Authorization: string } } | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasPicture, setHasPicture] = useState(true);

  const loadPicture = async () => {
    try {
      const nextSource = await getProfilePictureSource(owner, version);
      setSource(nextSource);
      setHasPicture(Boolean(nextSource));
    } catch {
      setSource(null);
      setHasPicture(false);
    }
  };

  useEffect(() => {
    void loadPicture();
  }, [owner, user?.accountId, version]);

  const chooseFromGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Photo access required', 'Please allow CareNow to access your photos to choose a profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (!result.canceled && result.assets[0]) {
      await savePicture(result.assets[0]);
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Camera access required', 'Please allow CareNow to use the camera to take a profile picture.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (!result.canceled && result.assets[0]) {
      await savePicture(result.assets[0]);
    }
  };

  const savePicture = async (asset: ImagePicker.ImagePickerAsset) => {
    try {
      setLoading(true);
      await uploadProfilePicture(owner, asset);
      setHasPicture(true);
      setVersion(Date.now());
      onUpdated?.();
    } catch (error) {
      Alert.alert('Upload failed', error instanceof Error ? error.message : 'Unable to update your profile picture. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const openPicker = () => {
    Alert.alert('Update profile picture', 'Choose how you want to add your photo.', [
      { text: 'Take Photo', onPress: () => void takePhoto() },
      { text: 'Choose from Gallery', onPress: () => void chooseFromGallery() },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={openPicker}
      disabled={loading}
      style={[styles.wrapper, { width: size, height: size, borderRadius: size / 2 }]}
    >
      {source && hasPicture ? (
        <Image
          source={source}
          style={{ width: size - 10, height: size - 10, borderRadius: (size - 10) / 2 }}
          resizeMode="cover"
          onError={() => {
            setHasPicture(false);
            setSource(null);
          }}
        />
      ) : (
        <View style={[styles.placeholder, { width: size - 10, height: size - 10, borderRadius: (size - 10) / 2 }]}>
          <Ionicons name="person" size={size * 0.36} color={COLORS.white} />
        </View>
      )}

      <View style={[styles.cameraBadge, { right: Math.max(0, size * 0.01), bottom: Math.max(0, size * 0.01) }]}>
        {loading ? (
          <ActivityIndicator size="small" color={COLORS.white} />
        ) : (
          <Ionicons name="camera" size={size * 0.16} color={COLORS.white} />
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  placeholder: {
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.primaryDark,
    borderWidth: 3,
    borderColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

import { storage, USER_AVATARS_BUCKET_ID } from '@/src/api/appwrite-client';
import { useAuth } from '@/src/context/AuthContext';
import { ProfileService } from '@/src/services/profile';
import { Ionicons } from '@expo/vector-icons';
import { ID } from 'appwrite';
import * as FileSystem from 'expo-file-system';
import * as FileSicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

interface ImageUploaderProps {
  onUploadComplete: () => void;
  size?: number;
  borderColor?: string;
  iconColor?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  onUploadComplete,
  size = 100,
  borderColor = '#fff',
  iconColor = '#fff',
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const { user } = useAuth();

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status: cameraStatus } =
        await FileSicker.requestCameraPermissionsAsync();
      const { status: galleryStatus } =
        await FileSicker.requestMediaLibraryPermissionsAsync();

      if (cameraStatus !== 'granted' || galleryStatus !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant camera and gallery permissions to upload images.'
        );
        return false;
      }
    }
    return true;
  };

  const uploadImage = async (uri: string) => {
    try {
      setIsUploading(true);

      // Read file info
      const fileInfo = await FileSystem.getInfoAsync(uri);
      const fileContent = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Create File object
      const file = {
        uri,
        name: `avatar-${user?.$id}.jpg`,
        type: 'image/jpeg',
        size: fileInfo.size,
        lastModified: Date.now(),
        webkitRelativePath: '',
      } as File;

      // Upload to Appwrite
      const uploadedFile = await storage.createFile(
        USER_AVATARS_BUCKET_ID,
        ID.unique(),
        file
      );

      // Get the file URL
      const fileUrl = storage.getFileView(
        USER_AVATARS_BUCKET_ID,
        uploadedFile.$id
      );

      // Update user profile with new avatar URL
      await ProfileService.updateUserAvatar(user, fileUrl.toString());

      onUploadComplete();
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const takePhoto = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await FileSicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0].uri) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await FileSicker.launchImageLibraryAsync({
        mediaTypes: FileSicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0].uri) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const showUploadOptions = () => {
    Alert.alert(
      'Upload Photo',
      'Choose an option',
      [
        {
          text: 'Take Photo',
          onPress: takePhoto,
        },
        {
          text: 'Choose from Gallery',
          onPress: pickImage,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <TouchableOpacity
      style={[
        styles.uploadButton,
        {
          width: size,
          height: size,
          borderColor,
        },
      ]}
      onPress={showUploadOptions}
      disabled={isUploading}
    >
      {isUploading ? (
        <ActivityIndicator color={iconColor} />
      ) : (
        <Ionicons name="camera" size={size * 0.4} color={iconColor} />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  uploadButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
});

export default ImageUploader;

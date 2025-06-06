import { USER_AVATARS_BUCKET_ID } from '@/src/api/appwrite-client';
import { useAuth } from '@/src/context/AuthContext';
import { ProfileService } from '@/src/services/profile';
import { Ionicons } from '@expo/vector-icons';
import { ID } from 'appwrite';
import * as FileSicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Client, Storage } from 'react-native-appwrite';

const client = new Client()
  .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || '')
  .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID || '');

const storage = new Storage(client);

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
  const [profileImage, setProfileImage] = useState<string | null>(null);

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

  const uploadImage = async (asset: any) => {
    try {
      setIsUploading(true);
      console.log(asset);

      const fileName = `avatar-${user?.$id}.${new Date().getTime()}-${
        asset.fileName
      }`;

      // 2️⃣ upload it – now the SDK will find payload.file
      const uploaded = await storage.createFile(
        USER_AVATARS_BUCKET_ID,
        ID.unique(),
        {
          name: fileName,
          type: asset.mimeType,
          size: asset.fileSize,
          uri: asset.uri,
        }
      );

      // 3️⃣ get a public URL & update the profile
      const url = storage.getFileView(USER_AVATARS_BUCKET_ID, uploaded.$id);
      await ProfileService.updateUserAvatar(user, url.toString());

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
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0].uri) {
        await uploadImage(result.assets[0]);
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
    <View style={[styles.container, { width: size, height: size }]}>
      {profileImage ? (
        <TouchableOpacity
          style={[styles.imageContainer, { width: size, height: size }]}
          onPress={showUploadOptions}
          disabled={isUploading}
        >
          <Image
            source={{ uri: profileImage }}
            style={[styles.image, { width: size, height: size }]}
          />
          {isUploading && (
            <View style={[styles.uploadingOverlay, { width: size, height: size }]}>
              <ActivityIndicator color={iconColor} />
            </View>
          )}
        </TouchableOpacity>
      ) : (
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
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    borderRadius: 50,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    borderRadius: 50,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
});

export default ImageUploader;

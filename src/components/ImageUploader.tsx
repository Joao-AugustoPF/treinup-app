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
import { useLocalization } from '../context/LocalizationContext';

const client = new Client()
  .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || '')
  .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID || '');

const storage = new Storage(client);

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

interface ImageUploaderProps {
  onUploadComplete: () => void;
  size?: number;
  borderColor?: string;
  iconColor?: string;
  image?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  onUploadComplete,
  size = 100,
  borderColor = '#fff',
  iconColor = '#fff',
  image,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const { user } = useAuth();
  const { t } = useLocalization();

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

  const checkFileSize = (fileSize: number) => {
    if (fileSize > MAX_FILE_SIZE) {
      Alert.alert(
        'File Too Large',
        'The selected image is too large. Please choose an image smaller than 5MB.'
      );
      return false;
    }
    return true;
  };

  const uploadImage = async (asset: any) => {
    try {
      setIsUploading(true);

      if (!checkFileSize(asset.fileSize)) {
        setIsUploading(false);
        return;
      }

      const fileName = asset.fileName
        ? `avatar-${user?.$id}.${new Date().getTime()}-${asset.fileName}`
        : `avatar-${user?.$id}.${new Date().getTime()}-${asset.uri
            .split('/')
            .pop()}`;

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
        await uploadImage(result.assets[0]);
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

  const removePhoto = async () => {
    try {
      setIsUploading(true);
      await ProfileService.updateProfile(user, { photoURL: null });
      onUploadComplete();
    } catch (error) {
      console.error('Error removing photo:', error);
      Alert.alert('Error', 'Failed to remove photo. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const showUploadOptions = () => {
    const options = [
      {
        text: t('takePhoto'),
        onPress: async () => await takePhoto(),
      },
      {
        text: t('chooseFromGallery'),
        onPress: async () => await pickImage(),
      },
    ];

    // Only show remove option if there's an existing image
    if (image) {
      options.push({
        text: t('removePhoto'),
        onPress: async () => {
          Alert.alert(t('removePhoto'), t('removePhotoConfirmation'), [
            {
              text: t('cancel'),
              style: 'cancel',
            },
            {
              text: t('remove'),
              style: 'destructive',
              onPress: async () => await removePhoto(),
            },
          ]);
        },
      });
    }

    options.push({
      text: t('cancel'),
      onPress: async () => Promise.resolve(),
    });

    Alert.alert(t('uploadPhoto'), t('chooseAnOption'), options, {
      cancelable: true,
    });
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          width: size,
          height: size,
        },
      ]}
      onPress={showUploadOptions}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      disabled={isUploading}
    >
      {image && (
        <Image
          source={{ uri: image }}
          style={[
            styles.image,
            {
              width: size,
              height: size,
              opacity: isPressed ? 0.7 : 1,
            },
          ]}
        />
      )}
      {isUploading ? (
        <View style={[styles.overlay, { width: size, height: size }]}>
          <ActivityIndicator color={iconColor} />
        </View>
      ) : (
        <View
          style={[
            styles.overlay,
            {
              width: size,
              height: size,
              opacity: isPressed ? 1 : image ? 0 : 1,
            },
          ]}
        >
          <Ionicons name="camera" size={size * 0.4} color={iconColor} />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 50,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: 'rgba(255,20,147,0.7)',
  },
  image: {
    borderRadius: 50,
  },
  overlay: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 50,
  },
});

export default ImageUploader;

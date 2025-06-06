import { storage, USER_AVATARS_BUCKET_ID } from '@/src/api/appwrite-client';
import { useAuth } from '@/src/context/AuthContext';
import { ProfileService } from '@/src/services/profile';
import { Ionicons } from '@expo/vector-icons';
import { ID } from 'appwrite';
import * as ImagePicker from 'expo-image-picker';
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
        await ImagePicker.requestCameraPermissionsAsync();
      const { status: galleryStatus } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

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

  const uploadImage = async (image: any) => {
    try {
      setIsUploading(true);

      // // Convert image to blob
      // const response = await fetch(uri);
      // const blob = await response.blob();

      // Create a File object from the blob
      const file = new File([image], `avatar-${user?.$id}.jpg`, {
        type: 'image/jpeg',
      });

      console.log(file);

      console.log('FILE', image);

      // Upload to Appwrite
      const uploadedFile = await storage.createFile(
        USER_AVATARS_BUCKET_ID,
        ID.unique(),
        image
      );

      console.log('USERID', USER_AVATARS_BUCKET_ID);
      console.log('uploadedFile', uploadedFile);

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
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0].uri) {
        const fileInfo = result.assets[0];

        await uploadImage({
          name: fileInfo.fileName,
          type: fileInfo.type,
          size: fileInfo.fileSize,
          uri: fileInfo.uri,
        });
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

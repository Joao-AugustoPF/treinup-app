import { ID } from 'appwrite';
import * as ImagePicker from 'expo-image-picker';
import { storage, USER_AVATARS_BUCKET_ID } from '../api/appwrite-client';
import { ProfileService } from './profile';

export class PhotoUploadService {
  /**
   * Request permissions for camera and media library
   */
  static async requestPermissions(): Promise<boolean> {
    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
    const mediaPermission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    return cameraPermission.granted && mediaPermission.granted;
  }

  /**
   * Opens image picker to select from gallery
   */
  static async pickImage(): Promise<ImagePicker.ImagePickerAsset | null> {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      return result.assets[0];
    }

    return null;
  }

  /**
   * Opens camera to take a photo
   */
  static async takePhoto(): Promise<ImagePicker.ImagePickerAsset | null> {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      return result.assets[0];
    }

    return null;
  }

  /**
   * Uploads an image to Appwrite storage and updates user profile
   */
  static async uploadProfilePhoto(
    user: any,
    imageAsset: ImagePicker.ImagePickerAsset
  ): Promise<string> {
    try {
      // Extract filename and file extension
      const uri = imageAsset.uri;
      const filename = uri.split('/').pop() || '';
      const match = /\.(\w+)$/.exec(filename);
      const fileExt = match ? match[1].toLowerCase() : 'jpg';

      // For Appwrite, we need to fetch the file as a blob
      const response = await fetch(uri);
      const blob = await response.blob();

      // Create a File object that Appwrite can process
      const file = new File([blob], filename, {
        type: `image/${fileExt}`,
      });

      // Upload to Appwrite storage
      const result = await storage.createFile(
        USER_AVATARS_BUCKET_ID,
        ID.unique(),
        file
      );

      // Get file view URL
      const fileUrl = storage.getFileView(USER_AVATARS_BUCKET_ID, result.$id);

      // Update user profile with new avatar URL
      await ProfileService.uploadProfilePhoto(user, fileUrl);

      return fileUrl;
    } catch (error) {
      console.error('Error uploading profile photo:', error);
      throw new Error('Failed to upload profile photo');
    }
  }
}

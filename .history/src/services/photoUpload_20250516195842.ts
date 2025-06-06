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
      mediaTypes: ImagePicker.Media.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
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
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      return result.assets[0];
    }

    return null;
  }

  /**
   * Converts base64 string to Blob
   */
  private static base64ToBlob(
    base64: string,
    type: string = 'image/jpeg'
  ): Blob {
    const byteCharacters = atob(base64);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);

      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }

    return new Blob(byteArrays, { type });
  }

  /**
   * Uploads an image to Appwrite storage and updates user profile
   */
  static async uploadProfilePhoto(
    user: any,
    imageAsset: ImagePicker.ImagePickerAsset
  ): Promise<string> {
    try {
      console.log('Starting photo upload process...');
      console.log('Image:', imageAsset.uri);
      console.log(
        'Image dimensions:',
        imageAsset.width,
        'x',
        imageAsset.height
      );

      if (!imageAsset.base64) {
        throw new Error('No base64 data available');
      }

      // Step 1: Create a unique file ID
      const fileId = ID.unique();
      const fileName = `profile_${user.$id}_${new Date().getTime()}.jpg`;

      // Step 2: Convert base64 to Blob
      const blob = this.base64ToBlob(imageAsset.base64);
      const file = new File([blob], fileName, { type: 'image/jpeg' });

      // Step 3: Upload to Appwrite
      const uploadResult = await storage.createFile(
        USER_AVATARS_BUCKET_ID,
        fileId,
        file,
        ['read("any")']
      );

      console.log('Upload successful:', uploadResult);

      // Step 4: Get the file view URL
      const fileUrl = storage.getFileView(
        USER_AVATARS_BUCKET_ID,
        uploadResult.$id
      );
      console.log('File URL:', fileUrl);

      // Step 5: Update user profile with new photo URL
      await ProfileService.uploadProfilePhoto(user, fileUrl);
      console.log('Profile updated with new avatar URL');

      return fileUrl;
    } catch (error: any) {
      console.error('Error uploading profile photo:', error);
      throw new Error(
        `Failed to upload profile photo: ${error?.message || 'Unknown error'}`
      );
    }
  }
}

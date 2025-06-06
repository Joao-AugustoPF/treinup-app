import { ID } from 'appwrite';
import * as ImageManipulator from 'expo-image-manipulator';
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
      console.log('Starting photo upload process...');
      console.log('Original image:', imageAsset.uri);
      console.log(
        'Image dimensions:',
        imageAsset.width,
        'x',
        imageAsset.height
      );

      // Step 1: Process and optimize the image using ImageManipulator
      const processedImage = await ImageManipulator.manipulateAsync(
        imageAsset.uri,
        [{ resize: { width: 500 } }],
        {
          compress: 0.8,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true,
        }
      );

      console.log('Processed image:', processedImage.uri);
      console.log(
        'Processed dimensions:',
        processedImage.width,
        'x',
        processedImage.height
      );

      if (!processedImage.base64) {
        throw new Error('No base64 data available');
      }

      // Step 2: Create a Blob from the base64 data
      const byteCharacters = atob(processedImage.base64);
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

      const blob = new Blob(byteArrays, { type: 'image/jpeg' });
      console.log('Blob created, size:', blob.size);

      // Step 3: Create a File object for Appwrite compatibility
      const fileName = `profile_${user.$id}_${new Date().getTime()}.jpg`;
      const file = new File([blob], fileName, { type: 'image/jpeg' });

      console.log('File created:', fileName);

      // Step 4: Upload to Appwrite using the SDK
      const fileId = ID.unique();
      const result = await storage.createFile(
        USER_AVATARS_BUCKET_ID,
        fileId,
        file
      );

      console.log('Upload successful:', result);

      // Step 5: Get the file view URL
      const fileUrl = storage.getFileView(USER_AVATARS_BUCKET_ID, result.$id);
      console.log('File URL:', fileUrl);

      // Step 6: Update user profile with new photo URL
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

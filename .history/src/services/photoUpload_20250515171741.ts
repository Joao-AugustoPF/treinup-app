import { ID } from 'appwrite';
import * as FileSystem from 'expo-file-system';
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

      // Get image URI
      const uri = imageAsset.uri;
      console.log('Image URI:', uri);

      // Read file as base64
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      console.log('File read as base64, length:', base64.length);

      // Generate a unique filename
      const timestamp = new Date().getTime();
      const fileId = ID.unique();
      const fileExtension = uri.split('.').pop() || 'jpg';
      const filename = `${user.$id}_profile_${timestamp}.${fileExtension}`;

      console.log('Uploading file:', filename, 'File ID:', fileId);

      // Create file from base64
      const result = await storage.createFile(
        USER_AVATARS_BUCKET_ID,
        fileId,
        FileSystem.uploadAsync(
          storage.getEndpoint() +
            '/storage/buckets/' +
            USER_AVATARS_BUCKET_ID +
            '/files/' +
            fileId,
          uri,
          {
            fieldName: 'file',
            httpMethod: 'POST',
            uploadType: FileSystem.FileSystemUploadType.MULTIPART,
            headers: {
              'X-Appwrite-Project': storage.client.config.project,
              'X-Appwrite-Response-Format': '0.15.0',
            },
          }
        ) as any
      );

      console.log('File upload result:', result);

      // Get file view URL
      const fileUrl = storage.getFileView(USER_AVATARS_BUCKET_ID, fileId);
      console.log('File URL:', fileUrl);

      // Update user profile with new avatar URL
      await ProfileService.uploadProfilePhoto(user, fileUrl);
      console.log('Profile updated with new avatar URL');

      return fileUrl;
    } catch (error) {
      console.error('Error uploading profile photo:', error);
      throw new Error('Failed to upload profile photo');
    }
  }
}

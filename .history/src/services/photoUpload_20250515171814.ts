import { ID } from 'appwrite';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import {
  client,
  storage,
  USER_AVATARS_BUCKET_ID,
} from '../api/appwrite-client';
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

      // Prepare file for upload - create a new file from the image
      const fileInfo = await FileSystem.getInfoAsync(uri);
      console.log('File info:', fileInfo);

      if (!fileInfo.exists) {
        throw new Error('File does not exist');
      }

      // Read the file contents
      const fileContent = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      console.log('File content read, length:', fileContent.length);

      // Generate a unique file ID
      const fileId = ID.unique();

      // Upload to Appwrite using direct API call
      const endpoint =
        client.config.endpoint +
        '/storage/buckets/' +
        USER_AVATARS_BUCKET_ID +
        '/files';

      // Create FormData for multipart upload
      const formData = new FormData();

      // Add the file
      const fileToUpload = {
        uri: uri,
        type: 'image/jpeg',
        name: 'profile_photo.jpg',
      };

      formData.append('fileId', fileId);
      formData.append('file', fileToUpload as any);

      // Upload using fetch API
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'X-Appwrite-Project': client.config.project,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      console.log('Upload response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Upload error:', errorText);
        throw new Error(`Failed to upload: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      console.log('Upload result:', result);

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

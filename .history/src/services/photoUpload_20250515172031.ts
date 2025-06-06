import { ID } from 'appwrite';
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

      // Get a new file ID
      const fileId = ID.unique();

      // Use XMLHttpRequest for direct upload
      // This is needed because fetch API sometimes has issues with file uploads
      return new Promise((resolve, reject) => {
        // Create XHR
        const xhr = new XMLHttpRequest();
        const formData = new FormData();

        // Get the file name from URI
        const uriParts = imageAsset.uri.split('/');
        const fileName = uriParts[uriParts.length - 1];

        // Append file to form data
        formData.append('file', {
          uri: imageAsset.uri,
          name: fileName,
          type: 'image/jpeg',
        } as any);

        // Set up XHR
        xhr.onreadystatechange = function () {
          if (xhr.readyState === 4) {
            if (xhr.status === 201 || xhr.status === 200) {
              console.log('Upload successful!');
              const response = JSON.parse(xhr.responseText);
              const fileId = response.$id;

              // Get file view URL
              const fileUrl = storage.getFileView(
                USER_AVATARS_BUCKET_ID,
                fileId
              );
              console.log('File URL:', fileUrl);

              // Update user profile with new photo URL
              ProfileService.uploadProfilePhoto(user, fileUrl)
                .then(() => {
                  resolve(fileUrl);
                })
                .catch((error) => {
                  reject(error);
                });
            } else {
              console.error('Upload failed:', xhr.status, xhr.responseText);
              reject(
                new Error(`Upload failed: ${xhr.status} ${xhr.responseText}`)
              );
            }
          }
        };

        // Open and send request
        xhr.open(
          'POST',
          `${client.config.endpoint}/storage/buckets/${USER_AVATARS_BUCKET_ID}/files`
        );
        xhr.setRequestHeader('X-Appwrite-Project', client.config.project);
        xhr.send(formData);
      });
    } catch (error) {
      console.error('Error uploading profile photo:', error);
      throw new Error('Failed to upload profile photo');
    }
  }
}

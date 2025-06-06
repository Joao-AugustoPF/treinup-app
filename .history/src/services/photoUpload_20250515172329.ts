import { ID } from 'appwrite';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import {
  account,
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
      console.log('Original image:', imageAsset.uri);
      console.log('Image dimensions:', imageAsset.width, 'x', imageAsset.height);
      
      // Step 1: Process and optimize the image using ImageManipulator
      const processedImage = await ImageManipulator.manipulateAsync(
        imageAsset.uri,
        [
          // Resize the image to a reasonable size to reduce upload size
          { resize: { width: 500 } },
        ],
        {
          compress: 0.8, // Compress image to 80% quality
          format: ImageManipulator.SaveFormat.JPEG,
          base64: false,
        }
      );
      
      console.log('Processed image:', processedImage.uri);
      console.log('Processed dimensions:', processedImage.width, 'x', processedImage.height);
      
      // Step 2: Read the processed image file info
      const fileInfo = await FileSystem.getInfoAsync(processedImage.uri);
      console.log('File info:', fileInfo);
      
      if (!fileInfo.exists) {
        throw new Error('Processed file does not exist');
      }
      
      // Step 3: Read the file as base64 for reliable handling
      const base64Data = await FileSystem.readAsStringAsync(processedImage.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      if (!base64Data || base64Data.length === 0) {
        throw new Error('Failed to read image as base64');
      }
      
      console.log('Image read as base64, length:', base64Data.length);
      
      // Step 4: Create a Blob from the base64 data
      const byteCharacters = atob(base64Data);
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
      
      // Step 5: Create a File object for Appwrite compatibility
      const fileName = `profile_${user.$id}_${new Date().getTime()}.jpg`;
      const file = new File([blob], fileName, { type: 'image/jpeg' });
      

      // Primeira abordagem: Usar diretamente o SDK Appwrite que já tem autenticação configurada
      try {
        // Converter a URI da imagem em blob
        const response = await fetch(imageAsset.uri);
        const blob = await response.blob();

        // Criar um objeto File com o blob
        const fileName = imageAsset.uri.split('/').pop() || 'profile.jpg';
        const file = new File([blob], fileName, {
          type: 'image/jpeg',
        });

        console.log('Uploading file with Appwrite SDK:', fileName);

        // Upload usando o SDK do Appwrite
        const result = await storage.createFile(
          USER_AVATARS_BUCKET_ID,
          ID.unique(),
          file
        );

        console.log('Upload successful with SDK:', result);

        // Obter URL da imagem
        const fileUrl = storage.getFileView(USER_AVATARS_BUCKET_ID, result.$id);

        // Atualizar perfil do usuário
        await ProfileService.uploadProfilePhoto(user, fileUrl);

        return fileUrl;
      } catch (sdkError) {
        console.error(
          'SDK upload failed, trying alternative method:',
          sdkError
        );

        // Segunda abordagem com XHR se a primeira falhar
        return new Promise(async (resolve, reject) => {
          try {
            // Obter a sessão atual para autenticação
            const session = await account.getSession('current');

            // Criar XHR para upload
            const xhr = new XMLHttpRequest();
            const formData = new FormData();
            const fileId = ID.unique();

            // Preparar o arquivo
            formData.append('fileId', fileId);
            formData.append('file', {
              uri: imageAsset.uri,
              name: 'profile.jpg',
              type: 'image/jpeg',
            } as any);

            xhr.onreadystatechange = function () {
              if (xhr.readyState === 4) {
                if (xhr.status === 201 || xhr.status === 200) {
                  console.log('Upload successful with XHR!');
                  try {
                    const response = JSON.parse(xhr.responseText);
                    const fileUrl = storage.getFileView(
                      USER_AVATARS_BUCKET_ID,
                      response.$id
                    );

                    ProfileService.uploadProfilePhoto(user, fileUrl)
                      .then(() => {
                        resolve(fileUrl);
                      })
                      .catch((error) => {
                        reject(error);
                      });
                  } catch (parseError) {
                    reject(parseError);
                  }
                } else {
                  console.error(
                    'Upload failed with XHR:',
                    xhr.status,
                    xhr.responseText
                  );
                  reject(
                    new Error(
                      `Upload failed: ${xhr.status} ${xhr.responseText}`
                    )
                  );
                }
              }
            };

            // Configurar e enviar a requisição
            xhr.open(
              'POST',
              `${client.config.endpoint}/storage/buckets/${USER_AVATARS_BUCKET_ID}/files`
            );
            xhr.setRequestHeader('X-Appwrite-Project', client.config.project);
            xhr.setRequestHeader('X-Appwrite-Session', session.secret); // Adicionar token de sessão
            xhr.send(formData);
          } catch (error) {
            reject(error);
          }
        });
      }
    } catch (error) {
      console.error('Error uploading profile photo:', error);
      throw new Error('Failed to upload profile photo');
    }
  }
}

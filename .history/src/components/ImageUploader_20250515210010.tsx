import { useAuth } from '@/src/context/AuthContext';
import { useLocalization } from '@/src/context/LocalizationContext';
import { PhotoUploadService } from '@/src/services/photoUpload';
import { SaveFormat, useImageManipulator } from 'expo-image-manipulator';
import { Camera } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

interface ImageUploaderProps {
  onUploadComplete: () => Promise<void>;
  size?: number;
  borderColor?: string;
  iconColor?: string;
}

export default function ImageUploader({
  onUploadComplete,
  size = 100,
  borderColor = 'rgba(255,20,147,0.7)',
  iconColor = '#fff',
}: ImageUploaderProps) {
  const { user } = useAuth();
  const { t } = useLocalization();
  const [uploading, setUploading] = useState(false);

  const takePhoto = async () => {
    try {
      const permissionsGranted = await PhotoUploadService.requestPermissions();

      if (!permissionsGranted) {
        Alert.alert(
          t('permissionRequired'),
          t('cameraAndGalleryPermissionNeeded')
        );
        return;
      }

      setUploading(true);

      const imageAsset = await PhotoUploadService.takePhoto();

      if (!imageAsset) {
        setUploading(false);
        return;
      }

      // Processar a imagem usando o hook useImageManipulator
      const context = useImageManipulator(imageAsset.uri);
      const processedImage = await context.resize({ width: 500 }).renderAsync();

      const result = await processedImage.saveAsync({
        format: SaveFormat.JPEG,
        compress: 0.8,
      });

      // Usar a imagem processada para upload
      await PhotoUploadService.uploadProfilePhoto(user, {
        ...imageAsset,
        uri: result.uri,
        width: result.width,
        height: result.height,
      });

      await onUploadComplete();
      Alert.alert(t('success'), t('profilePhotoUpdated'));
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert(t('error'), t('failedToUploadPhoto'));
    } finally {
      setUploading(false);
    }
  };

  const pickImage = async () => {
    try {
      const permissionsGranted = await PhotoUploadService.requestPermissions();

      if (!permissionsGranted) {
        Alert.alert(
          t('permissionRequired'),
          t('cameraAndGalleryPermissionNeeded')
        );
        return;
      }

      setUploading(true);

      const imageAsset = await PhotoUploadService.pickImage();

      if (!imageAsset) {
        setUploading(false);
        return;
      }

      // Processar a imagem usando o hook useImageManipulator
      const context = useImageManipulator(imageAsset.uri);
      const processedImage = await context.resize({ width: 500 }).renderAsync();

      const result = await processedImage.saveAsync({
        format: SaveFormat.JPEG,
        compress: 0.8,
      });

      // Usar a imagem processada para upload
      await PhotoUploadService.uploadProfilePhoto(user, {
        ...imageAsset,
        uri: result.uri,
        width: result.width,
        height: result.height,
      });

      await onUploadComplete();
      Alert.alert(t('success'), t('profilePhotoUpdated'));
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert(t('error'), t('failedToUploadPhoto'));
    } finally {
      setUploading(false);
    }
  };

  const handleUploadPhoto = async () => {
    Alert.alert(t('choosePhotoSource'), t('selectOption'), [
      {
        text: t('takePhoto'),
        onPress: takePhoto,
      },
      {
        text: t('chooseFromGallery'),
        onPress: pickImage,
      },
      {
        text: t('cancel'),
        style: 'cancel',
      },
    ]);
  };

  return (
    <TouchableOpacity
      style={[
        styles.cameraButton,
        {
          width: size * 0.36,
          height: size * 0.36,
          borderRadius: size * 0.18,
          borderColor,
          backgroundColor: borderColor,
        },
      ]}
      onPress={handleUploadPhoto}
      disabled={uploading}
    >
      {uploading ? (
        <ActivityIndicator color={iconColor} size="small" />
      ) : (
        <Camera size={size * 0.2} color={iconColor} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cameraButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#121212',
  },
});

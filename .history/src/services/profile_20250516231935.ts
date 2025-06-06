import { Query } from 'appwrite';
import {
  DATABASE_ID,
  db,
  PROFILES_COLLECTION_ID,
} from '../api/appwrite-client';
import { ID } from 'appwrite';

export type UserProfile = {
  id: string;
  displayName: string;
  email: string;
  photoURL: string;
  phoneNumber: string;
  birthDate: string;
  location: string;
  stats: {
    workouts: number;
    classes: number;
    achievements: number;
  };
  preferences: {
    notifications: boolean;
    emailUpdates: boolean;
    darkMode: boolean;
    offlineMode: boolean;
    hapticFeedback: boolean;
    autoUpdate: boolean;
    showNotificationIcon: boolean;
    language: string;
  };
  privacy: {
    publicProfile: boolean;
    showWorkouts: boolean;
    showProgress: boolean;
    showClasses: boolean;
    showEvaluation: boolean;
    twoFactorAuth: boolean;
  };
};

// Mock user profiles data
const USER_PROFILES: Record<string, UserProfile> = {
  default: {
    id: '1',
    displayName: 'John Doe',
    email: 'john@example.com',
    photoURL:
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=1000&auto=format&fit=crop',
    phoneNumber: '+1 (555) 123-4567',
    birthDate: '1990-01-15',
    location: 'New York, USA',
    stats: {
      workouts: 24,
      classes: 12,
      achievements: 8,
    },
    preferences: {
      notifications: true,
      emailUpdates: true,
      darkMode: true,
      offlineMode: false,
      hapticFeedback: true,
      autoUpdate: true,
      showNotificationIcon: true,
      language: 'Português',
    },
    privacy: {
      publicProfile: true,
      showWorkouts: true,
      showProgress: false,
      showClasses: true,
      showEvaluation: true,
      twoFactorAuth: false,
    },
  },
};

export class ProfileService {
  static async getUserProfile(user: any): Promise<UserProfile> {
    try {
      const response = await db.listDocuments(
        DATABASE_ID,
        PROFILES_COLLECTION_ID,
        [Query.equal('userId', user.$id)]
      );

      if (response.documents.length === 0) {
        return await this.createUserProfile(user);
      }

      const profileDoc = response.documents[0];
      return {
        id: profileDoc.$id,
        displayName: profileDoc.name,
        email: profileDoc.email,
        photoURL: profileDoc.avatarUrl || '',
        phoneNumber: profileDoc.phoneNumber || '',
        birthDate: profileDoc.birthDate || '',
        location: profileDoc.location || '',
        stats: {
          workouts: profileDoc.stats_workouts || 0,
          classes: profileDoc.stats_classes || 0,
          achievements: profileDoc.stats_achievements || 0,
        },
        preferences: {
          notifications: profileDoc.pref_notifications !== false,
          emailUpdates: profileDoc.pref_emailUpdates !== false,
          darkMode: profileDoc.pref_darkMode !== false,
          offlineMode: profileDoc.pref_offlineMode === true,
          hapticFeedback: profileDoc.pref_hapticFeedback !== false,
          autoUpdate: profileDoc.pref_autoUpdate !== false,
          showNotificationIcon: profileDoc.pref_showNotificationIcon !== false,
          language: profileDoc.pref_language || 'Português',
        },
        privacy: {
          publicProfile: profileDoc.privacy_publicProfile !== false,
          showWorkouts: profileDoc.privacy_showWorkouts !== false,
          showProgress: profileDoc.privacy_showProgress === true,
          showClasses: profileDoc.privacy_showClasses !== false,
          showEvaluation: profileDoc.privacy_showEvaluation !== false,
          twoFactorAuth: profileDoc.privacy_twoFactorAuth === true,
        },
      };
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  }

  static async createUserProfile(user: any): Promise<UserProfile> {
    try {
      const profile = {
        userId: user.$id,
        name: user.name,
        email: user.email,
        avatarUrl: user.prefs.avatar || null,
        phoneNumber: null,
        birthDate: null,
        location: null,
        stats_workouts: 0,
        stats_classes: 0,
        stats_achievements: 0,
        pref_notifications: true,
        pref_emailUpdates: true,
        pref_darkMode: true,
        pref_offlineMode: false,
        pref_hapticFeedback: true,
        pref_autoUpdate: true,
        pref_showNotificationIcon: true,
        pref_language: 'Português',
        privacy_publicProfile: true,
        privacy_showWorkouts: true,
        privacy_showProgress: false,
        privacy_showClasses: true,
        privacy_showEvaluation: true,
        privacy_twoFactorAuth: false,
      };

      const createdProfile = await db.createDocument(
        DATABASE_ID,
        PROFILES_COLLECTION_ID,
        ID.unique(),
        profile
      );

      return {
        id: createdProfile.$id,
        displayName: createdProfile.name,
        email: createdProfile.email,
        photoURL: createdProfile.avatarUrl || '',
        phoneNumber: createdProfile.phoneNumber || '',
        birthDate: createdProfile.birthDate || '',
        location: createdProfile.location || '',
        stats: {
          workouts: createdProfile.stats_workouts || 0,
          classes: createdProfile.stats_classes || 0,
          achievements: createdProfile.stats_achievements || 0,
        },
        preferences: {
          notifications: createdProfile.pref_notifications !== false,
          emailUpdates: createdProfile.pref_emailUpdates !== false,
          darkMode: createdProfile.pref_darkMode !== false,
          offlineMode: createdProfile.pref_offlineMode === true,
          hapticFeedback: createdProfile.pref_hapticFeedback !== false,
          autoUpdate: createdProfile.pref_autoUpdate !== false,
          showNotificationIcon: createdProfile.pref_showNotificationIcon !== false,
          language: createdProfile.pref_language || 'Português',
        },
        privacy: {
          publicProfile: createdProfile.privacy_publicProfile !== false,
          showWorkouts: createdProfile.privacy_showWorkouts !== false,
          showProgress: createdProfile.privacy_showProgress === true,
          showClasses: createdProfile.privacy_showClasses !== false,
          showEvaluation: createdProfile.privacy_showEvaluation !== false,
          twoFactorAuth: createdProfile.privacy_twoFactorAuth === true,
        },
      };
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  }

  static async updateProfile(user: any, data: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const currentProfile = await this.getUserProfile(user);
      
      const updatedProfile = await db.updateDocument(
        DATABASE_ID,
        PROFILES_COLLECTION_ID,
        currentProfile.id,
        {
          ...data,
          userId: user.$id, // Ensure userId is always set
        }
      );

      return {
        id: updatedProfile.$id,
        displayName: updatedProfile.name,
        email: updatedProfile.email,
        photoURL: updatedProfile.avatarUrl || '',
        phoneNumber: updatedProfile.phoneNumber || '',
        birthDate: updatedProfile.birthDate || '',
        location: updatedProfile.location || '',
        stats: {
          workouts: updatedProfile.stats_workouts || 0,
          classes: updatedProfile.stats_classes || 0,
          achievements: updatedProfile.stats_achievements || 0,
        },
        preferences: {
          notifications: updatedProfile.pref_notifications !== false,
          emailUpdates: updatedProfile.pref_emailUpdates !== false,
          darkMode: updatedProfile.pref_darkMode !== false,
          offlineMode: updatedProfile.pref_offlineMode === true,
          hapticFeedback: updatedProfile.pref_hapticFeedback !== false,
      if (profilesResponse.documents.length === 0) {
        throw new Error('Profile not found');
      }

      const profileDoc = profilesResponse.documents[0];
      const profileId = profileDoc.$id;

      // Converter de volta para o formato do banco
      const updateData: Record<string, any> = {};

      if (updates.displayName !== undefined)
        updateData.name = updates.displayName;
      if (updates.photoURL !== undefined)
        updateData.avatarUrl = updates.photoURL;
      if (updates.phoneNumber !== undefined)
        updateData.phoneNumber = updates.phoneNumber;
      if (updates.birthDate !== undefined)
        updateData.birthDate = updates.birthDate;
      if (updates.location !== undefined)
        updateData.location = updates.location;

      // Atualizar o documento no banco
      if (Object.keys(updateData).length > 0) {
        await db.updateDocument(
          DATABASE_ID,
          PROFILES_COLLECTION_ID,
          profileId,
          updateData
        );
      }

      // Buscar o perfil atualizado
      return await this.getUserProfile(user);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw new Error('Failed to update profile');
    }
  }

  static async updateUserAvatar(user: any, avatarUrl: string) {
    try {
      const profile = await this.getUserProfile(user);

      console.log(profile);

      return await db.updateDocument(
        DATABASE_ID,
        PROFILES_COLLECTION_ID,
        profile.id,
        {
          avatarUrl: avatarUrl,
        }
      );
    } catch (error) {
      console.error('Error updating user avatar:', error);
      throw error;
    }
  }

  static async updatePreferences(
    user: any | null,
    preferences: Partial<UserProfile['preferences']>
  ): Promise<UserProfile['preferences']> {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      // Buscar o perfil pelo userId
      const profilesResponse = await db.listDocuments(
        DATABASE_ID,
        PROFILES_COLLECTION_ID,
        [Query.equal('userId', user.$id)]
      );

      if (profilesResponse.documents.length === 0) {
        throw new Error('Profile not found');
      }

      const profileDoc = profilesResponse.documents[0];
      const profileId = profileDoc.$id;

      // Converter de volta para o formato do banco
      const updateData: Record<string, any> = {};

      if (preferences.notifications !== undefined)
        updateData.pref_notifications = preferences.notifications;
      if (preferences.emailUpdates !== undefined)
        updateData.pref_emailUpdates = preferences.emailUpdates;
      if (preferences.darkMode !== undefined)
        updateData.pref_darkMode = preferences.darkMode;
      if (preferences.offlineMode !== undefined)
        updateData.pref_offlineMode = preferences.offlineMode;
      if (preferences.hapticFeedback !== undefined)
        updateData.pref_hapticFeedback = preferences.hapticFeedback;
      if (preferences.autoUpdate !== undefined)
        updateData.pref_autoUpdate = preferences.autoUpdate;
      if (preferences.showNotificationIcon !== undefined)
        updateData.pref_showNotificationIcon = preferences.showNotificationIcon;
      if (preferences.language !== undefined)
        updateData.pref_language = preferences.language;

      // Atualizar o documento no banco
      if (Object.keys(updateData).length > 0) {
        await db.updateDocument(
          DATABASE_ID,
          PROFILES_COLLECTION_ID,
          profileId,
          updateData
        );
      }

      // Buscar o perfil atualizado
      const updatedProfile = await this.getUserProfile(user);
      return updatedProfile.preferences;
    } catch (error) {
      console.error('Error updating preferences:', error);
      throw new Error('Failed to update preferences');
    }
  }

  static async updatePrivacySettings(
    user: any | null,
    settings: Partial<UserProfile['privacy']>
  ): Promise<UserProfile['privacy']> {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      // Buscar o perfil pelo userId
      const profilesResponse = await db.listDocuments(
        DATABASE_ID,
        PROFILES_COLLECTION_ID,
        [Query.equal('userId', user.$id)]
      );

      if (profilesResponse.documents.length === 0) {
        throw new Error('Profile not found');
      }

      const profileDoc = profilesResponse.documents[0];
      const profileId = profileDoc.$id;

      // Converter de volta para o formato do banco
      const updateData: Record<string, any> = {};

      if (settings.publicProfile !== undefined)
        updateData.privacy_publicProfile = settings.publicProfile;
      if (settings.showWorkouts !== undefined)
        updateData.privacy_showWorkouts = settings.showWorkouts;
      if (settings.showProgress !== undefined)
        updateData.privacy_showProgress = settings.showProgress;
      if (settings.showClasses !== undefined)
        updateData.privacy_showClasses = settings.showClasses;
      if (settings.showEvaluation !== undefined)
        updateData.privacy_showEvaluation = settings.showEvaluation;
      if (settings.twoFactorAuth !== undefined)
        updateData.privacy_twoFactorAuth = settings.twoFactorAuth;

      // Atualizar o documento no banco
      if (Object.keys(updateData).length > 0) {
        await db.updateDocument(
          DATABASE_ID,
          PROFILES_COLLECTION_ID,
          profileId,
          updateData
        );
      }

      // Buscar o perfil atualizado
      const updatedProfile = await this.getUserProfile(user);
      return updatedProfile.privacy;
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      throw new Error('Failed to update privacy settings');
    }
  }

  static async uploadProfilePhoto(
    user: any | null,
    photoURL: string
  ): Promise<UserProfile> {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      return await this.updateProfile(user, { photoURL });
    } catch (error) {
      console.error('Error uploading profile photo:', error);
      throw new Error('Failed to upload profile photo');
    }
  }

  static async initiatePasswordReset(user: any | null): Promise<void> {
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Appwrite não possui um endpoint direto para iniciar redefinição de senha através da API
    // Um fluxo comum seria enviar um e-mail para o usuário que contém um link para a página de redefinição de senha
    console.log('Password reset initiated for user:', user.email);
  }

  static async deleteAccount(user: any | null): Promise<void> {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      // Buscar o perfil pelo userId para obter o ID do documento
      const profilesResponse = await db.listDocuments(
        DATABASE_ID,
        PROFILES_COLLECTION_ID,
        [Query.equal('userId', user.$id)]
      );

      if (profilesResponse.documents.length > 0) {
        const profileDoc = profilesResponse.documents[0];

        // Excluir o documento do perfil
        await db.deleteDocument(
          DATABASE_ID,
          PROFILES_COLLECTION_ID,
          profileDoc.$id
        );
      }

      // Nota: A exclusão da conta do usuário no Appwrite geralmente seria feita pelo endpoint de account
      // mas aqui estamos apenas excluindo o perfil associado
    } catch (error) {
      console.error('Error deleting account:', error);
      throw new Error('Failed to delete account');
    }
  }

  static async updateContactInfo(
    user: any | null,
    contactInfo: { phoneNumber?: string; location?: string; birthDate?: string }
  ): Promise<UserProfile> {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      // Buscar o perfil pelo userId
      const profilesResponse = await db.listDocuments(
        DATABASE_ID,
        PROFILES_COLLECTION_ID,
        [Query.equal('userId', user.$id)]
      );

      if (profilesResponse.documents.length === 0) {
        throw new Error('Profile not found');
      }

      const profileDoc = profilesResponse.documents[0];
      const profileId = profileDoc.$id;

      // Preparar os dados para atualizar
      const updateData: Record<string, any> = {};

      if (contactInfo.phoneNumber !== undefined) {
        updateData.phoneNumber = contactInfo.phoneNumber;
      }

      if (contactInfo.location !== undefined) {
        updateData.location = contactInfo.location;
      }

      if (contactInfo.birthDate !== undefined) {
        updateData.birthDate = contactInfo.birthDate;
      }

      // Atualizar o documento no banco apenas se houver alterações
      if (Object.keys(updateData).length > 0) {
        await db.updateDocument(
          DATABASE_ID,
          PROFILES_COLLECTION_ID,
          profileId,
          updateData
        );
      }

      // Retornar o perfil atualizado
      return await this.getUserProfile(user);
    } catch (error) {
      console.error('Error updating contact information:', error);
      throw new Error('Failed to update contact information');
    }
  }
}

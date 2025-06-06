import { Query } from 'appwrite';
import {
  DATABASE_ID,
  db,
  PROFILES_COLLECTION_ID,
} from '../api/appwrite-client';

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
    language: string;
  };
  privacy: {
    publicProfile: boolean;
    showWorkouts: boolean;
    showProgress: boolean;
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
      language: 'Português',
    },
    privacy: {
      publicProfile: true,
      showWorkouts: true,
      showProgress: false,
      twoFactorAuth: false,
    },
  },
};

export class ProfileService {
  static async getUserProfile(user: any | null): Promise<UserProfile> {
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

      // Converter o perfil do formato do banco para o formato da aplicação
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
          language: profileDoc.pref_language || 'Português',
        },
        privacy: {
          publicProfile: profileDoc.privacy_publicProfile !== false,
          showWorkouts: profileDoc.privacy_showWorkouts !== false,
          showProgress: profileDoc.privacy_showProgress === true,
          twoFactorAuth: profileDoc.privacy_twoFactorAuth === true,
        },
      };
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw new Error('Failed to fetch user profile');
    }
  }

  static async updateProfile(
    user: any | null,
    updates: Partial<UserProfile>
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

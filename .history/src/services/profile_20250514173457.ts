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
    await new Promise((resolve) => setTimeout(resolve, 800));

    if (!user) {
      throw new Error('User not authenticated');
    }

    // In a real app, fetch from API using user.uid
    return USER_PROFILES['default'];
  }

  static async updateProfile(
    user: any | null,
    updates: Partial<UserProfile>
  ): Promise<UserProfile> {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (!user) {
      throw new Error('User not authenticated');
    }

    const currentProfile = USER_PROFILES['default'];
    const updatedProfile = {
      ...currentProfile,
      ...updates,
    };

    // In a real app, save to API
    USER_PROFILES['default'] = updatedProfile;

    return updatedProfile;
  }

  static async updatePreferences(
    user: any | null,
    preferences: Partial<UserProfile['preferences']>
  ): Promise<UserProfile['preferences']> {
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (!user) {
      throw new Error('User not authenticated');
    }

    const currentProfile = USER_PROFILES['default'];
    const updatedPreferences = {
      ...currentProfile.preferences,
      ...preferences,
    };

    currentProfile.preferences = updatedPreferences;

    return updatedPreferences;
  }

  static async updatePrivacySettings(
    user: any | null,
    settings: Partial<UserProfile['privacy']>
  ): Promise<UserProfile['privacy']> {
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (!user) {
      throw new Error('User not authenticated');
    }

    const currentProfile = USER_PROFILES['default'];
    const updatedPrivacy = {
      ...currentProfile.privacy,
      ...settings,
    };

    currentProfile.privacy = updatedPrivacy;

    return updatedPrivacy;
  }

  static async uploadProfilePhoto(
    user: any | null,
    photoURL: string
  ): Promise<UserProfile> {
    await new Promise((resolve) => setTimeout(resolve, 1200));

    if (!user) {
      throw new Error('User not authenticated');
    }

    return this.updateProfile(user, { photoURL });
  }

  static async initiatePasswordReset(user: any | null): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 800));

    if (!user) {
      throw new Error('User not authenticated');
    }

    // In a real app, this would trigger a password reset email
    console.log('Password reset initiated for user:', user.email);
  }

  static async deleteAccount(user: any | null): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 1500));

    if (!user) {
      throw new Error('User not authenticated');
    }

    // In a real app, this would delete the user's account and all associated data
    console.log('Account deleted for user:', user.email);
  }
}

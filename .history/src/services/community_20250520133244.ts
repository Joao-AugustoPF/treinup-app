import { Models, Query } from 'appwrite';
import { db } from '../api/appwrite-client';
import { DATABASE_ID } from '@/src/api/';

const POSTS_COLLECTION_ID = '6821670c001721d36d6e'; // CommunityPosts collection ID
const PROFILES_COLLECTION_ID = '682161970028be4664f2'; // Profiles collection ID

export type Post = {
  id: string;
  content: string;
  mediaUrl?: string;
  author: {
    id: string;
    name: string;
    image?: string;
    role: 'USER' | 'TRAINER' | 'OWNER';
  };
  likes: number;
  comments: number;
  isLiked: boolean;
  createdAt: Date;
};

export type Trainer = {
  id: string;
  name: string;
  image?: string;
  specialty: string;
  rating: number;
  followers: number;
  isFollowing: boolean;
};

export class CommunityService {
  static async getCommunityPosts(
    user: Models.User<Models.Preferences> | null,
    tenantId: string
  ): Promise<Post[]> {
    try {
      const response = await db.listDocuments(
        DATABASE_ID,
        POSTS_COLLECTION_ID,
        [Query.equal('tenantId', tenantId), Query.orderDesc('$createdAt')]
      );

      // Fetch author profiles for all posts
      const authorIds = [
        ...new Set(response.documents.map((doc) => doc.authorProfileId)),
      ];
      const profilesResponse = await db.listDocuments(
        DATABASE_ID,
        PROFILES_COLLECTION_ID,
        [Query.equal('$id', authorIds)]
      );

      const profilesMap = new Map(
        profilesResponse.documents.map((profile) => [profile.$id, profile])
      );

      return response.documents.map((doc) => {
        const author = profilesMap.get(doc.authorProfileId);
        return {
          id: doc.$id,
          content: doc.content,
          mediaUrl: doc.mediaUrl,
          author: {
            id: author?.$id || '',
            name: author?.name || '',
            image: author?.avatarUrl,
            role: author?.role || 'USER',
          },
          likes: 0, // These will be implemented in a future update
          comments: 0,
          isLiked: false,
          createdAt: new Date(doc.$createdAt),
        };
      });
    } catch (error) {
      console.error('Error fetching community posts:', error);
      throw error;
    }
  }

  static async getFeaturedTrainers(
    user: Models.User<Models.Preferences> | null,
    tenantId: string
  ): Promise<Trainer[]> {
    try {
      // Get all trainers from the profiles collection
      const response = await db.listDocuments(
        DATABASE_ID,
        PROFILES_COLLECTION_ID,
        [Query.equal('tenantId', tenantId), Query.equal('role', 'TRAINER')]
      );

      return response.documents.map((doc) => ({
        id: doc.$id,
        name: doc.name,
        image: doc.avatarUrl,
        specialty: 'Personal Trainer', // This could be added to the profile schema in the future
        rating: 0, // This could be added to the profile schema in the future
        followers: 0, // This could be added to the profile schema in the future
        isFollowing: false, // This could be implemented in a future update
      }));
    } catch (error) {
      console.error('Error fetching featured trainers:', error);
      throw error;
    }
  }

  static async createPost(
    user: Models.User<Models.Preferences> | null,
    content: string,
    mediaUrl?: string,
    tenantId: string
  ): Promise<Post> {
    if (!user) throw new Error('User not authenticated');

    try {
      // Get user profile to check role
      const profileResponse = await db.listDocuments(
        DATABASE_ID,
        PROFILES_COLLECTION_ID,
        [Query.equal('userId', user.$id)]
      );

      if (profileResponse.documents.length === 0) {
        throw new Error('User profile not found');
      }

      const profile = profileResponse.documents[0];
      if (profile.role !== 'TRAINER' && profile.role !== 'OWNER') {
        throw new Error('Only trainers and owners can create posts');
      }

      const doc = await db.createDocument(
        DATABASE_ID,
        POSTS_COLLECTION_ID,
        'unique()',
        {
          content,
          mediaUrl,
          tenantId,
          authorProfileId: profile.$id,
        }
      );

      return {
        id: doc.$id,
        content: doc.content,
        mediaUrl: doc.mediaUrl,
        author: {
          id: profile.$id,
          name: profile.name,
          image: profile.avatarUrl,
          role: profile.role,
        },
        likes: 0,
        comments: 0,
        isLiked: false,
        createdAt: new Date(doc.$createdAt),
      };
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  }

  // These methods will be implemented in a future update when we add likes and comments functionality
  static async likePost(
    user: Models.User<Models.Preferences> | null,
    postId: string,
    tenantId: string
  ): Promise<void> {
    throw new Error('Not implemented yet');
  }

  static async commentOnPost(
    user: Models.User<Models.Preferences> | null,
    postId: string,
    content: string,
    tenantId: string
  ): Promise<void> {
    throw new Error('Not implemented yet');
  }

  static async sharePost(
    user: Models.User<Models.Preferences> | null,
    postId: string,
    tenantId: string
  ): Promise<void> {
    throw new Error('Not implemented yet');
  }

  static async followTrainer(
    user: Models.User<Models.Preferences> | null,
    trainerId: string,
    tenantId: string
  ): Promise<void> {
    throw new Error('Not implemented yet');
  }
}

import { ID, Query } from 'appwrite';
import { DATABASE_ID, db, storage } from '../api/appwrite-client';

const POSTS_COLLECTION_ID = '6821670c001721d36d6e';
const PROFILES_COLLECTION_ID = '682161970028be4664f2';
const COMMUNITY_POSTS_BUCKET_ID = '682cc33a00011b9007fe';

export type Post = {
  id: string;
  content: string;
  mediaUrl?: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    image: string;
    role: string;
  };
  likes: number;
  comments: number;
  isLiked: boolean;
};

export type Trainer = {
  id: string;
  name: string;
  image: string;
  role: string;
};

export class CommunityService {
  static async getCommunityPosts(user: any, tenantId: string): Promise<Post[]> {
    try {
      const response = await db.listDocuments(
        DATABASE_ID,
        POSTS_COLLECTION_ID,
        [
          Query.equal('tenantId', tenantId),
          Query.orderDesc('$createdAt'),
          Query.limit(50),
        ]
      );

      const posts = await Promise.all(
        response.documents.map(async (doc: any): Promise<Post | null> => {
          if (!doc.authorProfileId) {
            console.error('Post without authorProfileId:', doc);
            return null;
          }

          try {
            const authorProfile = await db.getDocument(
              DATABASE_ID,
              PROFILES_COLLECTION_ID,
              doc.authorProfileId
            );

            const post: Post = {
              id: doc.$id,
              content: doc.content,
              mediaUrl: doc.mediaUrl || undefined,
              createdAt: doc.$createdAt,
              author: {
                id: authorProfile.$id,
                name: authorProfile.name,
                image:
                  authorProfile.avatarUrl ||
                  'https://ui-avatars.com/api/?name=' +
                    encodeURIComponent(authorProfile.name),
                role: authorProfile.role,
              },
              likes: 0,
              comments: 0,
              isLiked: false,
            };

            return post;
          } catch (error) {
            console.error('Error fetching author profile:', error);
            return null;
          }
        })
      );

      // Filter out any null posts (where author profile couldn't be fetched)
      return posts.filter((post): post is Post => post !== null);
    } catch (error) {
      console.error('Error fetching community posts:', error);
      throw error;
    }
  }

  static async createPost(
    user: any,
    content: string,
    tenantId: string,
    mediaUrl?: string
  ): Promise<Post> {
    try {
      // Get user profile
      const profileResponse = await db.listDocuments(
        DATABASE_ID,
        PROFILES_COLLECTION_ID,
        [Query.equal('userId', user.$id)]
      );

      if (profileResponse.documents.length === 0) {
        throw new Error('Profile not found');
      }

      const profile = profileResponse.documents[0];

      if (profile.role !== 'TRAINER' && profile.role !== 'OWNER') {
        throw new Error('Only trainers and owners can create posts');
      }

      // Create post document
      const postResponse = await db.createDocument(
        DATABASE_ID,
        POSTS_COLLECTION_ID,
        ID.unique(),
        {
          content,
          tenantId,
          authorProfileId: profile.$id,
          mediaUrl: mediaUrl || null,
        }
      );

      return {
        id: postResponse.$id,
        content: postResponse.content,
        mediaUrl: postResponse.mediaUrl,
        createdAt: postResponse.$createdAt,
        author: {
          id: profile.$id,
          name: profile.name,
          image:
            profile.avatarUrl ||
            'https://ui-avatars.com/api/?name=' +
              encodeURIComponent(profile.name),
          role: profile.role,
        },
        likes: 0,
        comments: 0,
        isLiked: false,
      };
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  }

  static async uploadPostImage(asset: {
    name: string;
    type: string;
    size: number;
    uri: string;
  }): Promise<string> {
    try {
      // Create a blob from the URI
      const response = await fetch(asset.uri);
      const blob = await response.blob();

      // Create a File object from the blob
      const file = new File([blob], asset.name, {
        type: asset.type,
      });

      const response = await storage.createFile(
        COMMUNITY_POSTS_BUCKET_ID,
        ID.unique(),
        file
      );

      const fileUrl = storage.getFileView(
        COMMUNITY_POSTS_BUCKET_ID,
        response.$id
      );

      return fileUrl.toString();
    } catch (error) {
      console.error('Error uploading post image:', error);
      throw error;
    }
  }

  static async getFeaturedTrainers(
    user: any,
    tenantId: string
  ): Promise<Trainer[]> {
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    try {
      // Get all trainers from the profiles collection
      const response = await db.listDocuments(
        DATABASE_ID,
        PROFILES_COLLECTION_ID,
        [Query.equal('role', 'TRAINER'), Query.equal('tenantId', tenantId)]
      );

      return response.documents.map((doc: any) => ({
        id: doc.$id,
        name: doc.name,
        image:
          doc.avatarUrl ||
          'https://ui-avatars.com/api/?name=' + encodeURIComponent(doc.name),
        role: doc.role,
      }));
    } catch (error) {
      console.error('Error fetching featured trainers:', error);
      throw error;
    }
  }

  // These methods will be implemented in a future update when we add likes and comments functionality
  static async likePost(
    user: any,
    postId: string,
    tenantId: string
  ): Promise<void> {
    throw new Error('Not implemented yet');
  }

  static async commentOnPost(
    user: any,
    postId: string,
    content: string,
    tenantId: string
  ): Promise<void> {
    throw new Error('Not implemented yet');
  }

  static async sharePost(
    user: any,
    postId: string,
    tenantId: string
  ): Promise<void> {
    throw new Error('Not implemented yet');
  }

  static async followTrainer(
    user: any,
    trainerId: string,
    tenantId: string
  ): Promise<void> {
    throw new Error('Not implemented yet');
  }
}

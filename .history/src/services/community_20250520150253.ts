import { Models, Query } from 'appwrite';
import { DATABASE_ID, db } from '../api/appwrite-client';

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
        response.documents.map(async (doc) => {
          const authorProfile = await db.getDocument(
            DATABASE_ID,
            PROFILES_COLLECTION_ID,
            doc.authorProfileId
          );

          return {
            id: doc.$id,
            content: doc.content,
            mediaUrl: doc.mediaUrl,
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
            likes: 0, // To be implemented
            comments: 0, // To be implemented
            isLiked: false, // To be implemented
          };
        })
      );

      return posts;
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
      const profileResponse = await client.databases.listDocuments(
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
      const postResponse = await client.databases.createDocument(
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

  static async uploadPostImage(file: File): Promise<string> {
    try {
      const response = await client.storage.createFile(
        COMMUNITY_POSTS_BUCKET_ID,
        ID.unique(),
        file
      );

      const fileUrl = client.storage.getFileView(
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
    user: Models.User<Models.Preferences> | null,
    tenantId: string
  ): Promise<Trainer[]> {
    console.log(tenantId);
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    try {
      // Get all trainers from the profiles collection
      const response = await client.databases.listDocuments(
        DATABASE_ID,
        PROFILES_COLLECTION_ID,
        [Query.equal('role', 'TRAINER'), Query.equal('tenantId', tenantId)]
      );

      console.log(response);

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

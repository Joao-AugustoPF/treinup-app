import { ID, Query } from 'appwrite';
import { Client, Storage } from 'react-native-appwrite';
import { DATABASE_ID, db } from '../api/appwrite-client';

const client = new Client()
  .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || '')
  .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID || '');

const storageClient = new Storage(client);

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
  isLiked: boolean;
  authorId: string;
  notifyUsers: boolean;
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

      // Get user profile to check likes
      const profileResponse = await db.listDocuments(
        DATABASE_ID,
        PROFILES_COLLECTION_ID,
        [Query.equal('userId', user.$id)]
      );

      if (profileResponse.documents.length === 0) {
        throw new Error('Profile not found');
      }

      const userProfile = profileResponse.documents[0];

      const posts = await Promise.all(
        response.documents.map(async (doc: any): Promise<Post | null> => {
          if (!doc.authorProfileId) {
            console.error('Post without authorProfileId:', doc);
            return null;
          }

          try {
            // Get the author profile ID, handling both string and object cases
            const authorProfileId =
              typeof doc.authorProfileId === 'string'
                ? doc.authorProfileId
                : doc.authorProfileId.$id;

            if (!authorProfileId) {
              console.error('Invalid authorProfileId:', doc.authorProfileId);
              return null;
            }

            // Process likes array
            const likes = doc.likes || [];
            const isLiked = likes.includes(userProfile.$id);

            // If we already have the full profile object, use it directly
            if (
              typeof doc.authorProfileId === 'object' &&
              doc.authorProfileId.$id
            ) {
              const authorProfile = doc.authorProfileId;
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
                likes: likes.length,
                isLiked,
                authorId: authorProfile.$id,
                notifyUsers: false,
              };
              return post;
            }

            // Otherwise fetch the profile
            const authorProfile = await db.getDocument(
              DATABASE_ID,
              PROFILES_COLLECTION_ID,
              authorProfileId
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
              likes: likes.length,
              isLiked,
              authorId: authorProfile.$id,
              notifyUsers: false,
            };

            return post;
          } catch (error) {
            console.error('Error fetching author profile for post:', {
              postId: doc.$id,
              authorProfileId: doc.authorProfileId,
              error: error,
            });
            return null;
          }
        })
      );

      // Filter out any null posts (where author profile couldn't be fetched)
      const validPosts = posts.filter((post): post is Post => post !== null);
      return validPosts;
    } catch (error) {
      console.error('Error fetching community posts:', error);
      throw error;
    }
  }

  static async createPost(
    user: any,
    content: string,
    tenantId: string,
    mediaUrl?: string,
    notifyUsers: boolean = false
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

      if (profile.role !== 'OWNER' && profile.role !== 'TRAINER'  ) {
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

      // If notifyUsers is true, create a notification
      if (notifyUsers) {
        try {
          // Get the team ID from the profile
          const teamId = profile.tenantId;

          await db.createDocument(
            DATABASE_ID,
            '68281a17001502a83bd4', // Notifications collection ID
            ID.unique(),
            {
              type: 'info',
              title: 'Nova publicação na comunidade',
              message: `${profile.name} publicou: ${content.substring(0, 100)}${
                content.length > 100 ? '...' : ''
              }`,
              tenantId: teamId, // Using the team ID instead of the gym ID
              readBy: [],
              deletedBy: [],
            }
          );
        } catch (error) {
          console.error('Error creating notification:', error);
          // Don't throw error here as the post was already created
        }
      }

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
        isLiked: false,
        authorId: profile.$id,
        notifyUsers,
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
      const fileId = ID.unique();
      const result = await storageClient.createFile(
        COMMUNITY_POSTS_BUCKET_ID,
        fileId,
        asset
      );

      const fileUrl = storageClient.getFileView(
        COMMUNITY_POSTS_BUCKET_ID,
        result.$id
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
        [Query.equal('role', ['TRAINER', 'OWNER']), Query.equal('tenantId', tenantId)]
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

  static async likePost(
    user: any,
    postId: string,
    tenantId: string
  ): Promise<Post> {
    try {
      // Get the post
      const post = await db.getDocument(
        DATABASE_ID,
        POSTS_COLLECTION_ID,
        postId
      );

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

      // Get the likes array or initialize it
      const likes = post.likes || [];
      const userLikeIndex = likes.indexOf(profile.$id);

      // Toggle like
      if (userLikeIndex === -1) {
        // Add like
        likes.push(profile.$id);
      } else {
        // Remove like
        likes.splice(userLikeIndex, 1);
      }

      // Update the post
      const updatedPost = await db.updateDocument(
        DATABASE_ID,
        POSTS_COLLECTION_ID,
        postId,
        { likes }
      );

      // Get author profile for the response
      const authorProfileId =
        typeof post.authorProfileId === 'string'
          ? post.authorProfileId
          : post.authorProfileId.$id;

      const authorProfile = await db.getDocument(
        DATABASE_ID,
        PROFILES_COLLECTION_ID,
        authorProfileId
      );

      return {
        id: updatedPost.$id,
        content: updatedPost.content,
        mediaUrl: updatedPost.mediaUrl,
        createdAt: updatedPost.$createdAt,
        author: {
          id: authorProfile.$id,
          name: authorProfile.name,
          image:
            authorProfile.avatarUrl ||
            'https://ui-avatars.com/api/?name=' +
              encodeURIComponent(authorProfile.name),
          role: authorProfile.role,
        },
        likes: likes.length,
        isLiked: likes.includes(profile.$id),
        authorId: authorProfileId,
        notifyUsers: false,
      };
    } catch (error) {
      console.error('Error liking post:', error);
      throw error;
    }
  }

  static async followTrainer(
    user: any,
    trainerId: string,
    tenantId: string
  ): Promise<void> {
    throw new Error('Not implemented yet');
  }

  static async editPost(
    user: any,
    postId: string,
    content: string,
    mediaUrl?: string
  ): Promise<Post> {
    try {
      // Get the post to check permissions and edit time
      const post = await db.getDocument(
        DATABASE_ID,
        POSTS_COLLECTION_ID,
        postId
      );

      // Get user profile to check permissions
      const profileResponse = await db.listDocuments(
        DATABASE_ID,
        PROFILES_COLLECTION_ID,
        [Query.equal('userId', user.$id)]
      );

      if (profileResponse.documents.length === 0) {
        throw new Error('Profile not found');
      }

      const profile = profileResponse.documents[0];

      // Check if user is the author or has admin privileges
      const authorProfileId =
        typeof post.authorProfileId === 'string'
          ? post.authorProfileId
          : post.authorProfileId.$id;

      if (authorProfileId !== profile.$id && profile.role !== 'OWNER') {
        throw new Error('You do not have permission to edit this post');
      }

      // Check if post is within 5 minutes of creation
      const postDate = new Date(post.$createdAt);
      const now = new Date();
      const diffInMinutes = (now.getTime() - postDate.getTime()) / (1000 * 60);

      if (diffInMinutes > 5) {
        throw new Error(
          'Posts can only be edited within 5 minutes of creation'
        );
      }

      // Update the post
      const updatedPost = await db.updateDocument(
        DATABASE_ID,
        POSTS_COLLECTION_ID,
        postId,
        {
          content,
          mediaUrl: mediaUrl || post.mediaUrl,
        }
      );

      // Get author profile for the response
      const authorProfile = await db.getDocument(
        DATABASE_ID,
        PROFILES_COLLECTION_ID,
        authorProfileId
      );

      return {
        id: updatedPost.$id,
        content: updatedPost.content,
        mediaUrl: updatedPost.mediaUrl,
        createdAt: updatedPost.$createdAt,
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
        isLiked: false,
        authorId: authorProfileId,
        notifyUsers: false,
      };
    } catch (error) {
      console.error('Error editing post:', error);
      throw error;
    }
  }

  static async deletePost(user: any, postId: string): Promise<void> {
    try {
      // Get the post to check permissions
      const post = await db.getDocument(
        DATABASE_ID,
        POSTS_COLLECTION_ID,
        postId
      );

      // Get user profile to check permissions
      const profileResponse = await db.listDocuments(
        DATABASE_ID,
        PROFILES_COLLECTION_ID,
        [Query.equal('userId', user.$id)]
      );

      if (profileResponse.documents.length === 0) {
        throw new Error('Profile not found');
      }

      const profile = profileResponse.documents[0];

      // Check if user is the author or has admin privileges
      const authorProfileId =
        typeof post.authorProfileId === 'string'
          ? post.authorProfileId
          : post.authorProfileId.$id;

      if (authorProfileId !== profile.$id && profile.role !== 'OWNER') {
        throw new Error('You do not have permission to delete this post');
      }

      // Delete the post
      await db.deleteDocument(DATABASE_ID, POSTS_COLLECTION_ID, postId);

      // If the post had an image, delete it from storage
      if (post.mediaUrl) {
        try {
          const fileId = post.mediaUrl.split('/').pop();
          if (fileId) {
            await storageClient.deleteFile(COMMUNITY_POSTS_BUCKET_ID, fileId);
          }
        } catch (error) {
          console.error('Error deleting post image:', error);
          // Don't throw error here as the post is already deleted
        }
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  }
}

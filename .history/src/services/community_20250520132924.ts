import { Models } from 'appwrite';
import { db } from '../api/appwrite-client';
import { DATABASE_ID } from '../constants/appwrite';

const POSTS_COLLECTION_ID = 'posts';
const TRAINERS_COLLECTION_ID = 'trainers';

export type Post = {
  id: string;
  content: string;
  image?: string;
  user: {
    id: string;
    name: string;
    image: string;
    badge: string;
  };
  likes: number;
  comments: number;
  isLiked: boolean;
  createdAt: Date;
};

export type Trainer = {
  id: string;
  name: string;
  image: string;
  specialty: string;
  rating: number;
  followers: number;
  isFollowing: boolean;
};

export class CommunityService {
  static async getCommunityPosts(
    user: Models.User<Models.Preferences> | null,
    gymId: string
  ): Promise<Post[]> {
    try {
      const response = await db.listDocuments(DATABASE_ID, POSTS_COLLECTION_ID, [
        Query.equal('gymId', gymId),
        Query.orderDesc('$createdAt'),
      ]);

      return response.documents.map((doc) => ({
        id: doc.$id,
        content: doc.content,
        image: doc.image,
        user: {
          id: doc.userId,
          name: doc.userName,
          image: doc.userImage,
          badge: doc.userBadge,
        },
        likes: doc.likes || 0,
        comments: doc.comments || 0,
        isLiked: doc.likedBy?.includes(user?.$id) || false,
        createdAt: new Date(doc.$createdAt),
      }));
    } catch (error) {
      console.error('Error fetching community posts:', error);
      throw error;
    }
  }

  static async getFeaturedTrainers(
    user: Models.User<Models.Preferences> | null,
    gymId: string
  ): Promise<Trainer[]> {
    try {
      const response = await db.listDocuments(
        DATABASE_ID,
        TRAINERS_COLLECTION_ID,
        [Query.equal('gymId', gymId)]
      );

      return response.documents.map((doc) => ({
        id: doc.$id,
        name: doc.name,
        image: doc.image,
        specialty: doc.specialty,
        rating: doc.rating || 0,
        followers: doc.followers || 0,
        isFollowing: doc.followers?.includes(user?.$id) || false,
      }));
    } catch (error) {
      console.error('Error fetching featured trainers:', error);
      throw error;
    }
  }

  static async createPost(
    user: Models.User<Models.Preferences> | null,
    content: string,
    image?: string,
    gymId: string
  ): Promise<Post> {
    if (!user) throw new Error('User not authenticated');

    try {
      // Get user profile to check role
      const profileResponse = await db.listDocuments(
        DATABASE_ID,
        'profiles',
        [Query.equal('userId', user.$id)]
      );

      if (profileResponse.documents.length === 0) {
        throw new Error('User profile not found');
      }

      const profile = profileResponse.documents[0];
      if (profile.role !== 'TRAINER' && profile.role !== 'OWNER') {
        throw new Error('Only trainers and owners can create posts');
      }

      const doc = await db.createDocument(DATABASE_ID, POSTS_COLLECTION_ID, 'unique()', {
        content,
        image,
        gymId,
        userId: user.$id,
        userName: user.name,
        userImage: profile.image || '',
        userBadge: profile.role,
        likes: 0,
        comments: 0,
        likedBy: [],
      });

      return {
        id: doc.$id,
        content: doc.content,
        image: doc.image,
        user: {
          id: doc.userId,
          name: doc.userName,
          image: doc.userImage,
          badge: doc.userBadge,
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

  static async likePost(
    user: Models.User<Models.Preferences> | null,
    postId: string,
    gymId: string
  ): Promise<void> {
    if (!user) throw new Error('User not authenticated');

    try {
      const post = await db.getDocument(DATABASE_ID, POSTS_COLLECTION_ID, postId);
      const likedBy = post.likedBy || [];

      if (likedBy.includes(user.$id)) {
        // Unlike
        await db.updateDocument(DATABASE_ID, POSTS_COLLECTION_ID, postId, {
          likes: post.likes - 1,
          likedBy: likedBy.filter((id: string) => id !== user.$id),
        });
      } else {
        // Like
        await db.updateDocument(DATABASE_ID, POSTS_COLLECTION_ID, postId, {
          likes: post.likes + 1,
          likedBy: [...likedBy, user.$id],
        });
      }
    } catch (error) {
      console.error('Error liking post:', error);
      throw error;
    }
  }

  static async commentOnPost(
    user: Models.User<Models.Preferences> | null,
    postId: string,
    content: string,
    gymId: string
  ): Promise<void> {
    if (!user) throw new Error('User not authenticated');

    try {
      const post = await db.getDocument(DATABASE_ID, POSTS_COLLECTION_ID, postId);
      await db.updateDocument(DATABASE_ID, POSTS_COLLECTION_ID, postId, {
        comments: post.comments + 1,
      });
    } catch (error) {
      console.error('Error commenting on post:', error);
      throw error;
    }
  }

  static async sharePost(
    user: Models.User<Models.Preferences> | null,
    postId: string,
    gymId: string
  ): Promise<void> {
    if (!user) throw new Error('User not authenticated');

    try {
      const post = await db.getDocument(DATABASE_ID, POSTS_COLLECTION_ID, postId);
      // Implement sharing logic here
    } catch (error) {
      console.error('Error sharing post:', error);
      throw error;
    }
  }

  static async followTrainer(
    user: Models.User<Models.Preferences> | null,
    trainerId: string,
    gymId: string
  ): Promise<void> {
    if (!user) throw new Error('User not authenticated');

    try {
      const trainer = await db.getDocument(
        DATABASE_ID,
        TRAINERS_COLLECTION_ID,
        trainerId
      );
      const followers = trainer.followers || [];

      if (followers.includes(user.$id)) {
        // Unfollow
        await db.updateDocument(DATABASE_ID, TRAINERS_COLLECTION_ID, trainerId, {
          followers: followers.filter((id: string) => id !== user.$id),
        });
      } else {
        // Follow
        await db.updateDocument(DATABASE_ID, TRAINERS_COLLECTION_ID, trainerId, {
          followers: [...followers, user.$id],
        });
      }
    } catch (error) {
      console.error('Error following trainer:', error);
      throw error;
    }
  }
} 
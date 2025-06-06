import { Query } from 'appwrite';
import {
  DATABASE_ID,
  db,
  PLANS_COLLECTION_ID,
  PROFILES_COLLECTION_ID,
  SUBSCRIPTIONS_COLLECTION_ID,
} from '../api/appwrite-client';

export type Plan = {
  id: string;
  name: string;
  durationDays: number;
  price: number;
  tenantId: string;
};

export type Subscription = {
  id: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  profileId: string;
  planId: string;
  tenantId: string;
};

export class PlanService {
  static async getActiveSubscription(user: any): Promise<Subscription | null> {
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get user's profile
      const profilesResponse = await db.listDocuments(
        DATABASE_ID,
        PROFILES_COLLECTION_ID,
        [Query.equal('userId', user.$id)]
      );

      if (profilesResponse.documents.length === 0) {
        throw new Error('User profile not found');
      }

      const userProfileId = profilesResponse.documents[0].$id;

      // Get active subscription
      const now = new Date().toISOString();
      const subscriptionsResponse = await db.listDocuments(
        DATABASE_ID,
        SUBSCRIPTIONS_COLLECTION_ID,
        [
          Query.equal('profileId', userProfileId),
          Query.equal('isActive', true),
          Query.greaterThan('endDate', now),
        ]
      );

      if (subscriptionsResponse.documents.length === 0) {
        return null;
      }

      const subscription = subscriptionsResponse.documents[0];
      return {
        id: subscription.$id,
        startDate: new Date(subscription.startDate),
        endDate: new Date(subscription.endDate),
        isActive: subscription.isActive,
        profileId: subscription.profileId,
        planId: subscription.planId,
        tenantId: subscription.tenantId,
      };
    } catch (error) {
      console.error('Error getting active subscription:', error);
      throw error;
    }
  }

  static async getPlan(planId: string): Promise<Plan | null> {
    try {
      if (!planId || planId.length > 36) {
        console.error('Invalid plan ID:', planId);
        return null;
      }

      const planResponse = await db.getDocument(
        DATABASE_ID,
        PLANS_COLLECTION_ID,
        planId
      );

      return {
        id: planResponse.$id,
        name: planResponse.name,
        durationDays: planResponse.durationDays,
        price: planResponse.price,
        tenantId: planResponse.tenantId,
      };
    } catch (error) {
      console.error('Error getting plan:', error);
      return null;
    }
  }

  static async getAvailablePlans(tenantId: string): Promise<Plan[]> {
    try {
      const plansResponse = await db.listDocuments(
        DATABASE_ID,
        PLANS_COLLECTION_ID,
        [Query.equal('tenantId', tenantId)]
      );

      return plansResponse.documents.map((plan) => ({
        id: plan.$id,
        name: plan.name,
        durationDays: plan.durationDays,
        price: plan.price,
        tenantId: plan.tenantId,
      }));
    } catch (error) {
      console.error('Error getting available plans:', error);
      throw error;
    }
  }
}

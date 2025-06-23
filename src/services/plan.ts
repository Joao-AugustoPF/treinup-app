import { Query } from 'appwrite';
import {
    ACADEMIES_COLLECTION_ID,
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

export type Academy = {
  id: string;
  name: string;
  phone?: string;
  tenantId: string;
};

// Default academy info as fallback
const DEFAULT_ACADEMY: Academy = {
  id: 'default',
  name: 'Lidiane Moretto - Estúdio Personal',
  phone: '(11) 99999-9999',
  tenantId: '6821988e0022060185a9',
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

      // Validate planId relationship
      if (
        !subscription.planId ||
        typeof subscription.planId !== 'object' ||
        !subscription.planId.$id
      ) {
        console.error('Invalid plan ID in subscription:', subscription.planId);
        return null;
      }

      return {
        id: subscription.$id,
        startDate: new Date(subscription.startDate),
        endDate: new Date(subscription.endDate),
        isActive: subscription.isActive,
        profileId: subscription.profileId,
        planId: subscription.planId.$id,
        tenantId: subscription.tenantId,
      };
    } catch (error) {
      console.error('Error getting active subscription:', error);
      throw error;
    }
  }

  static async hasActivePlan(user: any): Promise<boolean> {
    try {
      const subscription = await this.getActiveSubscription(user);
      return subscription !== null;
    } catch (error) {
      console.error('Error checking active plan:', error);
      return false;
    }
  }

  static async getAcademyByTenantId(tenantId: string): Promise<Academy | null> {
    try {
      const academiesResponse = await db.listDocuments(
        DATABASE_ID,
        ACADEMIES_COLLECTION_ID,
        [Query.equal('tenantId', tenantId)]
      );

      if (academiesResponse.documents.length === 0) {
        console.log('No academy found for tenant ID:', tenantId);
        return DEFAULT_ACADEMY;
      }

      const academy = academiesResponse.documents[0];
      return {
        id: academy.$id,
        name: academy.name,
        phone: academy.phone,
        tenantId: academy.tenantId,
      };
    } catch (error) {
      console.error('Error getting academy by tenant ID:', error);
      // Return default academy as fallback
      return DEFAULT_ACADEMY;
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

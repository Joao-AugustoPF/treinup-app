import { createContext, useContext, useEffect, useState } from 'react';
import { PlanService } from '../services/plan';
import { useAuth } from './AuthContext';
import { useGym } from './GymContext';

export type UserPlan = {
  id: string;
  name: string;
  price: number;
  color: string;
  features: string[];
  expiresAt: Date;
};

type PlanContextType = {
  userPlan: UserPlan | null;
};

const PlanContext = createContext<PlanContextType>({
  userPlan: null,
});

export function PlanProvider({ children }: { children: React.ReactNode }) {
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null);
  const { user } = useAuth();
  const { currentGym } = useGym();

  useEffect(() => {
    loadUserPlan();
  }, [user, currentGym]);

  const loadUserPlan = async () => {
    if (!user || !currentGym) return;

    try {
      const subscription = await PlanService.getActiveSubscription(user);
      if (!subscription) {
        setUserPlan(null);
        return;
      }

      const plan = await PlanService.getPlan(subscription.planId);
      if (!plan) {
        setUserPlan(null);
        return;
      }

      // Map plan to UserPlan format
      setUserPlan({
        id: plan.id,
        name: plan.name,
        price: plan.price,
        color: 'rgba(255,20,147,0.7)', // Default color, can be customized per plan
        features: [], // Features can be added to the plan in Appwrite
        expiresAt: subscription.endDate,
      });
    } catch (error) {
      console.error('Error loading user plan:', error);
      setUserPlan(null);
    }
  };

  return (
    <PlanContext.Provider value={{ userPlan }}>{children}</PlanContext.Provider>
  );
}

export const usePlan = () => useContext(PlanContext);

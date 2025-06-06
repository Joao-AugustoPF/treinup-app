import { createContext, useContext, useState } from 'react';

export type PlanTier = 'essential' | 'performance' | 'elite';

export type Plan = {
  id: PlanTier;
  name: string;
  price: string;
  color: string;
  features: string[];
  expiresAt: Date;
  transferredFrom?: string;
};

export const PLANS: Record<PlanTier, Omit<Plan, 'expiresAt'>> = {
  essential: {
    id: 'essential',
    name: 'Essential Fit',
    price: '29.99',
    color: '#00E6C3',
    features: [
      'Basic workout tracking',
      'Standard exercises',
      'Community access',
    ],
  },
  performance: {
    id: 'performance',
    name: 'Performance Pro',
    price: '49.99',
    color: '#FF6B6B',
    features: [
      'Advanced workout tracking',
      'Custom exercise plans',
      'Priority support',
      'Progress analytics',
    ],
  },
  elite: {
    id: 'elite',
    name: 'Elite Max',
    price: '99.99',
    color: '#FFD93D',
    features: [
      'Personal trainer access',
      'Nutrition planning',
      'Video consultations',
      'Premium analytics',
      'Exclusive content',
    ],
  },
};

type PlanContextType = {
  userPlan: Plan | null;
  transferPlan: (toUserId: string) => Promise<void>;
  upgradePlan: (newPlanId: PlanTier) => Promise<void>;
  cancelPlan: () => Promise<void>;
};

const PlanContext = createContext<PlanContextType>({
  userPlan: null,
  transferPlan: async () => {},
  upgradePlan: async () => {},
  cancelPlan: async () => {},
});

// Mock data for the current user's plan
const MOCK_USER_PLAN: Plan = {
  ...PLANS.essential,
  expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
};

export function PlanProvider({ children }: { children: React.ReactNode }) {
  const [userPlan, setUserPlan] = useState<Plan | null>(MOCK_USER_PLAN);

  const transferPlan = async (toUserId: string) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setUserPlan(null);
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    }
  };

  const upgradePlan = async (newPlanId: PlanTier) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setUserPlan({
        ...PLANS[newPlanId],
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    }
  };

  const cancelPlan = async () => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setUserPlan(null);
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    }
  };

  return (
    <PlanContext.Provider
      value={{ userPlan, transferPlan, upgradePlan, cancelPlan }}
    >
      {children}
    </PlanContext.Provider>
  );
}

export const usePlan = () => useContext(PlanContext);

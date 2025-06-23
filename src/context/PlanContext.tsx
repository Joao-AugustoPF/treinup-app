import { createContext, useContext, useEffect, useState } from 'react';
import { Academy, PlanService } from '../services/plan';
import { useAuth } from './AuthContext';
import { useGym } from './GymContext';
import { useProfile } from './ProfileContext';

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
  hasActivePlan: boolean;
  academyInfo: Academy | null;
  loading: boolean;
  checkPlanStatus: () => Promise<void>;
};

const PlanContext = createContext<PlanContextType>({
  userPlan: null,
  hasActivePlan: false,
  academyInfo: null,
  loading: true,
  checkPlanStatus: async () => {},
});

// Default tenant ID from the appwrite.json
const DEFAULT_TENANT_ID = '6821988e0022060185a9';

export function PlanProvider({ children }: { children: React.ReactNode }) {
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null);
  const [hasActivePlan, setHasActivePlan] = useState(false);
  const [academyInfo, setAcademyInfo] = useState<Academy | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { currentGym } = useGym();
  const { profile } = useProfile();

  const checkPlanStatus = async () => {
    if (!user) {
      setUserPlan(null);
      setHasActivePlan(false);
      setAcademyInfo(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Check if user has OWNER role - they don't need a plan
      if (profile?.role === 'OWNER' || profile?.role === 'TRAINER') {
        setHasActivePlan(true);
        setUserPlan(null);
        setAcademyInfo(null);
        setLoading(false);
        return;
      }
      
      // Check if user has active plan
      const hasPlan = await PlanService.hasActivePlan(user);
      setHasActivePlan(hasPlan);

      if (hasPlan) {
        // Load plan details
        const subscription = await PlanService.getActiveSubscription(user);
        if (subscription) {
          const plan = await PlanService.getPlan(subscription.planId);
          if (plan) {
            setUserPlan({
              id: plan.id,
              name: plan.name,
              price: plan.price,
              color: 'rgba(255,20,147,0.7)', // Default color, can be customized per plan
              features: [], // Features can be added to the plan in Appwrite
              expiresAt: subscription.endDate,
            });
          }
        }
      } else {
        setUserPlan(null);
        
        // Get academy info for users without plan
        const tenantId = currentGym?.tenantId || DEFAULT_TENANT_ID;
        const academy = await PlanService.getAcademyByTenantId(tenantId);
        setAcademyInfo(academy);
      }
    } catch (error) {
      console.error('Error checking plan status:', error);
      setHasActivePlan(false);
      setUserPlan(null);
      
      // Try to get academy info even if plan check fails
      try {
        const tenantId = currentGym?.tenantId || DEFAULT_TENANT_ID;
        const academy = await PlanService.getAcademyByTenantId(tenantId);
        setAcademyInfo(academy);
      } catch (academyError) {
        console.error('Error getting academy info:', academyError);
        setAcademyInfo(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkPlanStatus();
  }, [user, currentGym, profile]);

  return (
    <PlanContext.Provider value={{ 
      userPlan, 
      hasActivePlan, 
      academyInfo, 
      loading, 
      checkPlanStatus 
    }}>
      {children}
    </PlanContext.Provider>
  );
}

export function usePlan() {
  const context = useContext(PlanContext);
  if (context === undefined) {
    throw new Error('usePlan must be used within a PlanProvider');
  }
  return context;
}

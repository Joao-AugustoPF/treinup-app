export type ClassType = 'yoga' | 'pilates' | 'zumba' | 'functional' | 'jump';

export type Gym = {
  id: string;
  name: string;
  logo: string;
  coverImage: string;
  address: string;
  description: string;
  features: string[];
  plans: GymPlan[];
  rating: number;
  reviews: number;
  isDefault?: boolean;
  isSubscribed?: boolean;
};

export type GymPlan = {
  id: string;
  name: string;
  price: number;
  duration: string;
  features: string[];
  color: string;
};

export type UserGymSubscription = {
  id: string;
  gymId: string;
  planId: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  autoRenew: boolean;
};

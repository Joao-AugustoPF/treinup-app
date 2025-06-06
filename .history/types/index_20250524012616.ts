export type ClassType = 'yoga' | 'pilates' | 'zumba' | 'funcional' | 'jump';

export type ClassStatus =
  | 'scheduled'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export type Class = {
  id: string;
  type: ClassType;
  name: string;
  trainerId: {
    name: string;
    imageUrl: string;
    id: string;
    email: string;
  };
  start: string;
  end: string;
  duration: string;
  capacity: number;
  bookingsCount: number;
  location: string;
  imageUrl: string;
  isCheckedIn?: boolean;
  status: ClassStatus;
};

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

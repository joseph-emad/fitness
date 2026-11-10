export type UserRole = 'USER' | 'COACH';

export interface UserProfile {
  id: string;
  keycloakId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  roleChosen: boolean;
}

export const ACTIVITY_TYPES = [
  'RUNNING',
  'WALKING',
  'CYCLING',
  'SWIMMING',
  'WEIGHT_TRAINING',
  'YOGA',
  'HIIT',
  'CARDIO',
  'STRETCHING',
  'OTHER',
] as const;

export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export interface Exercise {
  name: string;
  sets: number;
  reps: number;
  weightKg: number;
  restSeconds: number;
}

export interface ActivityPayload {
  type: ActivityType;
  duration: number;
  caloriesBurned: number;
  additionalMetrics: Record<string, unknown>;
  exercises?: Exercise[];
}

export interface Activity extends ActivityPayload {
  id: string;
  userId: string;
  startTime?: string;
  createdAt?: string;
}

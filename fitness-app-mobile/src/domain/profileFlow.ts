import { UserProfile } from '../types';

export type ProfileDestination = 'roleSelection' | 'activityLog';

export const getProfileDestination = (profile: UserProfile): ProfileDestination =>
  profile.roleChosen ? 'activityLog' : 'roleSelection';

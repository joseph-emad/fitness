import { describe, expect, it } from 'vitest';
import { getProfileDestination } from './profileFlow';
import { UserProfile } from '../types';

const profile: UserProfile = {
  id: 'profile-id',
  keycloakId: 'keycloak-id',
  email: 'member@example.test',
  role: 'USER',
  roleChosen: false,
};

describe('role selection flow', () => {
  it('requires a choice for new users and never offers to change a saved role', () => {
    expect(getProfileDestination(profile)).toBe('roleSelection');
    expect(getProfileDestination({ ...profile, roleChosen: true })).toBe('activityLog');
  });
});

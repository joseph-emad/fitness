import { describe, expect, it, vi } from 'vitest';
import { ApiRequest, createApiClient, parseApiResponse } from './client';

describe('mobile API contracts and errors', () => {
  it('uses the self-profile, permanent-role, and activity endpoint contracts', async () => {
    const calls: Array<{ path: string; init?: RequestInit }> = [];
    const request: ApiRequest = async <T,>(path: string, init?: RequestInit): Promise<T> => {
      calls.push({ path, init });
      return {} as T;
    };
    const api = createApiClient(request);

    await api.getProfile('keycloak-user');
    await api.chooseRole('COACH');
    await api.addActivity({
      type: 'RUNNING',
      duration: 12,
      caloriesBurned: 100,
      additionalMetrics: {},
    });

    expect(calls.map(({ path }) => path)).toEqual([
      'users/keycloak-user',
      'users/me/role',
      'activities',
    ]);
    expect(calls[1]?.init).toMatchObject({
      method: 'PUT',
      body: JSON.stringify({ role: 'COACH' }),
    });
    expect(calls[2]?.init).toMatchObject({
      method: 'POST',
      body: JSON.stringify({
        type: 'RUNNING',
        duration: 12,
        caloriesBurned: 100,
        additionalMetrics: {},
      }),
    });
  });

  it('surfaces server validation details and handles empty success responses', async () => {
    await expect(parseApiResponse(new Response(
      JSON.stringify({ detail: 'Duration is invalid.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    ))).rejects.toMatchObject({ message: 'Duration is invalid.', status: 400 });

    await expect(parseApiResponse(new Response(null, { status: 204 }))).resolves.toBeUndefined();
  });
});

import { config } from '../config';
import { Activity, ActivityPayload, UserProfile, UserRole } from '../types';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export type ApiRequest = <T>(path: string, init?: RequestInit) => Promise<T>;

export async function parseApiResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as T;
  }
  if (!response.ok) {
    let detail = '';
    try {
      const body = await response.json() as { message?: string; detail?: string; error?: string };
      detail = body.message ?? body.detail ?? body.error ?? '';
    } catch {
      detail = '';
    }
    throw new ApiError(detail || `Request failed (${response.status}).`, response.status);
  }
  return await response.json() as T;
}

const jsonRequest = (method: string, body?: unknown): RequestInit => ({
  method,
  ...(body === undefined
    ? {}
    : {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
});

export const createApiClient = (request: ApiRequest) => ({
  getProfile: (userId: string) => request<UserProfile>(`users/${encodeURIComponent(userId)}`),
  chooseRole: (role: UserRole) => request<UserProfile>('users/me/role', jsonRequest('PUT', { role })),
  getActivities: () => request<Activity[]>('activities'),
  addActivity: (activity: ActivityPayload) => request<Activity>('activities', jsonRequest('POST', activity)),
});

export const getApiUrl = (path: string) => new URL(path.replace(/^\/+/, ''), config.apiBaseUrl).toString();

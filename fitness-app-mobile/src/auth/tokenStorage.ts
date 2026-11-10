import * as SecureStore from 'expo-secure-store';
import { SessionTokens } from './sessionState';

const ACCESS_TOKEN_KEY = 'fitness.access-token';
const REFRESH_TOKEN_KEY = 'fitness.refresh-token';
const ID_TOKEN_KEY = 'fitness.id-token';
const EXPIRES_AT_KEY = 'fitness.expires-at';
const TOKEN_TYPE_KEY = 'fitness.token-type';

const keys = [ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, ID_TOKEN_KEY, EXPIRES_AT_KEY, TOKEN_TYPE_KEY];

export const saveTokens = async (tokens: SessionTokens) => {
  try {
    await Promise.all([
      SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokens.accessToken),
      SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken),
      SecureStore.setItemAsync(ID_TOKEN_KEY, tokens.idToken),
      SecureStore.setItemAsync(EXPIRES_AT_KEY, String(tokens.expiresAt)),
      SecureStore.setItemAsync(TOKEN_TYPE_KEY, tokens.tokenType),
    ]);
  } catch (error) {
    await clearTokens();
    throw error;
  }
};

export const readTokens = async (): Promise<SessionTokens | null> => {
  const [accessToken, refreshToken, idToken, expiresAt, tokenType] = await Promise.all(
    keys.map((key) => SecureStore.getItemAsync(key)),
  );
  if (!accessToken || !refreshToken || !idToken || !expiresAt || !tokenType) {
    return null;
  }
  const expiry = Number(expiresAt);
  if (!Number.isFinite(expiry)) {
    return null;
  }
  return { accessToken, refreshToken, idToken, expiresAt: expiry, tokenType };
};

export const clearTokens = async () => {
  await Promise.all(keys.map((key) => SecureStore.deleteItemAsync(key)));
};

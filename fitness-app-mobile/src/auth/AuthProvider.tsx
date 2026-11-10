import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import React, { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { config, keycloakIssuer } from '../config';
import { ApiError, createApiClient, getApiUrl, parseApiResponse } from '../api/client';
import { clearTokens, readTokens, saveTokens } from './tokenStorage';
import { initialSessionState, SessionTokens, sessionReducer } from './sessionState';

WebBrowser.maybeCompleteAuthSession();

interface AuthContextValue {
  tokens: SessionTokens | null;
  isLoading: boolean;
  isBusy: boolean;
  message: string;
  api: ReturnType<typeof createApiClient>;
  signIn: (register?: boolean) => Promise<void>;
  signOut: () => Promise<void>;
  clearMessage: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const toSessionTokens = (
  response: AuthSession.TokenResponse,
  previous?: SessionTokens,
): SessionTokens => {
  const accessToken = response.accessToken;
  const refreshToken = response.refreshToken ?? previous?.refreshToken;
  const idToken = response.idToken ?? previous?.idToken;
  const expiresIn = response.expiresIn;
  if (!accessToken || !refreshToken || !idToken || !expiresIn) {
    throw new Error('Keycloak returned an incomplete token response.');
  }
  return {
    accessToken,
    refreshToken,
    idToken,
    expiresAt: Date.now() + expiresIn * 1000,
    tokenType: response.tokenType ?? 'Bearer',
  };
};

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, dispatch] = useReducer(sessionReducer, initialSessionState);
  const [discovery, setDiscovery] = useState<AuthSession.DiscoveryDocument | null>(null);
  const [discoveryLoaded, setDiscoveryLoaded] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [message, setMessage] = useState('');
  const tokensRef = useRef<SessionTokens | null>(null);
  const sessionGeneration = useRef(0);
  const refreshPromise = useRef<{ generation: number; promise: Promise<SessionTokens> } | null>(null);

  const commitTokens = useCallback(async (
    tokens: SessionTokens,
    action: 'signIn' | 'refresh',
    generation: number,
  ) => {
    await saveTokens(tokens);
    if (sessionGeneration.current !== generation) {
      await clearTokens();
      throw new ApiError('The session ended before the new credentials could be saved.');
    }
    tokensRef.current = tokens;
    setMessage('');
    dispatch({ type: action, tokens });
  }, []);

  const endLocalSession = useCallback(async (expiredMessage = '') => {
    sessionGeneration.current += 1;
    refreshPromise.current = null;
    tokensRef.current = null;
    dispatch(expiredMessage ? { type: 'expired', message: expiredMessage } : { type: 'signOut' });
    let cleanupFailed = false;
    try {
      await clearTokens();
    } catch {
      cleanupFailed = true;
    }
    if (cleanupFailed) {
      const cleanupMessage = 'The app signed out, but could not clear every credential from secure storage.';
      setMessage(cleanupMessage);
    }
  }, []);

  const refreshSession = useCallback(async (oldTokens: SessionTokens): Promise<SessionTokens> => {
    if (!discovery) {
      throw new ApiError('Authentication service is unavailable. Please try again.');
    }
    const activeTokens = tokensRef.current;
    if (!activeTokens) {
      throw new ApiError('Your session has ended. Sign in again.');
    }
    if (activeTokens !== oldTokens && activeTokens.expiresAt > Date.now()) {
      return activeTokens;
    }
    const generation = sessionGeneration.current;
    const existingRefresh = refreshPromise.current;
    if (existingRefresh?.generation === generation) {
      return existingRefresh.promise;
    }
    const pending = Promise.resolve().then(async () => {
      try {
        const response = await AuthSession.refreshAsync({
          clientId: config.keycloakClientId,
          refreshToken: activeTokens.refreshToken,
        }, discovery);
        const freshTokens = toSessionTokens(response, activeTokens);
        await commitTokens(freshTokens, 'refresh', generation);
        return freshTokens;
      } catch (error) {
        if (sessionGeneration.current !== generation) {
          throw new ApiError('Your session has ended. Sign in again.');
        }
        if (error instanceof AuthSession.TokenError && error.code === 'invalid_grant') {
          await endLocalSession('Your session expired. Sign in again to continue.');
          throw new ApiError('Your session expired. Sign in again to continue.');
        }
        setMessage('Could not refresh your session. Check your connection and try again.');
        throw new ApiError('Could not refresh your session. Check your connection and try again.');
      } finally {
        if (refreshPromise.current?.promise === pending) {
          refreshPromise.current = null;
        }
      }
    });
    refreshPromise.current = { generation, promise: pending };
    return pending;
  }, [commitTokens, discovery, endLocalSession]);

  const getValidTokens = useCallback(async (): Promise<SessionTokens> => {
    const currentTokens = tokensRef.current;
    if (!currentTokens) {
      throw new ApiError('Your session has ended. Sign in again.');
    }
    if (currentTokens.expiresAt > Date.now() + 60_000) {
      return currentTokens;
    }
    try {
      return await refreshSession(currentTokens);
    } catch (error) {
      if (tokensRef.current === currentTokens && currentTokens.expiresAt > Date.now()) {
        return currentTokens;
      }
      throw error;
    }
  }, [refreshSession]);

  useEffect(() => {
    let active = true;
    AuthSession.fetchDiscoveryAsync(keycloakIssuer)
      .then((document) => {
        if (active) {
          setDiscovery(document);
        }
      })
      .catch(() => {
        if (active) {
          setMessage('Could not connect to Keycloak. Check the configured URL and try again.');
        }
      })
      .finally(() => {
        if (active) {
          setDiscoveryLoaded(true);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    readTokens()
      .then((storedTokens) => {
        if (active) {
          tokensRef.current = storedTokens;
          dispatch({ type: 'restore', tokens: storedTokens });
        }
      })
      .catch(() => {
        if (active) {
          setMessage('Could not restore the saved sign-in. Please sign in again.');
          tokensRef.current = null;
          dispatch({ type: 'restore', tokens: null });
        }
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const currentTokens = session.tokens;
    if (session.status !== 'signedIn' || !currentTokens) {
      return undefined;
    }
    const delay = Math.max(0, currentTokens.expiresAt - Date.now() - 60_000);
    const timer = setTimeout(() => {
      void refreshSession(currentTokens).catch(() => undefined);
    }, delay);
    return () => clearTimeout(timer);
  }, [refreshSession, session]);

  const signIn = useCallback(async (register = false) => {
    if (!discovery) {
      setMessage('Could not connect to Keycloak. Check the configured URL and try again.');
      return;
    }
    const generation = sessionGeneration.current;
    setIsBusy(true);
    setMessage('');
    try {
      const request = new AuthSession.AuthRequest({
        clientId: config.keycloakClientId,
        redirectUri: config.redirectUri,
        responseType: AuthSession.ResponseType.Code,
        scopes: ['openid', 'profile', 'email', 'offline_access'],
        usePKCE: true,
        extraParams: register ? { kc_action: 'register' } : {},
      });
      const result = await request.promptAsync(discovery);
      if (result.type === 'cancel' || result.type === 'dismiss') {
        return;
      }
      if (result.type !== 'success' || !result.params.code || !request.codeVerifier) {
        throw new Error('Authentication did not return an authorization code.');
      }
      const response = await AuthSession.exchangeCodeAsync({
        clientId: config.keycloakClientId,
        code: result.params.code,
        redirectUri: config.redirectUri,
        extraParams: { code_verifier: request.codeVerifier },
      }, discovery);
      await commitTokens(toSessionTokens(response), 'signIn', generation);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Sign-in failed. Please try again.');
    } finally {
      setIsBusy(false);
    }
  }, [commitTokens, discovery]);

  const signOut = useCallback(async () => {
    const currentTokens = tokensRef.current;
    setMessage('');
    await endLocalSession();
    try {
      if (discovery?.endSessionEndpoint && currentTokens?.idToken) {
        const logoutUrl = new URL(discovery.endSessionEndpoint);
        logoutUrl.searchParams.set('id_token_hint', currentTokens.idToken);
        logoutUrl.searchParams.set('post_logout_redirect_uri', config.logoutRedirectUri);
        await WebBrowser.openAuthSessionAsync(logoutUrl.toString(), config.logoutRedirectUri);
      }
    } catch {
      setMessage('Could not reach Keycloak to end its browser session. Local app credentials were cleared.');
    }
  }, [discovery, endLocalSession]);

  const request = useCallback(async <T,>(path: string, init?: RequestInit): Promise<T> => {
    const send = async (accessToken: string) => fetch(getApiUrl(path), {
      ...init,
      headers: {
        Accept: 'application/json',
        ...init?.headers,
        Authorization: `Bearer ${accessToken}`,
      },
    });

    let activeTokens = await getValidTokens();
    let response = await send(activeTokens.accessToken);
    if (response.status === 401 && activeTokens.refreshToken) {
      activeTokens = await refreshSession(activeTokens);
      response = await send(activeTokens.accessToken);
    }
    if (response.status === 401) {
      await endLocalSession('Your session expired. Sign in again to continue.');
      throw new ApiError('Your session expired. Sign in again to continue.', 401);
    }
    return parseApiResponse<T>(response);
  }, [endLocalSession, getValidTokens, refreshSession]);

  const api = useMemo(() => createApiClient(request), [request]);
  const value = useMemo<AuthContextValue>(() => ({
    tokens: session.tokens,
    isLoading: session.status === 'loading' || !discoveryLoaded,
    isBusy,
    message: message || session.message,
    api,
    signIn,
    signOut,
    clearMessage: () => setMessage(''),
  }), [api, discoveryLoaded, isBusy, message, session, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }
  return context;
};

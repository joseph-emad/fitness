import { describe, expect, it } from 'vitest';
import { initialSessionState, SessionTokens, sessionReducer } from './sessionState';

const tokens: SessionTokens = {
  accessToken: 'access',
  refreshToken: 'refresh',
  idToken: 'identity',
  expiresAt: 1234,
  tokenType: 'Bearer',
};

describe('session transitions', () => {
  it('restores a saved session and updates tokens after refresh', () => {
    const restored = sessionReducer(initialSessionState, { type: 'restore', tokens });
    expect(restored).toEqual({ status: 'signedIn', tokens, message: '' });

    const refreshedTokens = { ...tokens, accessToken: 'new-access' };
    expect(sessionReducer(restored, { type: 'refresh', tokens: refreshedTokens }).tokens).toEqual(refreshedTokens);
  });

  it('clears local session state on logout and token expiry', () => {
    const signedIn = sessionReducer(initialSessionState, { type: 'signIn', tokens });
    expect(sessionReducer(signedIn, { type: 'signOut' })).toEqual({
      status: 'signedOut',
      tokens: null,
      message: '',
    });
    expect(sessionReducer(signedIn, { type: 'expired', message: 'Please sign in again.' })).toEqual({
      status: 'signedOut',
      tokens: null,
      message: 'Please sign in again.',
    });
  });
});

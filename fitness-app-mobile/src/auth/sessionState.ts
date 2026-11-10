export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
  idToken: string;
  expiresAt: number;
  tokenType: string;
}

export type SessionState =
  | { status: 'loading'; tokens: null; message: string }
  | { status: 'signedOut'; tokens: null; message: string }
  | { status: 'signedIn'; tokens: SessionTokens; message: string };

export type SessionAction =
  | { type: 'restore'; tokens: SessionTokens | null }
  | { type: 'signIn'; tokens: SessionTokens }
  | { type: 'refresh'; tokens: SessionTokens }
  | { type: 'signOut' }
  | { type: 'expired'; message: string };

export const initialSessionState: SessionState = {
  status: 'loading',
  tokens: null,
  message: '',
};

export const sessionReducer = (state: SessionState, action: SessionAction): SessionState => {
  switch (action.type) {
    case 'restore':
      return action.tokens
        ? { status: 'signedIn', tokens: action.tokens, message: '' }
        : { status: 'signedOut', tokens: null, message: '' };
    case 'signIn':
    case 'refresh':
      return { status: 'signedIn', tokens: action.tokens, message: '' };
    case 'signOut':
      return { status: 'signedOut', tokens: null, message: '' };
    case 'expired':
      return { status: 'signedOut', tokens: null, message: action.message };
    default:
      return state;
  }
};

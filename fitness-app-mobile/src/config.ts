const trimTrailingSlashes = (value: string) => value.replace(/\/+$/, '');

export const config = {
  apiBaseUrl: `${trimTrailingSlashes(process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080/api')}/`,
  keycloakUrl: trimTrailingSlashes(process.env.EXPO_PUBLIC_KEYCLOAK_URL ?? 'http://localhost:8181'),
  keycloakRealm: process.env.EXPO_PUBLIC_KEYCLOAK_REALM ?? 'fitness-oauth2',
  keycloakClientId: process.env.EXPO_PUBLIC_KEYCLOAK_CLIENT_ID ?? 'fitness-mobile',
  redirectUri: 'fitness-mobile://oauth/callback',
  logoutRedirectUri: 'fitness-mobile://oauth/callback',
};

export const keycloakIssuer = `${config.keycloakUrl}/realms/${config.keycloakRealm}`;

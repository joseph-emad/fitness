const keycloakUrl = import.meta.env.VITE_KEYCLOAK_URL ?? 'http://localhost:8181'
const keycloakRealm = import.meta.env.VITE_KEYCLOAK_REALM ?? 'fitness-oauth2'

export const authConfig = {
    clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID ?? 'oauth2-pkce-client',
    authorizationEndpoint: `${keycloakUrl}/realms/${keycloakRealm}/protocol/openid-connect/auth`,
    tokenEndpoint: `${keycloakUrl}/realms/${keycloakRealm}/protocol/openid-connect/token`,
    redirectUri: 'http://localhost:5173',
    logoutEndpoint: `${keycloakUrl}/realms/${keycloakRealm}/protocol/openid-connect/logout`,
    logoutRedirect: 'http://localhost:5173',
    scope: 'openid profile email offline_access',
    onRefreshTokenExpire: (event) => event.logIn(),
}
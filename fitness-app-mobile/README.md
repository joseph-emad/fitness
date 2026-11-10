# Fitness mobile app

The Expo app is a native iOS/Android client for the existing Fitness API. It supports Keycloak sign-in/sign-up, permanent role selection, activity history, and activity entry. It does not work offline and does not include coaching workflows.

## Requirements and start

- Node.js `>=22.13.0` and npm
- Docker Desktop/Compose for the API, databases, and Keycloak (`docker compose up --build` from the repository root)
- Android Studio and an Android SDK for Android development builds
- macOS with Xcode for local iOS builds; Windows developers can use an EAS remote iOS build

Copy `.env.example` to `.env`, choose the API and Keycloak addresses for the target device (see below), then:

```powershell
Copy-Item .env.example .env
npm ci
npm run typecheck
npm test
npm run android:device
```

`npm run ios:device` requires macOS and Xcode. OAuth uses the `fitness-mobile://oauth/callback` app link and the system authentication browser, so use the native development build; Expo Go does not register this redirect. Rebuild the app after changing its URL or local HTTP configuration.

## Local API and Keycloak addresses

The mobile app and Keycloak-issued tokens must agree on the Keycloak URL. Set the same externally reachable Keycloak base URL in the root `.env` as `KEYCLOAK_PUBLIC_URL` and this app's `EXPO_PUBLIC_KEYCLOAK_URL`. Compose configures both Keycloak's advertised hostname and the gateway's expected JWT issuer from `KEYCLOAK_PUBLIC_URL`; the gateway continues validating the issuer and retrieves signing keys over the Docker network.

| Target | `EXPO_PUBLIC_API_URL` | `KEYCLOAK_PUBLIC_URL` and `EXPO_PUBLIC_KEYCLOAK_URL` |
| --- | --- | --- |
| iOS simulator on the Mac running Compose | `http://localhost:8080/api` | `http://localhost:8181` |
| Android emulator | `http://10.0.2.2:8080/api` | `http://10.0.2.2:8181` |
| Physical device | `http://<computer-LAN-host-or-IP>:8080/api` | `http://<computer-LAN-host-or-IP>:8181` |

For a physical device, use a hostname/IP reachable from that device, keep both devices on a network that permits the connection, and allow inbound ports `8080` and `8181` through the development computer's firewall. Avoid `localhost` on a physical device: it points back to the phone. For Android emulator, `10.0.2.2` is the Android emulator's host-machine alias. iOS simulator networking follows the Mac host.

When using an address other than localhost, set e.g. `KEYCLOAK_PUBLIC_URL=http://192.168.1.25:8181` in the root `.env` and set `EXPO_PUBLIC_KEYCLOAK_URL` to that same value in this app's `.env`. Recreate the Compose services after changing the root value:

```powershell
docker compose up --build
```

The app's local `.env.example` enables `EXPO_PUBLIC_ALLOW_INSECURE_HTTP=true` for local development. It permits Android cleartext traffic and adds iOS ATS exceptions for the configured local hosts in that development build only. Do not enable the flag in deployed builds; use HTTPS instead. Never change or disable gateway issuer/JWT validation to resolve a networking problem.

## Keycloak client

The realm import defines a separate public client, `fitness-mobile`; it uses standard authorization code flow, PKCE S256, no client secret, and the exact callback `fitness-mobile://oauth/callback`. Login and registration run in the system browser and request `openid profile email offline_access`. The gateway requires the signed token's `sub` and `email` claims; the mobile client requests the standard Keycloak scopes that provide them.

Compose imports the client from `../keycloak/fitness-oauth2-realm.json` when it first creates the realm. If the realm already exists, Keycloak's import-on-start does not update it: add a client in the Keycloak admin console or otherwise import the new `fitness-mobile` client without deleting existing realm data. Keep the existing `oauth2-pkce-client` web client and its `http://localhost:5173/*` redirect unchanged. After adjusting Keycloak's public hostname, verify the realm's discovery document at `<KEYCLOAK_PUBLIC_URL>/realms/fitness-oauth2/.well-known/openid-configuration`; its `issuer` must equal `<KEYCLOAK_PUBLIC_URL>/realms/fitness-oauth2`.

## Verification

Run `npm run typecheck` and `npm test` from this directory. On Android and iOS development builds, verify login and registration, role selection and its permanence, app sign-out, session restoration/expiry, all activity types, multi-exercise strength training, saved history refresh, and recovery from API/Keycloak network failures. Keep form inputs on activity-save failures and use Retry when history cannot load. iOS build and device checks need macOS/Xcode or a remote Mac.

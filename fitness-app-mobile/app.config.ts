import type { ExpoConfig } from 'expo/config';
import appJson from './app.json';

const isEasReleaseBuild = process.env.EAS_BUILD_PROFILE === 'preview'
  || process.env.EAS_BUILD_PROFILE === 'production';
const insecureHttpEnabled = !isEasReleaseBuild
  && process.env.EXPO_PUBLIC_ALLOW_INSECURE_HTTP === 'true';
const serviceUrls = [
  process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080/api',
  process.env.EXPO_PUBLIC_KEYCLOAK_URL ?? 'http://localhost:8181',
];

const httpHosts = insecureHttpEnabled
  ? [...new Set(serviceUrls.flatMap((serviceUrl) => {
    const url = new URL(serviceUrl);
    return url.protocol === 'http:' ? [url.hostname] : [];
  }))]
  : [];

const config = appJson.expo as ExpoConfig;

export default (): ExpoConfig => ({
  ...config,
  name: 'Pulse Fitness',
  scheme: 'fitness-mobile',
  ios: {
    ...config.ios,
    bundleIdentifier: 'com.fitness.mobile',
    ...(httpHosts.length > 0
      ? {
        infoPlist: {
          ...config.ios?.infoPlist,
          NSAppTransportSecurity: {
            NSExceptionDomains: Object.fromEntries(httpHosts.map((host) => [
              host,
              {
                NSIncludesSubdomains: true,
                NSExceptionAllowsInsecureHTTPLoads: true,
              },
            ])),
          },
        },
      }
      : {}),
  },
  android: {
    ...config.android,
    package: 'com.fitness.mobile',
    ...(httpHosts.length > 0 ? { usesCleartextTraffic: true } : {}),
  },
  plugins: [...(config.plugins ?? []), 'expo-dev-client', 'expo-secure-store'],
});

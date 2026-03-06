import { z } from 'zod';

const envSchema = z.object({
  EXPO_PUBLIC_X_CLIENT_ID: z.string().min(1).optional(),
  EXPO_PUBLIC_X_API_BASE_URL: z.string().url().default('https://api.x.com/2'),
  EXPO_PUBLIC_X_AUTHORIZATION_ENDPOINT: z
    .string()
    .url()
    .default('https://twitter.com/i/oauth2/authorize'),
  EXPO_PUBLIC_X_TOKEN_ENDPOINT: z.string().url().default('https://api.x.com/2/oauth2/token'),
  EXPO_PUBLIC_X_REVOCATION_ENDPOINT: z.string().url().optional(),
  EXPO_PUBLIC_X_REDIRECT_URI: z.string().min(1).optional(),
  EXPO_PUBLIC_X_REDIRECT_SCHEME: z.string().default('focusx'),
  EXPO_PUBLIC_X_CALLBACK_PATH: z.string().default('oauth/callback'),
  EXPO_PUBLIC_X_FEATURE_FOLLOWING_SOURCE: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
  EXPO_PUBLIC_X_MAX_RESULTS: z
    .string()
    .default('20')
    .transform((value) => {
      const parsed = Number.parseInt(value, 10);
      if (Number.isNaN(parsed)) return 20;
      return Math.max(10, Math.min(100, parsed));
    }),
});

const parseEnv = () => {
  const parsed = envSchema.safeParse(process.env);
  if (parsed.success) return parsed.data;

  console.warn('Invalid .env values detected. Falling back to defaults.');
  return envSchema.parse({});
};

const values = parseEnv();

export const env = {
  clientId: values.EXPO_PUBLIC_X_CLIENT_ID ?? '',
  apiBaseUrl: values.EXPO_PUBLIC_X_API_BASE_URL,
  authorizationEndpoint: values.EXPO_PUBLIC_X_AUTHORIZATION_ENDPOINT,
  tokenEndpoint: values.EXPO_PUBLIC_X_TOKEN_ENDPOINT,
  revocationEndpoint: values.EXPO_PUBLIC_X_REVOCATION_ENDPOINT,
  redirectUriOverride: values.EXPO_PUBLIC_X_REDIRECT_URI,
  redirectScheme: values.EXPO_PUBLIC_X_REDIRECT_SCHEME,
  callbackPath: values.EXPO_PUBLIC_X_CALLBACK_PATH,
  featureFollowingSource: values.EXPO_PUBLIC_X_FEATURE_FOLLOWING_SOURCE,
  maxResults: values.EXPO_PUBLIC_X_MAX_RESULTS,
  isClientConfigured: Boolean(values.EXPO_PUBLIC_X_CLIENT_ID),
};


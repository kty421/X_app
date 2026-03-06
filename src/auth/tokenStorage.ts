import * as SecureStore from 'expo-secure-store';

const TOKEN_STORAGE_KEY = 'focusx.auth.token';

export interface StoredAuthToken {
  accessToken: string;
  tokenType: string;
  scope?: string;
  refreshToken?: string;
  expiresAt?: number;
  obtainedAt: number;
}

export const saveAuthToken = async (token: StoredAuthToken): Promise<void> => {
  await SecureStore.setItemAsync(TOKEN_STORAGE_KEY, JSON.stringify(token));
};

export const readAuthToken = async (): Promise<StoredAuthToken | null> => {
  const rawValue = await SecureStore.getItemAsync(TOKEN_STORAGE_KEY);
  if (!rawValue) return null;

  try {
    return JSON.parse(rawValue) as StoredAuthToken;
  } catch {
    await SecureStore.deleteItemAsync(TOKEN_STORAGE_KEY);
    return null;
  }
};

export const clearAuthToken = async (): Promise<void> => {
  await SecureStore.deleteItemAsync(TOKEN_STORAGE_KEY);
};


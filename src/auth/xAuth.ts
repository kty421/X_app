import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

import { XApiError } from '@/src/api/xErrors';
import { env } from '@/src/config/env';
import { type StoredAuthToken } from '@/src/auth/tokenStorage';

WebBrowser.maybeCompleteAuthSession();

interface OAuthTokenResponse {
  access_token?: string;
  refresh_token?: string;
  token_type?: string;
  scope?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
}

export const xAuthScopes = ['tweet.read', 'users.read', 'offline.access'];

export const xDiscovery: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: env.authorizationEndpoint,
  tokenEndpoint: env.tokenEndpoint,
  revocationEndpoint: env.revocationEndpoint,
};

export const buildRedirectUri = (): string => {
  if (env.redirectUriOverride) return env.redirectUriOverride;

  return AuthSession.makeRedirectUri({
    scheme: env.redirectScheme,
    path: env.callbackPath,
  });
};

const parseOAuthError = (status: number, payload: OAuthTokenResponse): XApiError => {
  const message =
    status === 400
      ? 'OAuthトークンのリクエストが不正です。'
      : status === 401
        ? 'OAuth認証に失敗しました。'
        : status === 403
          ? 'OAuth認証が拒否されました。'
          : `OAuthトークンの取得に失敗しました (ステータス: ${status})。`;

  return new XApiError(message, {
    status,
    kind: status === 401 ? 'unauthorized' : status === 403 ? 'forbidden' : 'unknown',
    detail: payload.error_description,
    code: payload.error,
  });
};

const mapTokenResponse = (payload: OAuthTokenResponse): StoredAuthToken => {
  if (!payload.access_token) {
    throw new Error('トークン応答に必須のアクセストークンが含まれていません。');
  }

  const obtainedAt = Date.now();
  const expiresAt =
    typeof payload.expires_in === 'number' ? obtainedAt + payload.expires_in * 1000 : undefined;

  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
    tokenType: payload.token_type ?? 'bearer',
    scope: payload.scope,
    expiresAt,
    obtainedAt,
  };
};

export interface ExchangeCodeParams {
  code: string;
  codeVerifier: string;
  redirectUri: string;
}

export const exchangeCodeForToken = async ({
  code,
  codeVerifier,
  redirectUri,
}: ExchangeCodeParams): Promise<StoredAuthToken> => {
  if (!env.clientId) {
    throw new Error('X クライアントIDが設定されていません。');
  }

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
    client_id: env.clientId,
  });

  const response = await fetch(env.tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  const payload = (await response.json().catch(() => ({}))) as OAuthTokenResponse;
  if (!response.ok) throw parseOAuthError(response.status, payload);

  return mapTokenResponse(payload);
};

export const refreshAccessToken = async (
  refreshToken: string,
  redirectUri: string
): Promise<StoredAuthToken> => {
  if (!env.clientId) {
    throw new Error('X クライアントIDが設定されていません。');
  }

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: env.clientId,
    redirect_uri: redirectUri,
  });

  const response = await fetch(env.tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  const payload = (await response.json().catch(() => ({}))) as OAuthTokenResponse;
  if (!response.ok) throw parseOAuthError(response.status, payload);

  return mapTokenResponse(payload);
};

export const isTokenExpired = (token?: StoredAuthToken | null): boolean => {
  if (!token?.expiresAt) return false;
  return Date.now() >= token.expiresAt;
};

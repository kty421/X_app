import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as AuthSession from 'expo-auth-session';

import { getCurrentUser } from '@/src/api/xApi';
import { env } from '@/src/config/env';
import { buildRedirectUri, exchangeCodeForToken, xAuthScopes, xDiscovery } from '@/src/auth/xAuth';
import { useAuthStore } from '@/src/store/authStore';

interface UseXAuthFlowResult {
  redirectUri: string;
  isConfigured: boolean;
  isReady: boolean;
  isProcessing: boolean;
  authError?: string;
  signIn: () => Promise<void>;
}

export const useXAuthFlow = (): UseXAuthFlowResult => {
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);
  const markAuthError = useAuthStore((state) => state.markAuthError);
  const [authError, setAuthError] = useState<string>();
  const [isProcessing, setIsProcessing] = useState(false);
  const handledCodeRef = useRef<string | null>(null);

  const redirectUri = useMemo(() => buildRedirectUri(), []);

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: env.clientId,
      responseType: AuthSession.ResponseType.Code,
      scopes: xAuthScopes,
      usePKCE: true,
      redirectUri,
    },
    xDiscovery
  );

  useEffect(() => {
    if (response?.type !== 'success') {
      if (response?.type === 'error') {
        const message = '認証に失敗しました。';
        setAuthError(message);
        markAuthError(message);
      }
      return;
    }

    const code = response.params?.code;
    if (!code || handledCodeRef.current === code) return;
    handledCodeRef.current = code;

    const processCodeExchange = async () => {
      const codeVerifier = request?.codeVerifier;
      if (!codeVerifier) {
        const message = 'PKCE の code verifier が見つかりません。';
        setAuthError(message);
        markAuthError(message);
        return;
      }

      try {
        setIsProcessing(true);
        setAuthError(undefined);
        const token = await exchangeCodeForToken({
          code,
          codeVerifier,
          redirectUri,
        });
        const user = await getCurrentUser(token.accessToken).catch(() => null);
        await setAuthenticated(token, user);
      } catch (error) {
        const message = error instanceof Error ? error.message : '認証コードの交換に失敗しました。';
        setAuthError(message);
        markAuthError(message);
      } finally {
        setIsProcessing(false);
      }
    };

    void processCodeExchange();
  }, [markAuthError, redirectUri, request?.codeVerifier, response, setAuthenticated]);

  const signIn = useCallback(async () => {
    if (!env.isClientConfigured) {
      const message = 'X クライアントIDが設定されていません。.env の設定を確認してください。';
      setAuthError(message);
      markAuthError(message);
      return;
    }
    if (!request) {
      const message = '認証リクエストの準備がまだ完了していません。';
      setAuthError(message);
      markAuthError(message);
      return;
    }

    setAuthError(undefined);
    const result = await promptAsync();
    if (result.type === 'error') {
      const message = '認証がキャンセルされたか、失敗しました。';
      setAuthError(message);
      markAuthError(message);
    }
  }, [markAuthError, promptAsync, request]);

  return {
    redirectUri,
    isConfigured: env.isClientConfigured,
    isReady: Boolean(request) && env.isClientConfigured,
    isProcessing,
    authError,
    signIn,
  };
};

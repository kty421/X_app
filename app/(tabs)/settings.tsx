import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { getCurrentUser } from '@/src/api/xApi';
import { useXAuthFlow } from '@/src/auth/useXAuthFlow';
import { StatePanel } from '@/src/components/StatePanel';
import { buildSearchQuery } from '@/src/features/feed/queryBuilder';
import { useAuthStore } from '@/src/store/authStore';
import { useThemeStore } from '@/src/store/themeStore';

const authStatusLabels = {
  idle: '未初期化',
  loading: '読み込み中',
  authenticated: '認証済み',
  unauthenticated: '未認証',
} as const;

export default function SettingsScreen() {
  const { redirectUri, isConfigured, isReady, isProcessing, authError, signIn } = useXAuthFlow();
  const authStatus = useAuthStore((state) => state.status);
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const logout = useAuthStore((state) => state.logout);
  const lastError = useAuthStore((state) => state.lastError);

  const currentTheme = useThemeStore((state) => state.getCurrentTheme());
  const debugQuery = buildSearchQuery(currentTheme);

  useEffect(() => {
    if (!token?.accessToken || user) return;
    void getCurrentUser(token.accessToken)
      .then((me) => setUser(me))
      .catch(() => {
        // Keep UI functional even if /users/me is not available in current access level.
      });
  }, [setUser, token?.accessToken, user]);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.title}>FocusX 設定</Text>
      <Text style={styles.description}>
        このアプリは、公式 X API の検索結果から独自のフォーカスフィードを構築します。公式のホームタイムラインは変更しません。
      </Text>

      {!isConfigured ? (
        <StatePanel
          title="クライアントIDが未設定です"
          description=".env ファイルに EXPO_PUBLIC_X_CLIENT_ID を設定してください。"
          tone="warning"
        />
      ) : null}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>認証</Text>
        <Text style={styles.meta}>状態: {authStatusLabels[authStatus]}</Text>
        <Text style={styles.meta}>
          ログイン中のユーザー: {user ? `@${user.username} (${user.name})` : '（未取得）'}
        </Text>
        <Text style={styles.meta}>リダイレクトURI: {redirectUri}</Text>

        {authError || lastError ? (
          <StatePanel title="認証エラー" description={authError ?? lastError} tone="error" />
        ) : null}

        <View style={styles.actions}>
          <Pressable
            style={[styles.button, (!isReady || isProcessing) && styles.buttonDisabled]}
            disabled={!isReady || isProcessing}
            onPress={() => {
              void signIn();
            }}
          >
            <Text style={styles.buttonText}>{isProcessing ? 'ログインしています...' : 'Xでログイン'}</Text>
          </Pressable>
          <Pressable
            style={[styles.button, styles.secondaryButton]}
            onPress={() => {
              void logout();
            }}
          >
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>ログアウト</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>検索クエリの確認</Text>
        <Text style={styles.meta}>現在のテーマ: {currentTheme.name}</Text>
        <Text style={styles.query}>{debugQuery || '（クエリを生成できません）'}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>フォールバック動作</Text>
        <Text style={styles.meta}>
          アクセス権限の都合でホームやフォロー情報の取得系エンドポイントを利用できない場合でも、FocusX は公開の最近検索モードへフォールバックして利用を継続できます。
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 14,
    gap: 12,
    paddingBottom: 30,
  },
  title: {
    color: '#0f172a',
    fontSize: 22,
    fontWeight: '800',
  },
  description: {
    color: '#334155',
    fontSize: 14,
    lineHeight: 20,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    padding: 12,
    gap: 8,
  },
  cardTitle: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '700',
  },
  meta: {
    color: '#334155',
    fontSize: 13,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 2,
  },
  button: {
    backgroundColor: '#0284c7',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  buttonDisabled: {
    backgroundColor: '#94a3b8',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  secondaryButton: {
    backgroundColor: '#e2e8f0',
  },
  secondaryButtonText: {
    color: '#0f172a',
  },
  query: {
    color: '#0f172a',
    fontFamily: 'monospace',
    backgroundColor: '#e2e8f0',
    borderRadius: 8,
    padding: 8,
    fontSize: 12,
  },
});

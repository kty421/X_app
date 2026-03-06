import { useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { FeedConfigurationError, isAuthExpiredError } from '@/src/api/xErrors';
import { PostCard } from '@/src/components/PostCard';
import { StatePanel } from '@/src/components/StatePanel';
import { ThemeChipPicker } from '@/src/components/ThemeChipPicker';
import { type XPost } from '@/src/domain/post';
import { useFocusFeed } from '@/src/features/feed/useFocusFeed';
import { useAuthStore } from '@/src/store/authStore';
import { usePostCacheStore } from '@/src/store/postCacheStore';
import { useThemeStore } from '@/src/store/themeStore';

export default function FeedScreen() {
  const router = useRouter();
  const themes = useThemeStore((state) => state.themes);
  const currentThemeId = useThemeStore((state) => state.currentThemeId);
  const setCurrentTheme = useThemeStore((state) => state.setCurrentTheme);
  const authStatus = useAuthStore((state) => state.status);
  const accessToken = useAuthStore((state) => state.token?.accessToken);
  const putPost = usePostCacheStore((state) => state.putPost);

  const currentTheme = useMemo(
    () => themes.find((theme) => theme.id === currentThemeId) ?? themes[0],
    [currentThemeId, themes]
  );

  const feed = useFocusFeed({
    token: accessToken,
    theme: currentTheme,
  });

  const openPostDetail = (post: XPost) => {
    putPost(post);
    router.push({
      pathname: '/post/[id]',
      params: { id: post.id },
    });
  };

  if (!currentTheme) {
    return (
      <View style={styles.root}>
        <StatePanel title="テーマがありません" description="先に「テーマ」タブでテーマを作成してください。" />
      </View>
    );
  }

  const header = (
    <View style={styles.headerArea}>
      <ThemeChipPicker
        themes={themes}
        currentThemeId={currentTheme.id}
        onSelectTheme={(id) => setCurrentTheme(id)}
      />
      <Text style={styles.queryLabel}>検索クエリ</Text>
      <Text style={styles.queryText}>{feed.queryPreview || '（クエリを生成できません）'}</Text>
      {feed.warning ? (
        <StatePanel title="フォールバック中" description={feed.warning} tone="warning" />
      ) : null}
      {authStatus === 'loading' ? (
        <View style={styles.inlineLoading}>
          <ActivityIndicator color="#0284c7" />
          <Text style={styles.inlineLoadingText}>認証状態を確認しています...</Text>
        </View>
      ) : null}
      {!accessToken ? (
        <StatePanel
          title="ログインが必要です"
          description="フォーカスフィードを読み込むには、「設定」から X OAuth2 (PKCE) にログインしてください。"
          actionLabel="設定を開く"
          onAction={() => router.push('/settings')}
        />
      ) : null}
      {feed.error ? (
        <StatePanel
          title={isAuthExpiredError(feed.error) ? 'セッションの有効期限が切れました' : 'フィードの読み込みに失敗しました'}
          description={
            isAuthExpiredError(feed.error)
              ? 'アクセストークンの有効期限が切れています。「設定」から再度ログインしてください。'
              : feed.error instanceof FeedConfigurationError
                ? feed.error.message
                : feed.error instanceof Error
                  ? feed.error.message
                  : '不明なエラーが発生しました。'
          }
          actionLabel={isAuthExpiredError(feed.error) ? '設定を開く' : undefined}
          onAction={isAuthExpiredError(feed.error) ? () => router.push('/settings') : undefined}
          tone="error"
        />
      ) : null}
    </View>
  );

  return (
    <View style={styles.root}>
      <FlatList
        data={feed.posts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={header}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => <PostCard post={item} onPress={() => openPostDetail(item)} />}
        refreshControl={
          <RefreshControl
            refreshing={feed.isRefetching}
            onRefresh={() => {
              void feed.refetch();
            }}
          />
        }
        ListEmptyComponent={
          !feed.isLoading && !feed.error && accessToken ? (
            <StatePanel
              title="投稿がありません"
              description="現在のテーマに一致する投稿がありません。含めるキーワードや除外キーワードを調整してください。"
            />
          ) : feed.isLoading ? (
            <View style={styles.centerLoading}>
              <ActivityIndicator color="#0284c7" />
              <Text style={styles.inlineLoadingText}>フォーカスフィードを読み込んでいます...</Text>
            </View>
          ) : null
        }
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (feed.hasNextPage && !feed.isFetchingNextPage) {
            void feed.fetchNextPage();
          }
        }}
        ListFooterComponent={
          feed.isFetchingNextPage ? (
            <View style={styles.footerLoading}>
              <ActivityIndicator color="#0284c7" />
              <Text style={styles.inlineLoadingText}>さらに読み込んでいます...</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  headerArea: {
    gap: 10,
    marginBottom: 8,
  },
  listContent: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 20,
  },
  separator: {
    height: 12,
  },
  queryLabel: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  queryText: {
    color: '#0f172a',
    fontFamily: 'monospace',
    backgroundColor: '#e2e8f0',
    borderRadius: 8,
    padding: 8,
    fontSize: 12,
  },
  inlineLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inlineLoadingText: {
    color: '#334155',
    fontSize: 13,
  },
  centerLoading: {
    paddingVertical: 24,
    alignItems: 'center',
    gap: 8,
  },
  footerLoading: {
    paddingVertical: 16,
    alignItems: 'center',
    gap: 8,
  },
});

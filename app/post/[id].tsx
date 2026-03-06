import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { PostCard } from '@/src/components/PostCard';
import { StatePanel } from '@/src/components/StatePanel';
import { usePostCacheStore } from '@/src/store/postCacheStore';

export default function PostDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const postId = typeof params.id === 'string' ? params.id : '';
  const post = usePostCacheStore((state) => (postId ? state.postsById[postId] : undefined));

  const fallbackUrl = `https://x.com/i/web/status/${postId}`;
  const postUrl = post?.url ?? fallbackUrl;

  const openInX = async () => {
    const canOpen = await Linking.canOpenURL(postUrl);
    if (!canOpen) {
      Alert.alert('開けません', 'この端末では X のURLを開けません。');
      return;
    }
    await Linking.openURL(postUrl);
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      {!post ? (
        <StatePanel
          title="投稿データがローカルキャッシュにありません"
          description="投稿IDから直接 X で開いてください。"
          actionLabel="Xで開く"
          onAction={() => {
            void openInX();
          }}
          tone="warning"
        />
      ) : (
        <>
          <PostCard post={post} />
          <View style={styles.metaCard}>
            <Text style={styles.metaTitle}>投稿情報</Text>
            <Text style={styles.meta}>投稿ID: {post.id}</Text>
            <Text style={styles.meta}>センシティブ: {post.possiblySensitive ? 'はい' : 'いいえ'}</Text>
            <Text style={styles.meta}>返信: {post.isReply ? 'はい' : 'いいえ'}</Text>
            <Text style={styles.meta}>リポスト: {post.isRetweet ? 'はい' : 'いいえ'}</Text>
          </View>
        </>
      )}

      <Pressable style={styles.openButton} onPress={() => void openInX()}>
        <Text style={styles.openButtonText}>Xで開く</Text>
      </Pressable>
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
  metaCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    padding: 12,
    gap: 6,
  },
  metaTitle: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '700',
  },
  meta: {
    color: '#334155',
    fontSize: 13,
  },
  openButton: {
    borderRadius: 10,
    backgroundColor: '#0284c7',
    paddingVertical: 12,
    alignItems: 'center',
  },
  openButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
});

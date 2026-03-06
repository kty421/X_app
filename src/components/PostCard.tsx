import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { type XPost } from '@/src/domain/post';
import { formatPostDate } from '@/src/utils/date';

interface PostCardProps {
  post: XPost;
  onPress?: () => void;
}

export const PostCard = ({ post, onPress }: PostCardProps) => {
  const media = post.media[0];

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.authorName}>{post.author?.name ?? '不明なユーザー'}</Text>
        <Text style={styles.authorHandle}>
          @{post.author?.username ?? '不明'} · {formatPostDate(post.createdAt)}
        </Text>
      </View>

      <Text style={styles.bodyText}>{post.text || '（本文なし）'}</Text>

      {media ? <Image source={{ uri: media.url }} style={styles.image} resizeMode="cover" /> : null}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    gap: 10,
  },
  header: {
    gap: 2,
  },
  authorName: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '700',
  },
  authorHandle: {
    color: '#475569',
    fontSize: 12,
  },
  bodyText: {
    color: '#0f172a',
    fontSize: 15,
    lineHeight: 22,
  },
  image: {
    width: '100%',
    height: 220,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
  },
});

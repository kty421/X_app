import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { type ThemeSet } from '@/src/domain/theme';
import { useThemeStore } from '@/src/store/themeStore';

const languageLabels = {
  ja: '日本語',
  en: '英語',
  all: 'すべて',
} as const;

const toggleLabel = (value: boolean) => (value ? 'オン' : 'オフ');

const ThemeCard = ({
  theme,
  isCurrent,
  onUse,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  theme: ThemeSet;
  isCurrent: boolean;
  onUse: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) => (
  <View style={[styles.card, isCurrent && styles.currentCard]}>
    <View style={styles.cardHeader}>
      <Text style={styles.cardTitle}>{theme.name}</Text>
      {isCurrent ? <Text style={styles.currentBadge}>使用中</Text> : null}
    </View>
    <Text style={styles.cardMeta}>
      含める: {theme.includeKeywords.length} / 除外: {theme.excludeKeywords.length} / アカウント:{' '}
      {theme.includeAccounts.length}
    </Text>
    <Text style={styles.cardMeta}>
      言語: {languageLabels[theme.language]} | リポスト非表示: {toggleLabel(theme.hideRetweets)} | 返信非表示:{' '}
      {toggleLabel(theme.hideReplies)} | セーフモード: {toggleLabel(theme.safeMode)}
    </Text>

    <View style={styles.actions}>
      <Pressable style={styles.actionButton} onPress={onUse}>
        <Text style={styles.actionText}>適用</Text>
      </Pressable>
      <Pressable style={styles.actionButton} onPress={onEdit}>
        <Text style={styles.actionText}>編集</Text>
      </Pressable>
      <Pressable style={styles.actionButton} onPress={onDuplicate}>
        <Text style={styles.actionText}>複製</Text>
      </Pressable>
      <Pressable style={[styles.actionButton, styles.deleteButton]} onPress={onDelete}>
        <Text style={[styles.actionText, styles.deleteText]}>削除</Text>
      </Pressable>
    </View>
  </View>
);

export default function ThemesScreen() {
  const router = useRouter();
  const themes = useThemeStore((state) => state.themes);
  const currentThemeId = useThemeStore((state) => state.currentThemeId);
  const setCurrentTheme = useThemeStore((state) => state.setCurrentTheme);
  const duplicateTheme = useThemeStore((state) => state.duplicateTheme);
  const deleteTheme = useThemeStore((state) => state.deleteTheme);

  return (
    <View style={styles.root}>
      <View style={styles.topBar}>
        <Text style={styles.pageTitle}>テーマ一覧</Text>
        <Pressable style={styles.primaryButton} onPress={() => router.push('/theme-editor')}>
          <Text style={styles.primaryButtonText}>新規作成</Text>
        </Pressable>
      </View>

      <FlatList
        data={themes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item }) => (
          <ThemeCard
            theme={item}
            isCurrent={item.id === currentThemeId}
            onUse={() => setCurrentTheme(item.id)}
            onEdit={() =>
              router.push({
                pathname: '/theme-editor',
                params: { id: item.id },
              })
            }
            onDuplicate={() => duplicateTheme(item.id)}
            onDelete={() => {
              Alert.alert('テーマを削除', `「${item.name}」を削除しますか？`, [
                { text: 'キャンセル', style: 'cancel' },
                {
                  text: '削除',
                  style: 'destructive',
                  onPress: () => deleteTheme(item.id),
                },
              ]);
            }}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 14,
    gap: 10,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pageTitle: {
    color: '#0f172a',
    fontSize: 22,
    fontWeight: '800',
  },
  primaryButton: {
    backgroundColor: '#0284c7',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  list: {
    paddingTop: 4,
    paddingBottom: 20,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    padding: 12,
    gap: 8,
  },
  currentCard: {
    borderColor: '#0284c7',
    backgroundColor: '#f0f9ff',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '700',
  },
  currentBadge: {
    color: '#0369a1',
    fontSize: 12,
    fontWeight: '700',
  },
  cardMeta: {
    color: '#334155',
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#ffffff',
  },
  actionText: {
    color: '#0f172a',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButton: {
    borderColor: '#fecaca',
    backgroundColor: '#fff1f2',
  },
  deleteText: {
    color: '#b91c1c',
  },
});

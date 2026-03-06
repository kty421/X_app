import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: '見つかりません' }} />
      <View style={styles.container}>
        <Text style={styles.title}>ページが見つかりませんでした。</Text>
        <Link href="/feed" style={styles.link}>
          <Text style={styles.linkText}>フィードへ戻る</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    padding: 20,
  },
  title: {
    color: '#0f172a',
    fontSize: 20,
    fontWeight: '700',
  },
  link: {
    marginTop: 16,
    paddingVertical: 8,
  },
  linkText: {
    fontSize: 14,
    color: '#0284c7',
  },
});

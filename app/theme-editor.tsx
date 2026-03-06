import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { buildSearchQuery } from '@/src/features/feed/queryBuilder';
import { parseCommaSeparated, type ThemeDraft, type ThemeLanguage } from '@/src/domain/theme';
import { useThemeStore } from '@/src/store/themeStore';

const languageLabels: Record<ThemeLanguage, string> = {
  ja: '日本語',
  en: '英語',
  all: 'すべて',
};

const defaultDraft: ThemeDraft = {
  name: '',
  includeKeywords: [],
  excludeKeywords: [],
  includeAccounts: [],
  language: 'ja',
  hideRetweets: true,
  hideReplies: true,
  safeMode: true,
};

export default function ThemeEditorScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const themeId = typeof params.id === 'string' ? params.id : undefined;

  const themes = useThemeStore((state) => state.themes);
  const addTheme = useThemeStore((state) => state.addTheme);
  const updateTheme = useThemeStore((state) => state.updateTheme);
  const setCurrentTheme = useThemeStore((state) => state.setCurrentTheme);

  const editingTheme = useMemo(
    () => (themeId ? themes.find((theme) => theme.id === themeId) : undefined),
    [themeId, themes]
  );

  const [name, setName] = useState(defaultDraft.name);
  const [includeKeywordsInput, setIncludeKeywordsInput] = useState('');
  const [excludeKeywordsInput, setExcludeKeywordsInput] = useState('');
  const [includeAccountsInput, setIncludeAccountsInput] = useState('');
  const [language, setLanguage] = useState<ThemeLanguage>('ja');
  const [hideRetweets, setHideRetweets] = useState(true);
  const [hideReplies, setHideReplies] = useState(true);
  const [safeMode, setSafeMode] = useState(true);

  useEffect(() => {
    if (!editingTheme) {
      setName(defaultDraft.name);
      setIncludeKeywordsInput('');
      setExcludeKeywordsInput('');
      setIncludeAccountsInput('');
      setLanguage(defaultDraft.language);
      setHideRetweets(defaultDraft.hideRetweets);
      setHideReplies(defaultDraft.hideReplies);
      setSafeMode(defaultDraft.safeMode);
      return;
    }

    setName(editingTheme.name);
    setIncludeKeywordsInput(editingTheme.includeKeywords.join(', '));
    setExcludeKeywordsInput(editingTheme.excludeKeywords.join(', '));
    setIncludeAccountsInput(editingTheme.includeAccounts.join(', '));
    setLanguage(editingTheme.language);
    setHideRetweets(editingTheme.hideRetweets);
    setHideReplies(editingTheme.hideReplies);
    setSafeMode(editingTheme.safeMode);
  }, [editingTheme]);

  const draft = useMemo<ThemeDraft>(
    () => ({
      name: name.trim(),
      includeKeywords: parseCommaSeparated(includeKeywordsInput),
      excludeKeywords: parseCommaSeparated(excludeKeywordsInput),
      includeAccounts: parseCommaSeparated(includeAccountsInput).map((account) =>
        account.replace(/^@/, '')
      ),
      language,
      hideRetweets,
      hideReplies,
      safeMode,
    }),
    [excludeKeywordsInput, hideReplies, hideRetweets, includeAccountsInput, includeKeywordsInput, language, name, safeMode]
  );

  const queryPreview = useMemo(() => buildSearchQuery(draft), [draft]);

  const saveTheme = () => {
    if (!draft.name) {
      Alert.alert('入力エラー', 'テーマ名を入力してください。');
      return;
    }
    if (draft.includeKeywords.length === 0 && draft.includeAccounts.length === 0) {
      Alert.alert('入力エラー', '含めるキーワードまたはアカウントを1つ以上追加してください。');
      return;
    }

    if (editingTheme) {
      updateTheme(editingTheme.id, draft);
      setCurrentTheme(editingTheme.id);
    } else {
      const id = addTheme(draft);
      setCurrentTheme(id);
    }

    router.back();
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{editingTheme ? 'テーマを編集' : 'テーマを作成'}</Text>

      <Text style={styles.label}>テーマ名</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="例: 研究"
        style={styles.input}
        placeholderTextColor="#94a3b8"
      />

      <Text style={styles.label}>含めるキーワード（カンマ区切り）</Text>
      <TextInput
        value={includeKeywordsInput}
        onChangeText={setIncludeKeywordsInput}
        placeholder="例: 強化学習, TSP, #LLM"
        style={styles.input}
        placeholderTextColor="#94a3b8"
      />

      <Text style={styles.label}>除外キーワード（カンマ区切り）</Text>
      <TextInput
        value={excludeKeywordsInput}
        onChangeText={setExcludeKeywordsInput}
        placeholder="例: 炎上, ゴシップ"
        style={styles.input}
        placeholderTextColor="#94a3b8"
      />

      <Text style={styles.label}>含めるアカウント（カンマ区切り、@不要）</Text>
      <TextInput
        value={includeAccountsInput}
        onChangeText={setIncludeAccountsInput}
        placeholder="例: OpenAI, xdevplatform"
        style={styles.input}
        placeholderTextColor="#94a3b8"
      />

      <Text style={styles.label}>言語</Text>
      <View style={styles.row}>
        {(['ja', 'en', 'all'] as ThemeLanguage[]).map((lang) => (
          <Pressable
            key={lang}
            style={[styles.segmentButton, language === lang && styles.segmentButtonActive]}
            onPress={() => setLanguage(lang)}
          >
            <Text style={[styles.segmentText, language === lang && styles.segmentTextActive]}>
              {languageLabels[lang]}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>リポストを非表示</Text>
        <Switch value={hideRetweets} onValueChange={setHideRetweets} />
      </View>
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>返信を非表示</Text>
        <Switch value={hideReplies} onValueChange={setHideReplies} />
      </View>
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>セーフモード</Text>
        <Switch value={safeMode} onValueChange={setSafeMode} />
      </View>

      <Text style={styles.label}>生成されたクエリ（確認用）</Text>
      <Text style={styles.query}>{queryPreview || '（クエリを生成できません）'}</Text>

      <Pressable style={styles.saveButton} onPress={saveTheme}>
        <Text style={styles.saveText}>テーマを保存</Text>
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
    gap: 10,
    paddingBottom: 30,
  },
  title: {
    color: '#0f172a',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 2,
  },
  label: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#0f172a',
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  segmentButton: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  segmentButtonActive: {
    borderColor: '#0284c7',
    backgroundColor: '#e0f2fe',
  },
  segmentText: {
    color: '#334155',
    fontWeight: '700',
    fontSize: 13,
  },
  segmentTextActive: {
    color: '#0369a1',
  },
  switchRow: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchLabel: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '600',
  },
  query: {
    color: '#0f172a',
    fontFamily: 'monospace',
    backgroundColor: '#e2e8f0',
    borderRadius: 8,
    padding: 10,
    fontSize: 12,
  },
  saveButton: {
    marginTop: 8,
    backgroundColor: '#0284c7',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 14,
  },
});

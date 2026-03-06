import { createTheme, type ThemeSet } from '@/src/domain/theme';

const baseTheme = {
  includeKeywords: [] as string[],
  excludeKeywords: [] as string[],
  includeAccounts: [] as string[],
  language: 'ja' as const,
  hideRetweets: true,
  hideReplies: true,
  safeMode: true,
};

export const defaultThemes: ThemeSet[] = [
  createTheme(
    {
      ...baseTheme,
      name: '就活',
      includeKeywords: ['就活', 'インターン', '面接', '#26卒'],
      excludeKeywords: ['炎上', 'ゴシップ', '誹謗中傷'],
    },
    'theme_shukatsu'
  ),
  createTheme(
    {
      ...baseTheme,
      name: '研究',
      includeKeywords: ['強化学習', '論文', '機械学習', '#LLM'],
      excludeKeywords: ['政治', '芸能'],
    },
    'theme_research'
  ),
  createTheme(
    {
      ...baseTheme,
      name: '投資',
      includeKeywords: ['株式', '米国株', '決算', 'インデックス投資'],
      excludeKeywords: ['煽り', '詐欺', 'ゴシップ'],
      hideReplies: false,
    },
    'theme_invest'
  ),
  createTheme(
    {
      ...baseTheme,
      name: '筋トレ',
      includeKeywords: ['筋トレ', 'プロテイン', '減量', '#fitness'],
      excludeKeywords: ['炎上', '広告'],
      language: 'all',
      hideReplies: false,
    },
    'theme_fitness'
  ),
];


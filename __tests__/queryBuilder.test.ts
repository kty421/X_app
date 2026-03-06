import { buildSearchQuery, hasIncludeCriteria } from '@/src/features/feed/queryBuilder';
import { type ThemeSet } from '@/src/domain/theme';

const baseTheme: ThemeSet = {
  id: 't1',
  name: 'Test',
  includeKeywords: [],
  excludeKeywords: [],
  includeAccounts: [],
  language: 'all',
  hideRetweets: false,
  hideReplies: false,
  safeMode: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('buildSearchQuery', () => {
  it('builds query with include/exclude/accounts/lang/hide flags', () => {
    const query = buildSearchQuery({
      ...baseTheme,
      includeKeywords: ['強化学習', 'TSP', '#LLM'],
      excludeKeywords: ['炎上', 'ゴシップ'],
      includeAccounts: ['OpenAI', 'xdevplatform'],
      language: 'ja',
      hideRetweets: true,
      hideReplies: true,
    });

    expect(query).toBe(
      '(("強化学習" OR TSP OR #LLM) OR (from:OpenAI OR from:xdevplatform)) -("炎上" OR "ゴシップ") lang:ja -is:retweet -is:reply'
    );
  });

  it('normalizes duplicate accounts and keywords', () => {
    const query = buildSearchQuery({
      ...baseTheme,
      includeKeywords: ['AI', 'AI', ' AI '],
      includeAccounts: ['@OpenAI', 'openai', '@OpenAI'],
      hideRetweets: true,
    });

    expect(query).toBe('(AI OR from:OpenAI) -is:retweet');
  });

  it('returns only filter tokens when include is empty', () => {
    const query = buildSearchQuery({
      ...baseTheme,
      language: 'en',
      hideReplies: true,
    });

    expect(query).toBe('lang:en -is:reply');
  });
});

describe('hasIncludeCriteria', () => {
  it('returns false when includeKeywords and includeAccounts are empty', () => {
    expect(
      hasIncludeCriteria({
        includeKeywords: [],
        includeAccounts: [],
      })
    ).toBe(false);
  });

  it('returns true when any include criteria exists', () => {
    expect(
      hasIncludeCriteria({
        includeKeywords: ['AI'],
        includeAccounts: [],
      })
    ).toBe(true);
  });
});


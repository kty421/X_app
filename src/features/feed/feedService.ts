import { isAccessDeniedError, FeedConfigurationError, isAuthExpiredError } from '@/src/api/xErrors';
import { getCurrentUser, getFollowingAccounts, searchRecentTweets } from '@/src/api/xApi';
import { featureFlags } from '@/src/config/featureFlags';
import { type ThemeSet } from '@/src/domain/theme';
import { applyLocalPostFilters } from '@/src/features/feed/localFilter';
import { buildSearchQuery, hasIncludeCriteria } from '@/src/features/feed/queryBuilder';

export type FeedSourcePreference = 'auto' | 'recent_search' | 'following_search';
export type FeedResolvedMode = 'recent_search' | 'following_search';

export interface FocusFeedPage {
  posts: Awaited<ReturnType<typeof searchRecentTweets>>['posts'];
  nextToken?: string;
  resultCount: number;
  query: string;
  mode: FeedResolvedMode;
  warning?: string;
}

interface FetchFocusFeedParams {
  token: string;
  theme: ThemeSet;
  nextToken?: string;
  sourcePreference?: FeedSourcePreference;
}

const mergeAccounts = (themeAccounts: string[], followingAccounts: string[]): string[] => {
  const merged = [...themeAccounts, ...followingAccounts];
  const seen = new Set<string>();
  const result: string[] = [];

  for (const account of merged) {
    const normalized = account.trim().replace(/^@/, '');
    if (!normalized) continue;

    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(normalized);
  }

  return result;
};

const fetchRecentSearchFeed = async (
  token: string,
  theme: ThemeSet,
  nextToken?: string
): Promise<FocusFeedPage> => {
  const query = buildSearchQuery(theme);
  if (!query) {
    throw new FeedConfigurationError('テーマに含めるキーワードまたは含めるアカウントを1つ以上設定してください。');
  }

  const page = await searchRecentTweets({
    token,
    query,
    nextToken,
  });

  return {
    ...page,
    query,
    mode: 'recent_search',
    posts: applyLocalPostFilters(page.posts, theme),
  };
};

const fetchFollowingBasedFeed = async (
  token: string,
  theme: ThemeSet,
  nextToken?: string
): Promise<FocusFeedPage> => {
  const me = await getCurrentUser(token);
  const followingAccounts = await getFollowingAccounts(token, me.id);

  if (followingAccounts.length === 0) {
    throw new FeedConfigurationError(
      'フォロー中ユーザーが取得できないため、通常の検索ベースにフォールバックします。'
    );
  }

  const queryTheme: ThemeSet = {
    ...theme,
    includeAccounts: mergeAccounts(theme.includeAccounts, followingAccounts),
  };
  const query = buildSearchQuery(queryTheme);

  if (!query) {
    throw new FeedConfigurationError('フォロー中ユーザーを取得しましたが、検索クエリを組み立てられませんでした。');
  }

  const page = await searchRecentTweets({
    token,
    query,
    nextToken,
  });

  return {
    ...page,
    query,
    mode: 'following_search',
    posts: applyLocalPostFilters(page.posts, theme),
  };
};

export const fetchFocusFeedPage = async ({
  token,
  theme,
  nextToken,
  sourcePreference = 'auto',
}: FetchFocusFeedParams): Promise<FocusFeedPage> => {
  if (!hasIncludeCriteria(theme)) {
    throw new FeedConfigurationError('テーマに含めるキーワードまたは含めるアカウントを1件以上設定してください。');
  }

  const shouldTryFollowingSource =
    sourcePreference === 'following_search' ||
    (sourcePreference === 'auto' && featureFlags.enableFollowingBasedSearch);

  if (shouldTryFollowingSource) {
    try {
      return await fetchFollowingBasedFeed(token, theme, nextToken);
    } catch (error) {
      if (isAuthExpiredError(error)) throw error;
      if (error instanceof FeedConfigurationError) {
        const fallbackPage = await fetchRecentSearchFeed(token, theme, nextToken);
        return {
          ...fallbackPage,
          warning: error.message,
        };
      }
      if (isAccessDeniedError(error)) {
        const fallbackPage = await fetchRecentSearchFeed(token, theme, nextToken);
        return {
          ...fallbackPage,
          warning:
            'フォロー情報にアクセスできなかったため、検索ベース簡易モードで表示しています。',
        };
      }
      throw error;
    }
  }

  return fetchRecentSearchFeed(token, theme, nextToken);
};

import { useEffect, useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';

import { isAuthExpiredError, isAccessDeniedError } from '@/src/api/xErrors';
import {
  fetchFocusFeedPage,
  type FeedSourcePreference,
  type FocusFeedPage,
} from '@/src/features/feed/feedService';
import { buildSearchQuery } from '@/src/features/feed/queryBuilder';
import { type ThemeSet } from '@/src/domain/theme';
import { usePostCacheStore } from '@/src/store/postCacheStore';

interface UseFocusFeedParams {
  token?: string;
  theme?: ThemeSet;
  sourcePreference?: FeedSourcePreference;
}

const flattenPages = (pages: FocusFeedPage[] | undefined) =>
  pages?.flatMap((page) => page.posts) ?? [];

export const useFocusFeed = ({
  token,
  theme,
  sourcePreference = 'auto',
}: UseFocusFeedParams) => {
  const putPosts = usePostCacheStore((state) => state.putPosts);
  const queryPreview = useMemo(() => (theme ? buildSearchQuery(theme) : ''), [theme]);

  const query = useInfiniteQuery({
    queryKey: ['focusFeed', theme?.id, theme?.updatedAt, sourcePreference],
    enabled: Boolean(token && theme),
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => {
      if (!token || !theme) {
        throw new Error('認証トークンまたは有効なテーマがありません。');
      }
      return fetchFocusFeedPage({
        token,
        theme,
        sourcePreference,
        nextToken: pageParam,
      });
    },
    getNextPageParam: (lastPage) => lastPage.nextToken,
    retry: (failureCount, error) => {
      if (isAuthExpiredError(error)) return false;
      if (isAccessDeniedError(error)) return false;
      return failureCount < 2;
    },
  });

  const posts = useMemo(() => flattenPages(query.data?.pages), [query.data?.pages]);
  const warning = useMemo(
    () => query.data?.pages.find((page) => page.warning)?.warning,
    [query.data?.pages]
  );

  useEffect(() => {
    if (posts.length > 0) {
      putPosts(posts);
    }
  }, [posts, putPosts]);

  return {
    ...query,
    posts,
    warning,
    queryPreview,
  };
};

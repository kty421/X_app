import { type XPost } from '@/src/domain/post';
import { type ThemeSet } from '@/src/domain/theme';

const containsKeyword = (text: string, keyword: string): boolean =>
  text.includes(keyword.toLowerCase().trim());

export const applyLocalPostFilters = (
  posts: XPost[],
  theme: Pick<ThemeSet, 'excludeKeywords' | 'safeMode' | 'hideRetweets' | 'hideReplies'>
): XPost[] => {
  const excludeKeywords = theme.excludeKeywords
    .map((keyword) => keyword.toLowerCase().trim())
    .filter(Boolean);

  return posts.filter((post) => {
    if (theme.safeMode && post.possiblySensitive) return false;
    if (theme.hideRetweets && post.isRetweet) return false;
    if (theme.hideReplies && post.isReply) return false;

    const normalizedText = `${post.text} ${post.author?.name ?? ''} ${post.author?.username ?? ''}`
      .toLowerCase()
      .trim();

    if (excludeKeywords.some((keyword) => containsKeyword(normalizedText, keyword))) {
      return false;
    }

    return true;
  });
};


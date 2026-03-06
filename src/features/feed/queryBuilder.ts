import { type ThemeSet } from '@/src/domain/theme';

export interface QueryBuildDebugInfo {
  includeGroup: string[];
  excludeGroup: string[];
  accountGroup: string[];
  flags: string[];
}

const uniqueTrimmed = (items: string[]): string[] => {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const item of items) {
    const value = item.trim();
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(value);
  }

  return result;
};

const escapeTerm = (value: string): string => value.replace(/"/g, '\\"');

const normalizeAccount = (value: string): string => value.replace(/^@/, '').trim();

const wrapSearchTerm = (value: string): string => {
  const escaped = escapeTerm(value);
  if (/^[#a-zA-Z0-9_:.+-]+$/u.test(escaped)) return escaped;
  return `"${escaped}"`;
};

const buildOrGroup = (values: string[]): string => {
  if (values.length === 0) return '';
  if (values.length === 1) return values[0];
  return `(${values.join(' OR ')})`;
};

export const hasIncludeCriteria = (
  theme: Pick<ThemeSet, 'includeKeywords' | 'includeAccounts'>
): boolean => theme.includeKeywords.length > 0 || theme.includeAccounts.length > 0;

export const buildSearchQuery = (
  theme: Pick<
    ThemeSet,
    | 'includeKeywords'
    | 'excludeKeywords'
    | 'includeAccounts'
    | 'language'
    | 'hideRetweets'
    | 'hideReplies'
  >
): string => {
  const includeTerms = uniqueTrimmed(theme.includeKeywords).map(wrapSearchTerm);
  const accountTerms = uniqueTrimmed(theme.includeAccounts.map(normalizeAccount))
    .filter(Boolean)
    .map((account) => `from:${account}`);
  const excludeTerms = uniqueTrimmed(theme.excludeKeywords).map(wrapSearchTerm);

  const clauses: string[] = [];
  const includeGroups: string[] = [];

  if (includeTerms.length > 0) includeGroups.push(buildOrGroup(includeTerms));
  if (accountTerms.length > 0) includeGroups.push(buildOrGroup(accountTerms));

  if (includeGroups.length === 1) {
    clauses.push(includeGroups[0]);
  } else if (includeGroups.length > 1) {
    clauses.push(`(${includeGroups.join(' OR ')})`);
  }

  if (excludeTerms.length > 0) {
    clauses.push(`-${buildOrGroup(excludeTerms)}`);
  }

  if (theme.language !== 'all') {
    clauses.push(`lang:${theme.language}`);
  }

  if (theme.hideRetweets) {
    clauses.push('-is:retweet');
  }

  if (theme.hideReplies) {
    clauses.push('-is:reply');
  }

  return clauses.join(' ').replace(/\s+/g, ' ').trim();
};

export const buildSearchQueryDebugInfo = (
  theme: Pick<
    ThemeSet,
    | 'includeKeywords'
    | 'excludeKeywords'
    | 'includeAccounts'
    | 'language'
    | 'hideRetweets'
    | 'hideReplies'
  >
): QueryBuildDebugInfo => {
  const includeGroup = uniqueTrimmed(theme.includeKeywords).map(wrapSearchTerm);
  const excludeGroup = uniqueTrimmed(theme.excludeKeywords).map(wrapSearchTerm);
  const accountGroup = uniqueTrimmed(theme.includeAccounts.map(normalizeAccount))
    .filter(Boolean)
    .map((account) => `from:${account}`);

  const flags: string[] = [];
  if (theme.language !== 'all') flags.push(`lang:${theme.language}`);
  if (theme.hideRetweets) flags.push('-is:retweet');
  if (theme.hideReplies) flags.push('-is:reply');

  return { includeGroup, excludeGroup, accountGroup, flags };
};

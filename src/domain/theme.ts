import { z } from 'zod';

export const themeLanguageSchema = z.enum(['ja', 'en', 'all']);

export const themeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  includeKeywords: z.array(z.string()),
  excludeKeywords: z.array(z.string()),
  includeAccounts: z.array(z.string()),
  language: themeLanguageSchema,
  hideRetweets: z.boolean(),
  hideReplies: z.boolean(),
  safeMode: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type ThemeSet = z.infer<typeof themeSchema>;
export type ThemeLanguage = z.infer<typeof themeLanguageSchema>;
export type ThemeDraft = Omit<ThemeSet, 'id' | 'createdAt' | 'updatedAt'>;

export const sanitizeStringArray = (values: string[]): string[] => {
  const seen = new Set<string>();
  const sanitized: string[] = [];

  for (const value of values) {
    const normalized = value.trim();
    if (!normalized) continue;

    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    sanitized.push(normalized);
  }

  return sanitized;
};

export const parseCommaSeparated = (input: string): string[] =>
  sanitizeStringArray(input.split(',').map((value) => value.trim()));

export const formatCommaSeparated = (values: string[]): string => values.join(', ');

export const createThemeId = (): string =>
  `theme_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export const sanitizeThemeDraft = (draft: ThemeDraft): ThemeDraft => ({
  ...draft,
  name: draft.name.trim(),
  includeKeywords: sanitizeStringArray(draft.includeKeywords),
  excludeKeywords: sanitizeStringArray(draft.excludeKeywords),
  includeAccounts: sanitizeStringArray(
    draft.includeAccounts.map((account) => account.replace(/^@/, ''))
  ),
});

export const createTheme = (draft: ThemeDraft, id: string = createThemeId()): ThemeSet => {
  const now = new Date().toISOString();
  const sanitizedDraft = sanitizeThemeDraft(draft);

  return themeSchema.parse({
    ...sanitizedDraft,
    id,
    createdAt: now,
    updatedAt: now,
  });
};

export const cloneTheme = (theme: ThemeSet): ThemeSet => {
  const now = new Date().toISOString();
  return themeSchema.parse({
    ...theme,
    id: createThemeId(),
    name: `${theme.name} のコピー`,
    createdAt: now,
    updatedAt: now,
  });
};

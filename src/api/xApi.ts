import { env } from '@/src/config/env';
import { type PagedPosts, type PostAuthor, type PostMedia, type XPost } from '@/src/domain/post';
import { XApiError } from '@/src/api/xErrors';

interface RawTweet {
  id: string;
  text?: string;
  author_id?: string;
  created_at?: string;
  lang?: string;
  possibly_sensitive?: boolean;
  attachments?: {
    media_keys?: string[];
  };
  referenced_tweets?: Array<{
    type: 'retweeted' | 'replied_to' | 'quoted';
    id: string;
  }>;
}

interface RawUser {
  id: string;
  name?: string;
  username?: string;
  profile_image_url?: string;
}

interface RawMedia {
  media_key: string;
  type?: 'photo' | 'video' | 'animated_gif';
  url?: string;
  preview_image_url?: string;
}

interface SearchRecentResponse {
  data?: RawTweet[];
  includes?: {
    users?: RawUser[];
    media?: RawMedia[];
  };
  meta?: {
    next_token?: string;
    result_count?: number;
  };
}

interface CurrentUserResponse {
  data?: RawUser;
}

interface FollowingResponse {
  data?: RawUser[];
}

interface XApiErrorPayload {
  title?: string;
  detail?: string;
  type?: string;
  errors?: Array<{
    title?: string;
    detail?: string;
    type?: string;
  }>;
}

const resolveErrorKind = (status: number): XApiError['kind'] => {
  if (status === 400) return 'bad_request';
  if (status === 401) return 'unauthorized';
  if (status === 403) return 'forbidden';
  if (status === 429) return 'rate_limit';
  return 'unknown';
};

const getApiErrorMessage = (status: number): string => {
  if (status === 400) return 'X API へのリクエストが不正です。';
  if (status === 401) return '認証の有効期限が切れているか、認証に失敗しました。';
  if (status === 403) return 'X API へのアクセスが拒否されました。';
  if (status === 429) return 'X API のレート制限に達しました。しばらくしてからお試しください。';
  return `X API へのリクエストに失敗しました (ステータス: ${status})。`;
};

const createApiError = (status: number, payload: unknown): XApiError => {
  const parsedPayload = (payload ?? {}) as XApiErrorPayload;
  const firstError = parsedPayload.errors?.[0];

  const title = firstError?.title ?? parsedPayload.title;
  const detail = firstError?.detail ?? parsedPayload.detail;
  const code = firstError?.type ?? parsedPayload.type;
  const kind = resolveErrorKind(status);
  const message = getApiErrorMessage(status);

  return new XApiError(message, {
    status,
    kind,
    title,
    detail,
    code,
  });
};

const buildUrl = (path: string, params?: Record<string, string | undefined>): string => {
  const base = env.apiBaseUrl.endsWith('/') ? env.apiBaseUrl.slice(0, -1) : env.apiBaseUrl;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${base}${normalizedPath}`);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'undefined') continue;
      url.searchParams.set(key, value);
    }
  }

  return url.toString();
};

const xFetch = async <T>(
  path: string,
  token: string,
  params?: Record<string, string | undefined>
): Promise<T> => {
  let response: Response;

  try {
    response = await fetch(buildUrl(path, params), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  } catch {
    throw new XApiError('X API との通信中にネットワークエラーが発生しました。', {
      status: 0,
      kind: 'network',
    });
  }

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw createApiError(response.status, payload);
  }

  return payload as T;
};

const mapMediaType = (media?: RawMedia['type']): PostMedia['type'] => {
  if (media === 'photo' || media === 'video' || media === 'animated_gif') return media;
  return 'unknown';
};

const mapPost = (
  raw: RawTweet,
  userById: Map<string, RawUser>,
  mediaByKey: Map<string, RawMedia>
): XPost => {
  const authorRaw = raw.author_id ? userById.get(raw.author_id) : undefined;
  const author: PostAuthor | undefined =
    authorRaw && authorRaw.username
      ? {
          id: authorRaw.id,
          name: authorRaw.name ?? authorRaw.username,
          username: authorRaw.username,
          profileImageUrl: authorRaw.profile_image_url,
        }
      : undefined;

  const media: PostMedia[] = (raw.attachments?.media_keys ?? [])
    .map((key) => {
      const item = mediaByKey.get(key);
      if (!item) return null;

      const mediaUrl = item.url ?? item.preview_image_url;
      if (!mediaUrl) return null;

      return {
        key,
        type: mapMediaType(item.type),
        url: mediaUrl,
      };
    })
    .filter((item): item is PostMedia => Boolean(item));

  const username = author?.username;
  const url = username
    ? `https://x.com/${username}/status/${raw.id}`
    : `https://x.com/i/web/status/${raw.id}`;

  return {
    id: raw.id,
    text: raw.text ?? '',
    createdAt: raw.created_at,
    lang: raw.lang,
    possiblySensitive: raw.possibly_sensitive,
    isReply: raw.referenced_tweets?.some((tweet) => tweet.type === 'replied_to') ?? false,
    isRetweet: raw.referenced_tweets?.some((tweet) => tweet.type === 'retweeted') ?? false,
    author,
    media,
    url,
  };
};

export interface SearchRecentParams {
  token: string;
  query: string;
  nextToken?: string;
  maxResults?: number;
}

export const searchRecentTweets = async ({
  token,
  query,
  nextToken,
  maxResults = env.maxResults,
}: SearchRecentParams): Promise<PagedPosts> => {
  const payload = await xFetch<SearchRecentResponse>('/tweets/search/recent', token, {
    query,
    max_results: String(maxResults),
    next_token: nextToken,
    expansions: 'author_id,attachments.media_keys',
    'tweet.fields': 'created_at,lang,author_id,possibly_sensitive,referenced_tweets,attachments',
    'user.fields': 'name,username,profile_image_url',
    'media.fields': 'type,url,preview_image_url',
  });

  const users = payload.includes?.users ?? [];
  const media = payload.includes?.media ?? [];

  const userById = new Map(users.map((user) => [user.id, user]));
  const mediaByKey = new Map(media.map((item) => [item.media_key, item]));
  const posts = (payload.data ?? []).map((item) => mapPost(item, userById, mediaByKey));

  return {
    posts,
    nextToken: payload.meta?.next_token,
    resultCount: payload.meta?.result_count ?? posts.length,
  };
};

export interface XCurrentUser {
  id: string;
  name: string;
  username: string;
  profileImageUrl?: string;
}

export const getCurrentUser = async (token: string): Promise<XCurrentUser> => {
  const payload = await xFetch<CurrentUserResponse>('/users/me', token, {
    'user.fields': 'name,username,profile_image_url',
  });

  const user = payload.data;
  if (!user || !user.username) {
    throw new XApiError('X API から認証済みユーザープロフィールを取得できませんでした。', {
      status: 500,
      kind: 'unknown',
    });
  }

  return {
    id: user.id,
    name: user.name ?? user.username,
    username: user.username,
    profileImageUrl: user.profile_image_url,
  };
};

export const getFollowingAccounts = async (token: string, userId: string): Promise<string[]> => {
  const payload = await xFetch<FollowingResponse>(`/users/${userId}/following`, token, {
    max_results: '100',
    'user.fields': 'username',
  });

  const usernames = (payload.data ?? [])
    .map((user) => user.username?.trim())
    .filter((username): username is string => Boolean(username));

  return usernames;
};

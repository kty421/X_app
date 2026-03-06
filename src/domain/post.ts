export type PostMediaType = 'photo' | 'video' | 'animated_gif' | 'unknown';

export interface PostMedia {
  key: string;
  type: PostMediaType;
  url: string;
}

export interface PostAuthor {
  id: string;
  name: string;
  username: string;
  profileImageUrl?: string;
}

export interface XPost {
  id: string;
  text: string;
  createdAt?: string;
  lang?: string;
  url: string;
  author?: PostAuthor;
  media: PostMedia[];
  possiblySensitive?: boolean;
  isReply?: boolean;
  isRetweet?: boolean;
}

export interface PagedPosts {
  posts: XPost[];
  nextToken?: string;
  resultCount: number;
}


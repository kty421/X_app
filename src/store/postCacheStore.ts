import { create } from 'zustand';

import { type XPost } from '@/src/domain/post';

interface PostCacheStoreState {
  postsById: Record<string, XPost>;
  putPost: (post: XPost) => void;
  putPosts: (posts: XPost[]) => void;
  getPostById: (id: string) => XPost | undefined;
  clear: () => void;
}

export const usePostCacheStore = create<PostCacheStoreState>((set, get) => ({
  postsById: {},
  putPost: (post) => {
    set((state) => ({
      postsById: {
        ...state.postsById,
        [post.id]: post,
      },
    }));
  },
  putPosts: (posts) => {
    set((state) => {
      const next = { ...state.postsById };
      for (const post of posts) {
        next[post.id] = post;
      }
      return { postsById: next };
    });
  },
  getPostById: (id) => get().postsById[id],
  clear: () => set({ postsById: {} }),
}));


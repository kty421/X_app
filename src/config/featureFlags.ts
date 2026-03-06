import { env } from '@/src/config/env';

export const featureFlags = {
  enableFollowingBasedSearch: env.featureFollowingSource,
};


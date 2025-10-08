export const CACHE_TAGS = {
  blogList: "blog:list",
  blogPost: (id: string) => `blog:post:${id}`,
} as const;

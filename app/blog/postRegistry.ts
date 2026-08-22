import { posts as existingPosts, type Post } from "./articleData";
import { batch4Posts } from "./batch4Data";
import { batch5Posts } from "./batch5Data";
import { batch6Posts } from "./batch6Data";
import { batch7Posts } from "./batch7Data";
import { hubPosts } from "./hubData";

export { hubPosts };

export const posts: Post[] = [
  ...hubPosts,
  ...batch7Posts,
  ...batch6Posts,
  ...batch5Posts,
  ...batch4Posts,
  ...existingPosts,
];

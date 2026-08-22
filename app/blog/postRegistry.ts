import { posts as existingPosts, type Post } from "./articleData";
import { batch4Posts } from "./batch4Data";

export const posts: Post[] = [...batch4Posts, ...existingPosts];

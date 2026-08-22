import { posts as existingPosts, type Post } from "./articleData";
import { batch4Posts } from "./batch4Data";
import { batch5Posts } from "./batch5Data";

export const posts: Post[] = [...batch5Posts, ...batch4Posts, ...existingPosts];

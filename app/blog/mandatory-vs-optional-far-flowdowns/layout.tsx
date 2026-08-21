import type { ReactNode } from "react";
import { createPublicMetadata } from "@/lib/seo";

export const metadata = createPublicMetadata("/blog/mandatory-vs-optional-far-flowdowns");

export default function ArticleLayout({ children }: { children: ReactNode }) {
  return children;
}

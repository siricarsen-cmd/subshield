import type { ReactNode } from "react";
import { createPublicMetadata } from "@/lib/seo";

export const metadata = createPublicMetadata("/blog/understanding-far-flow-down-clauses");

export default function ArticleLayout({ children }: { children: ReactNode }) {
  return children;
}

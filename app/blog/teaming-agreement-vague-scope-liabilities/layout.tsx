import type { ReactNode } from "react";
import { createPublicMetadata } from "@/lib/seo";

export const metadata = createPublicMetadata("/blog/teaming-agreement-vague-scope-liabilities");

export default function ArticleLayout({ children }: { children: ReactNode }) {
  return children;
}

import type { ReactNode } from "react";
import { createPublicMetadata } from "@/lib/seo";

export const metadata = createPublicMetadata("/blog/fighting-liquidated-damages-delay-claims");

export default function ArticleLayout({ children }: { children: ReactNode }) {
  return children;
}

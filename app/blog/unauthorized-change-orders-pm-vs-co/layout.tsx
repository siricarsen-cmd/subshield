import type { ReactNode } from "react";
import { createPublicMetadata } from "@/lib/seo";

export const metadata = createPublicMetadata("/blog/unauthorized-change-orders-pm-vs-co");

export default function ArticleLayout({ children }: { children: ReactNode }) {
  return children;
}

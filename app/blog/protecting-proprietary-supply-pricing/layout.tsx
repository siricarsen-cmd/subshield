import type { ReactNode } from "react";
import { createPublicMetadata } from "@/lib/seo";

export const metadata = createPublicMetadata("/blog/protecting-proprietary-supply-pricing");

export default function ArticleLayout({ children }: { children: ReactNode }) {
  return children;
}

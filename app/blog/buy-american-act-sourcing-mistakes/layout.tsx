import type { ReactNode } from "react";
import { createPublicMetadata } from "@/lib/seo";

export const metadata = createPublicMetadata("/blog/buy-american-act-sourcing-mistakes");

export default function ArticleLayout({ children }: { children: ReactNode }) {
  return children;
}

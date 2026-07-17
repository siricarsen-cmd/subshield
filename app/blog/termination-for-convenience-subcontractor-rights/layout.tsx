import type { ReactNode } from "react";
import { createPublicMetadata } from "@/lib/seo";

export const metadata = createPublicMetadata("/blog/termination-for-convenience-subcontractor-rights");

export default function ArticleLayout({ children }: { children: ReactNode }) {
  return children;
}

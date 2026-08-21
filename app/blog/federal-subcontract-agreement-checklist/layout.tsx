import type { ReactNode } from "react";
import { createPublicMetadata } from "@/lib/seo";

export const metadata = createPublicMetadata("/blog/federal-subcontract-agreement-checklist");

export default function ArticleLayout({ children }: { children: ReactNode }) {
  return children;
}

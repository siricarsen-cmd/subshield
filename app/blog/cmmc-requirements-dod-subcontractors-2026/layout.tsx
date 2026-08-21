import type { ReactNode } from "react";
import { createPublicMetadata } from "@/lib/seo";

export const metadata = createPublicMetadata("/blog/cmmc-requirements-dod-subcontractors-2026");

export default function ArticleLayout({ children }: { children: ReactNode }) {
  return children;
}

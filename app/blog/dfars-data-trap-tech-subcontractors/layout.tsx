import type { ReactNode } from "react";
import { createPublicMetadata } from "@/lib/seo";

export const metadata = createPublicMetadata("/blog/dfars-data-trap-tech-subcontractors");

export default function ArticleLayout({ children }: { children: ReactNode }) {
  return children;
}

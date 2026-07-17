import type { ReactNode } from "react";
import { createPublicMetadata } from "@/lib/seo";

export const metadata = createPublicMetadata("/blog/protecting-small-subcontractor-margins");

export default function ArticleLayout({ children }: { children: ReactNode }) {
  return children;
}

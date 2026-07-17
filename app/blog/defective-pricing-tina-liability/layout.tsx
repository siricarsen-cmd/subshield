import type { ReactNode } from "react";
import { createPublicMetadata } from "@/lib/seo";

export const metadata = createPublicMetadata("/blog/defective-pricing-tina-liability");

export default function ArticleLayout({ children }: { children: ReactNode }) {
  return children;
}

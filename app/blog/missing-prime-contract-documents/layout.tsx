import type { ReactNode } from "react";
import { createPublicMetadata } from "@/lib/seo";

export const metadata = createPublicMetadata("/blog/missing-prime-contract-documents");

export default function ArticleLayout({ children }: { children: ReactNode }) {
  return children;
}

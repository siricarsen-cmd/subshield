import type { ReactNode } from "react";
import { createPublicMetadata } from "@/lib/seo";

export const metadata = createPublicMetadata("/blog/broad-form-indemnification-subcontractor-vulnerabilities");

export default function ArticleLayout({ children }: { children: ReactNode }) {
  return children;
}

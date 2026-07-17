import type { ReactNode } from "react";
import { createPublicMetadata } from "@/lib/seo";

export const metadata = createPublicMetadata("/blog/government-contracting-payment-traps");

export default function ArticleLayout({ children }: { children: ReactNode }) {
  return children;
}

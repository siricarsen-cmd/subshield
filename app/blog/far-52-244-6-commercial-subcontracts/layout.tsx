import type { ReactNode } from "react";
import { createPublicMetadata } from "@/lib/seo";

export const metadata = createPublicMetadata("/blog/far-52-244-6-commercial-subcontracts");

export default function ArticleLayout({ children }: { children: ReactNode }) {
  return children;
}

import type { ReactNode } from "react";
import { createPublicMetadata } from "@/lib/seo";

export const metadata = createPublicMetadata("/blog/change-order-release-trap");

export default function ArticleLayout({ children }: { children: ReactNode }) {
  return children;
}

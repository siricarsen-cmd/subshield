import type { ReactNode } from "react";
import { createPublicMetadata } from "@/lib/seo";

export const metadata = createPublicMetadata("/blog/request-for-equitable-adjustment-under-far");

export default function ArticleLayout({ children }: { children: ReactNode }) {
  return children;
}

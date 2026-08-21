import type { ReactNode } from "react";
import { createPublicMetadata } from "@/lib/seo";

export const metadata = createPublicMetadata("/blog/cmmc-level-1-vs-level-2");

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}

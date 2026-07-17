import type { ReactNode } from "react";
import { createPublicMetadata } from "@/lib/seo";

export const metadata = createPublicMetadata("/about");

export default function AboutLayout({ children }: { children: ReactNode }) {
  return children;
}

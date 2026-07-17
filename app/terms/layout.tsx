import type { ReactNode } from "react";
import { createPublicMetadata } from "@/lib/seo";

export const metadata = createPublicMetadata("/terms");

export default function TermsLayout({ children }: { children: ReactNode }) {
  return children;
}

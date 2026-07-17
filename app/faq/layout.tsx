import type { ReactNode } from "react";
import { createPublicMetadata } from "@/lib/seo";

export const metadata = createPublicMetadata("/faq");

export default function FaqLayout({ children }: { children: ReactNode }) {
  return children;
}

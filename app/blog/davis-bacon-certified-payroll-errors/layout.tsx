import type { ReactNode } from "react";
import { createPublicMetadata } from "@/lib/seo";

export const metadata = createPublicMetadata("/blog/davis-bacon-certified-payroll-errors");

export default function ArticleLayout({ children }: { children: ReactNode }) {
  return children;
}

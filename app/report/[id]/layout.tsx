import type { ReactNode } from "react";
import { createPrivateMetadata } from "@/lib/seo";

export const metadata = createPrivateMetadata("Private Risk Report");

export default function ReportLayout({ children }: { children: ReactNode }) {
  return children;
}

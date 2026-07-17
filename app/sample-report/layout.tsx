import type { ReactNode } from "react";
import { createPublicMetadata } from "@/lib/seo";

export const metadata = createPublicMetadata("/sample-report");

export default function SampleReportLayout({ children }: { children: ReactNode }) {
  return children;
}

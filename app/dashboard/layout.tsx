import type { ReactNode } from "react";
import { createPrivateMetadata } from "@/lib/seo";

export const metadata = createPrivateMetadata("Dashboard");

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return children;
}

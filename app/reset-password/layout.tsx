import type { ReactNode } from "react";
import { createPrivateMetadata } from "@/lib/seo";

export const metadata = createPrivateMetadata("Set New Password");

export default function ResetPasswordLayout({ children }: { children: ReactNode }) {
  return children;
}

import type { ReactNode } from "react";
import { createPrivateMetadata } from "@/lib/seo";

export const metadata = createPrivateMetadata("Reset Password");

export default function ForgotPasswordLayout({ children }: { children: ReactNode }) {
  return children;
}

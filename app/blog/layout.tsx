import type { ReactNode } from "react";
import type { Metadata } from "next";
import { SITE_NAME, createPublicMetadata, getPublicRoute } from "@/lib/seo";
import { LegacyTopicHubCallout } from "./components/LegacyTopicHubCallout";

const blogRoute = getPublicRoute("/blog");

export const metadata: Metadata = {
  ...createPublicMetadata(blogRoute.path),
  title: {
    default: blogRoute.title,
    template: `%s | ${SITE_NAME}`,
  },
};

export default function BlogLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <LegacyTopicHubCallout />
    </>
  );
}

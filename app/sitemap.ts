import type { MetadataRoute } from "next";
import { publicRoutes, siteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  return publicRoutes.map(({ path, changeFrequency, priority }) => ({
    url: siteUrl(path),
    changeFrequency,
    priority,
  }));
}

import { TopicHubPage } from "../components/TopicHubPage";
import { createPublicMetadata } from "@/lib/seo";

export const metadata = createPublicMetadata("/blog/dod-data-rights-audit-hub");

export default function Page() {
  return <TopicHubPage slug="dod-data-rights-audit-hub" />;
}

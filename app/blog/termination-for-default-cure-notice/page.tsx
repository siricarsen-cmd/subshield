import { BatchArticlePage } from "../components/BatchArticlePage";
import { createPublicMetadata } from "@/lib/seo";

export const metadata = createPublicMetadata("/blog/termination-for-default-cure-notice");
export default function Page() { return <BatchArticlePage slug="termination-for-default-cure-notice" />; }

import { BatchArticlePage } from "../components/BatchArticlePage";
import { createPublicMetadata } from "@/lib/seo";

export const metadata = createPublicMetadata("/blog/subcontract-notice-deadlines");
export default function Page() { return <BatchArticlePage slug="subcontract-notice-deadlines" />; }

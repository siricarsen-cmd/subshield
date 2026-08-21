import { BatchArticlePage } from "../components/BatchArticlePage";
import { createPublicMetadata } from "@/lib/seo";

export const metadata = createPublicMetadata("/blog/similarly-situated-entity-rule");
export default function Page() { return <BatchArticlePage slug="similarly-situated-entity-rule" />; }

import { BatchArticlePage } from "../components/BatchArticlePage";
import { createPublicMetadata } from "@/lib/seo";

export const metadata = createPublicMetadata("/blog/subcontractor-pass-through-claims");
export default function Page() { return <BatchArticlePage slug="subcontractor-pass-through-claims" />; }

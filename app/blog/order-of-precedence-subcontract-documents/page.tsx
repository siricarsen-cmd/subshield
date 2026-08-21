import { BatchArticlePage } from "../components/BatchArticlePage";
import { createPublicMetadata } from "@/lib/seo";

export const metadata = createPublicMetadata("/blog/order-of-precedence-subcontract-documents");
export default function Page() { return <BatchArticlePage slug="order-of-precedence-subcontract-documents" />; }

import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/page-placeholder";
import { NAVIGATION } from "@/lib/navigation";

const page = NAVIGATION[3];
export const metadata: Metadata = { title: page.label };

export default function Page() {
  return <PagePlaceholder page={page} />;
}

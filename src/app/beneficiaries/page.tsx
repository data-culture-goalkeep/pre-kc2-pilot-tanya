import type { Metadata } from "next";
import { BeneficiariesView } from "@/components/beneficiaries-view";
import { summarizeBeneficiary, type BeneficiarySummary } from "@/lib/beneficiaries";
import { getBeneficiaries } from "@/lib/queries/beneficiaries";

export const metadata: Metadata = { title: "Beneficiaries" };
// Keep this literal: Next.js requires a statically analyzable route setting.
export const revalidate = 60;

export default async function Page() {
  let rows: BeneficiarySummary[] = [];
  let message: string | undefined;
  try {
    rows = (await getBeneficiaries()).map(summarizeBeneficiary);
  } catch (error) {
    message = error instanceof Error ? error.message : "Could not load beneficiaries. Please try again.";
  }
  return <BeneficiariesView rows={rows} error={message} />;
}

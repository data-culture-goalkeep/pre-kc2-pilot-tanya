import { MONTHS, currentIndiaMonth, currentIndiaFinancialYear } from "@/lib/daycare";
import type { Database } from "@/types/database";

export { MONTHS, currentIndiaMonth };
export const HOSPITAL_FILTERS = ["Metro Care Hospital A", "Metro Care Hospital B", "Metro Care Hospital C", "Metro Care Hospital D"] as const satisfies readonly Database["public"]["Enums"]["hospital_enum"][];
export const HOSPITAL_WARDS = ["General Ward", "Hematology Ward", "Pediatric Ward", "Ward A", "Ward B"] as const satisfies readonly Database["public"]["Enums"]["ward_enum"][];
export const HOSPITAL_FISCAL_MONTHS = ["April", "May", "June", "July", "August", "September", "October", "November", "December", "January", "February", "March"] as const;
export { currentIndiaFinancialYear };
export type HospitalFilters = { financial_year: string; month: string; hospital: string };

export function hospitalMonthOptions(financialYear: string) {
  if (!/^\d{4}-\d{2}$/.test(financialYear)) return [...HOSPITAL_FISCAL_MONTHS];
  const startYear = Number(financialYear.slice(0, 4));
  return HOSPITAL_FISCAL_MONTHS.map((month, index) => ({
    value: month,
    label: `${month} ${index < 9 ? startYear : startYear + 1}`,
  }));
}

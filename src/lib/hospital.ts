import { MONTHS, currentIndiaMonth } from "@/lib/daycare";
import type { Database } from "@/types/database";

export { MONTHS, currentIndiaMonth };
export const HOSPITAL_FILTERS = ["Metro Care Hospital A", "Metro Care Hospital B", "Metro Care Hospital C", "Metro Care Hospital D"] as const satisfies readonly Database["public"]["Enums"]["hospital_enum"][];
export const HOSPITAL_WARDS = ["General Ward", "Hematology Ward", "Pediatric Ward", "Ward A", "Ward B"] as const satisfies readonly Database["public"]["Enums"]["ward_enum"][];
export type HospitalFilters = { month: string; hospital: string };

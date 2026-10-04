import type { Database } from "@/types/database";

export type Beneficiary = Database["public"]["Tables"]["beneficiaries"]["Row"];
export type BeneficiarySummary = Pick<Beneficiary, "beneficiary_id" | "name_of_child" | "program" | "date_of_birth" | "status" | "primary_mobile_no" | "location">;
export const PROGRAMS = ["Daycare", "Homecare"] as const;
export const STATUSES = ["Active", "Deceased"] as const;
export const EXIT_STATUSES: readonly string[] = ["Deceased"];
export const HOSPITALS = ["Metro Care Hospital A", "Metro Care Hospital B", "Metro Care Hospital C", "Metro Care Hospital D"] as const satisfies readonly Database["public"]["Enums"]["hospital_enum"][];
export const WARDS = ["General Ward", "Hematology Ward", "Pediatric Ward", "Ward A", "Ward B"] as const satisfies readonly Database["public"]["Enums"]["ward_enum"][];
export const MANUAL_ENTRY = { source_file: "Happy Feet Dashboard", source_sheet: "Manual Entry" } as const;
export const BENEFICIARIES_PATH = "/beneficiaries";
export const DATA_REVALIDATE_SECONDS = 60;
export const DATABASE_BATCH_SIZE = 500;
export const TABLE_PAGE_SIZE = 20;
export const MAX_SOURCE_ROW_ATTEMPTS = 5;
export const MAX_POSTGRES_INTEGER = 2147483647;
export const SOURCE_ROW_CONSTRAINT = "beneficiaries_source_row_uq";

export const BENEFICIARY_COLUMNS = [
  "beneficiary_id", "registration_date", "name_of_child", "program", "primary_diagnosis", "sub_diagnosis", "gender", "level_of_care", "location", "address", "date_of_birth", "age", "primary_mobile_no", "secondary_mobile_no", "current_status_life_goals", "life_goals_discontinued_date", "family_occupation", "family_members", "interested_in_daycare_program", "hospital", "ward_department", "status", "exit_date", "job_description", "financially_independent", "salary_per_month", "notes", "source_used", "verification_from_goalkeep", "verification_from_hfh", "doubt_from_goalkeep", "hfh_comments", "source_file", "source_sheet", "source_row",
] as const satisfies readonly (keyof Beneficiary)[];

export type BeneficiaryFilters = { search: string; program: string; status: string };
export const EMPTY_FILTERS: BeneficiaryFilters = { search: "", program: "", status: "" };

export function filterBeneficiaries<T extends BeneficiarySummary>(rows: T[], filters: BeneficiaryFilters): T[] {
  const query = filters.search.trim().toLocaleLowerCase();
  return rows.filter((row) =>
    (!filters.program || row.program === filters.program) &&
    (!filters.status || row.status === filters.status) &&
    (!query || [row.beneficiary_id, row.name_of_child, row.location, row.primary_mobile_no].some((value) => value?.toLocaleLowerCase().includes(query))),
  );
}

export function summarizeBeneficiary(row: Beneficiary): BeneficiarySummary {
  const { beneficiary_id, name_of_child, program, date_of_birth, status, primary_mobile_no, location } = row;
  return { beneficiary_id, name_of_child, program, date_of_birth, status, primary_mobile_no, location };
}

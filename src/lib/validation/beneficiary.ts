import { EXIT_STATUSES, HOSPITALS, PROGRAMS, STATUSES, WARDS } from "@/lib/beneficiaries";
import type { Database } from "@/types/database";

export const FIELD_LIMITS = { beneficiary_id: 100, name_of_child: 150, primary_mobile_no: 40, secondary_mobile_no: 40, location: 200, gender: 40, primary_diagnosis: 500, sub_diagnosis: 500, level_of_care: 200, address: 2000, family_occupation: 500, family_members: 500, interested_in_daycare_program: 200, notes: 5000 } as const;
export const OPTIONAL_TEXT_FIELDS = ["gender", "primary_diagnosis", "sub_diagnosis", "level_of_care", "location", "address", "primary_mobile_no", "secondary_mobile_no", "family_occupation", "family_members", "interested_in_daycare_program", "notes"] as const;
export const BENEFICIARY_FORM_FIELDS = ["beneficiary_id", "name_of_child", "program", "date_of_birth", "status", "hospital", "ward_department", "exit_date", ...OPTIONAL_TEXT_FIELDS] as const;
export type BeneficiaryFormField = (typeof BENEFICIARY_FORM_FIELDS)[number];
export type BeneficiaryInput = Record<(typeof OPTIONAL_TEXT_FIELDS)[number], string | null> & {
  beneficiary_id: string; name_of_child: string; program: (typeof PROGRAMS)[number];
  date_of_birth: string; status: (typeof STATUSES)[number]; registration_date: string; age: number;
  hospital: Database["public"]["Enums"]["hospital_enum"] | null;
  ward_department: Database["public"]["Enums"]["ward_enum"] | null; exit_date: string | null;
};
export type FieldErrors = Partial<Record<BeneficiaryFormField, string>>;
export type BeneficiarySaveResult = { ok: true } | { ok: false; error: string; fieldErrors?: FieldErrors };
export function todayInIndia() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}
function validDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}
export function ageAtDate(dob: string, today: string) {
  const [year, month, day] = dob.split("-").map(Number);
  const [currentYear, currentMonth, currentDay] = today.split("-").map(Number);
  return currentYear - year - Number(currentMonth < month || (currentMonth === month && currentDay < day));
}
export function validateBeneficiary(values: Record<string, unknown>, today = todayInIndia()): { input: BeneficiaryInput; errors: FieldErrors } {
  const read = (field: string) => typeof values[field] === "string" ? values[field].trim() : "";
  const id = read("beneficiary_id"), name = read("name_of_child"), program = read("program"), status = read("status"), dob = read("date_of_birth");
  const exit = EXIT_STATUSES.includes(status) ? read("exit_date") : "";
  const errors: FieldErrors = {};
  if (!name) errors.name_of_child = "Enter the child’s name.";
  if (!PROGRAMS.some(value => value === program)) errors.program = "Choose Daycare or Homecare.";
  if (!STATUSES.some(value => value === status)) errors.status = "Choose a status.";
  if (!dob) errors.date_of_birth = "Enter the date of birth.";
  else if (!validDate(dob) || dob > today) errors.date_of_birth = "Enter a valid date of birth that is not in the future.";
  for (const [field, limit] of Object.entries(FIELD_LIMITS)) if (read(field).length > limit) errors[field as keyof typeof FIELD_LIMITS] = `Use ${limit} characters or fewer.`;
  for (const field of ["primary_mobile_no", "secondary_mobile_no"] as const) if (read(field) && !/^\+?[\d\s()-]+$/.test(read(field))) errors[field] = "Use digits, spaces, parentheses, a leading +, or hyphens.";
  for (const [field, choices] of [["hospital", HOSPITALS], ["ward_department", WARDS]] as const) if (read(field) && !choices.some(value => value === read(field))) errors[field] = "Choose an available option.";
  if (exit && (!validDate(exit) || exit > today || (validDate(dob) && exit < dob))) errors.exit_date = "Enter a valid exit date between birth and today.";
  const optional = Object.fromEntries(OPTIONAL_TEXT_FIELDS.map(field => [field, read(field) || null])) as Record<(typeof OPTIONAL_TEXT_FIELDS)[number], string | null>;
  return { input: { ...optional, beneficiary_id: id, name_of_child: name, program: program as BeneficiaryInput["program"], status: status as BeneficiaryInput["status"], date_of_birth: dob, registration_date: today, age: errors.date_of_birth ? 0 : ageAtDate(dob, today), hospital: read("hospital") as BeneficiaryInput["hospital"] || null, ward_department: read("ward_department") as BeneficiaryInput["ward_department"] || null, exit_date: exit || null }, errors };
}

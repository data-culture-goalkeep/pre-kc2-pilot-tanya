import { PROGRAMS, STATUSES } from "@/lib/beneficiaries";

export const FIELD_LIMITS = { beneficiary_id: 100, name_of_child: 150, primary_mobile_no: 40, location: 200 } as const;
export const BENEFICIARY_FORM_FIELDS = ["beneficiary_id", "name_of_child", "program", "date_of_birth", "status", "primary_mobile_no", "location"] as const;
export type BeneficiaryFormField = (typeof BENEFICIARY_FORM_FIELDS)[number];
export type BeneficiaryInput = {
  beneficiary_id: string;
  name_of_child: string;
  program: (typeof PROGRAMS)[number];
  date_of_birth: string | null;
  status: (typeof STATUSES)[number];
  primary_mobile_no: string | null;
  location: string | null;
};
export type FieldErrors = Partial<Record<BeneficiaryFormField, string>>;
export type BeneficiarySaveResult = { ok: true } | { ok: false; error: string; fieldErrors?: FieldErrors };

export function todayInIndia() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

export function validateBeneficiary(values: Record<string, unknown>, today = todayInIndia()): { input: BeneficiaryInput; errors: FieldErrors } {
  const read = (field: string) => typeof values[field] === "string" ? values[field].trim() : "";
  const id = read("beneficiary_id"), name = read("name_of_child"), program = read("program"), status = read("status"), dob = read("date_of_birth"), phone = read("primary_mobile_no"), location = read("location");
  const errors: FieldErrors = {};
  if (!id) errors.beneficiary_id = "Enter a beneficiary ID.";
  if (!name) errors.name_of_child = "Enter the child’s name.";
  if (!PROGRAMS.some((value) => value === program)) errors.program = "Choose Daycare or Homecare.";
  if (!STATUSES.some((value) => value === status)) errors.status = "Choose a status.";
  for (const [field, limit] of Object.entries(FIELD_LIMITS)) {
    if (read(field).length > limit) errors[field as keyof typeof FIELD_LIMITS] = `Use ${limit} characters or fewer.`;
  }
  if (dob && (!/^\d{4}-\d{2}-\d{2}$/.test(dob) || !Number.isFinite(Date.parse(dob)) || new Date(dob).toISOString().slice(0, 10) !== dob || dob > today)) errors.date_of_birth = "Enter a valid date of birth that is not in the future.";
  if (phone && !/^\+?[\d\s()-]+$/.test(phone)) errors.primary_mobile_no = "Use digits, spaces, parentheses, a leading +, or hyphens.";
  return { input: { beneficiary_id: id, name_of_child: name, program: program as BeneficiaryInput["program"], status: status as BeneficiaryInput["status"], date_of_birth: dob || null, primary_mobile_no: phone || null, location: location || null }, errors };
}

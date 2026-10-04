"use client";

import { useRef, useState, useTransition } from "react";
import { saveBeneficiary } from "@/lib/actions/beneficiaries";
import { EXIT_STATUSES, HOSPITALS, PROGRAMS, STATUSES, WARDS } from "@/lib/beneficiaries";
import { FIELD_LIMITS, todayInIndia, validateBeneficiary, type BeneficiaryFormField, type FieldErrors } from "@/lib/validation/beneficiary";

const INPUT_CLASS = "mt-2 min-h-11 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm";
type FormField = { name: BeneficiaryFormField; label: string; required?: boolean; options?: readonly string[]; type?: "date" | "tel"; multiline?: boolean };
const FORM_FIELDS: readonly FormField[] = [
  { name: "name_of_child", label: "Child’s name", required: true },
  { name: "gender", label: "Gender" },
  { name: "date_of_birth", label: "Date of birth", type: "date", required: true },
  { name: "program", label: "Program", options: PROGRAMS, required: true },
  { name: "primary_diagnosis", label: "Primary diagnosis" },
  { name: "sub_diagnosis", label: "Sub-diagnosis" },
  { name: "level_of_care", label: "Level of care" },
  { name: "location", label: "Location" },
  { name: "address", label: "Address", multiline: true },
  { name: "primary_mobile_no", label: "Primary phone", type: "tel" },
  { name: "secondary_mobile_no", label: "Secondary phone", type: "tel" },
  { name: "hospital", label: "Hospital", options: HOSPITALS },
  { name: "ward_department", label: "Ward / department", options: WARDS },
  { name: "status", label: "Status", options: STATUSES, required: true },
  { name: "exit_date", label: "Exit date", type: "date" },
  { name: "family_occupation", label: "Family occupation" },
  { name: "family_members", label: "Family members" },
  { name: "interested_in_daycare_program", label: "Interested in daycare program" },
  { name: "notes", label: "Notes", multiline: true },
];

export function BeneficiaryForm({ onSaved, onCancel, onBusyChange }: { onSaved: () => void; onCancel: () => void; onBusyChange: (busy: boolean) => void }) {
  const form = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState("Active");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function fieldError(name: BeneficiaryFormField) {
    return errors[name] ? <p id={`${name}-error`} className="mt-1 text-xs text-destructive">{errors[name]}</p> : null;
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const data = new FormData(event.currentTarget);
    const { errors: validationErrors } = validateBeneficiary(Object.fromEntries(data));
    setErrors(validationErrors); setError("");
    if (Object.keys(validationErrors).length) {
      setError("Check the highlighted fields.");
      const field = Object.keys(validationErrors)[0];
      (form.current?.elements.namedItem(field) as HTMLElement | null)?.focus();
      return;
    }
    onBusyChange(true);
    startTransition(async () => {
      try {
        const result = await saveBeneficiary(data);
        if (!result.ok) { setError(result.error); setErrors(result.fieldErrors ?? {}); return; }
        onSaved();
      } catch {
        setError("Could not confirm the save. Check the table before trying again.");
      } finally { onBusyChange(false); }
    });
  }

  return (
    <form ref={form} onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
        <p className="text-xs text-muted-foreground">Fields marked * are required.</p>
        <p className="text-xs text-muted-foreground">Beneficiary ID and registration date are assigned automatically. Age is calculated from date of birth.</p>
        {FORM_FIELDS.filter(field => field.name !== "exit_date" || EXIT_STATUSES.includes(status)).map(({ name, label, required, options, type, multiline }) => {
          const common = { id: name, name, required, disabled: pending, "aria-invalid": !!errors[name], "aria-describedby": errors[name] ? `${name}-error` : undefined, className: INPUT_CLASS };
          const maxLength = name in FIELD_LIMITS ? FIELD_LIMITS[name as keyof typeof FIELD_LIMITS] : undefined;
          return <div key={name}>
            <label htmlFor={name} className="font-medium">{label}{required ? " *" : ""}</label>
            {options ? <select {...common} defaultValue={name === "status" ? "Active" : ""} onChange={name === "status" ? event => setStatus(event.target.value) : undefined}><option value="">{required ? `Choose ${label.toLowerCase()}` : "Not specified"}</option>{options.map(value => <option key={value}>{value}</option>)}</select>
              : multiline ? <textarea {...common} rows={3} maxLength={maxLength} />
              : <input {...common} type={type ?? "text"} max={type === "date" ? todayInIndia() : undefined} maxLength={maxLength} autoComplete={type === "tel" ? "tel" : "off"} />}
            {fieldError(name)}
          </div>;
        })}
        {error && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      </div>
      <div className="flex justify-end gap-3 border-t border-border px-6 py-4">
        <button type="button" disabled={pending} onClick={onCancel} className="min-h-11 rounded-lg border border-border px-4 font-medium disabled:opacity-50">Cancel</button>
        <button type="submit" disabled={pending} className="min-h-11 rounded-lg bg-brand-pink px-4 font-semibold text-primary-foreground disabled:opacity-50">{pending ? "Saving…" : "Save entry"}</button>
      </div>
    </form>
  );
}

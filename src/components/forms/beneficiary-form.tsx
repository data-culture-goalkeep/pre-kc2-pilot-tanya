"use client";

import { useRef, useState, useTransition } from "react";
import { saveBeneficiary } from "@/lib/actions/beneficiaries";
import { PROGRAMS, STATUSES } from "@/lib/beneficiaries";
import { FIELD_LIMITS, validateBeneficiary, type BeneficiaryFormField, type FieldErrors } from "@/lib/validation/beneficiary";

const INPUT_CLASS = "mt-2 min-h-11 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm";
const TEXT_FIELDS = [
  { name: "beneficiary_id", label: "Beneficiary ID", required: true, autoComplete: "off" },
  { name: "name_of_child", label: "Child’s name", required: true, autoComplete: "off" },
  { name: "primary_mobile_no", label: "Primary phone", required: false, autoComplete: "tel" },
  { name: "location", label: "Location", required: false, autoComplete: "off" },
] as const;

export function BeneficiaryForm({ onSaved, onCancel, onBusyChange }: { onSaved: () => void; onCancel: () => void; onBusyChange: (busy: boolean) => void }) {
  const form = useRef<HTMLFormElement>(null);
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
        {TEXT_FIELDS.slice(0, 2).map(({ name, label, required, autoComplete }) => <div key={name}><label htmlFor={name} className="font-medium">{label} *</label><input id={name} name={name} required={required} autoComplete={autoComplete} maxLength={FIELD_LIMITS[name]} disabled={pending} aria-invalid={!!errors[name]} aria-describedby={errors[name] ? `${name}-error` : undefined} className={INPUT_CLASS} />{fieldError(name)}</div>)}
        <div><label htmlFor="program" className="font-medium">Program *</label><select id="program" name="program" required defaultValue="" disabled={pending} aria-invalid={!!errors.program} aria-describedby={errors.program ? "program-error" : undefined} className={INPUT_CLASS}><option value="">Choose a program</option>{PROGRAMS.map((value) => <option key={value}>{value}</option>)}</select>{fieldError("program")}</div>
        <div><label htmlFor="date_of_birth" className="font-medium">Date of birth</label><input id="date_of_birth" name="date_of_birth" type="date" disabled={pending} aria-invalid={!!errors.date_of_birth} aria-describedby={errors.date_of_birth ? "date_of_birth-error" : undefined} className={INPUT_CLASS} />{fieldError("date_of_birth")}</div>
        <div><label htmlFor="status" className="font-medium">Status *</label><select id="status" name="status" required defaultValue="Active" disabled={pending} aria-invalid={!!errors.status} aria-describedby={errors.status ? "status-error" : undefined} className={INPUT_CLASS}>{STATUSES.map((value) => <option key={value}>{value}</option>)}</select>{fieldError("status")}</div>
        {TEXT_FIELDS.slice(2).map(({ name, label, required, autoComplete }) => <div key={name}><label htmlFor={name} className="font-medium">{label}</label><input id={name} name={name} type={name === "primary_mobile_no" ? "tel" : "text"} required={required} autoComplete={autoComplete} maxLength={FIELD_LIMITS[name]} disabled={pending} aria-invalid={!!errors[name]} aria-describedby={errors[name] ? `${name}-error` : undefined} className={INPUT_CLASS} />{fieldError(name)}</div>)}
        {error && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      </div>
      <div className="flex justify-end gap-3 border-t border-border px-6 py-4">
        <button type="button" disabled={pending} onClick={onCancel} className="min-h-11 rounded-lg border border-border px-4 font-medium disabled:opacity-50">Cancel</button>
        <button type="submit" disabled={pending} className="min-h-11 rounded-lg bg-brand-pink px-4 font-semibold text-primary-foreground disabled:opacity-50">{pending ? "Saving…" : "Save entry"}</button>
      </div>
    </form>
  );
}

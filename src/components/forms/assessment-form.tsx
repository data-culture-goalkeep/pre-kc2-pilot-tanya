"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { findAssessmentBeneficiaries, saveAssessment, type AssessmentBeneficiary } from "@/lib/actions/assessments";
import { ASSESSMENT_TESTS, ASSESSMENT_PHASES } from "@/lib/assessments";

const INPUT = "mt-2 min-h-11 w-full rounded-lg border border-input bg-card px-3 text-sm";
const TODAY = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const STIRLING_QUESTIONS = ["think good things will happen", "always told truth", "make choices easily", "find fun things to do", "good at some things", "people care about me", "like everyone I met", "proud of many things", "feeling calm", "in good mood", "enjoy each day", "getting on well with people", "always share sweets", "cheerful about things", "feeling relaxed"];

export function AssessmentForm({ close, onBusyChange, onSaved }: { close: () => void; onBusyChange: (v: boolean) => void; onSaved: () => void }) {
  const [test, setTest] = useState("");
  const [phase, setPhase] = useState("");
  const [step, setStep] = useState(1);
  const [search, setSearch] = useState("");
  const [matches, setMatches] = useState<AssessmentBeneficiary[]>([]);
  const [selected, setSelected] = useState<AssessmentBeneficiary | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();
  const count = test === "Rosenberg" ? 10 : 15;
  const answered = useMemo(() => Object.values(answers).filter(Boolean).length, [answers]);

  useEffect(() => {
    if (step !== 2 || !search.trim()) return;
    let active = true;
    const timeout = setTimeout(async () => { const result = await findAssessmentBeneficiaries(search); if (active) setMatches(result); }, 200);
    return () => { active = false; clearTimeout(timeout); };
  }, [search, step]);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || answered !== count) { setError("Answer every question and choose a beneficiary."); return; }
    const data = new FormData(event.currentTarget);
    data.set("beneficiary_id", selected.beneficiary_id); data.set("name_of_child", selected.name_of_child);
    data.set("test_type", test); if (test === "Stirling") data.set("phase", phase);
    for (let i = 1; i <= count; i++) data.set(`q${i}`, answers[i] ?? "");
    onBusyChange(true); setError("");
    start(async () => {
      try { const result = await saveAssessment(data); if (!result.ok) { setError(result.error ?? "Could not save assessment."); return; } setDone(true); onSaved(); }
      catch { setError("Could not confirm the save. Check records before retrying."); }
      finally { onBusyChange(false); }
    });
  }
  function reset() { setTest(""); setPhase(""); setStep(1); setSearch(""); setMatches([]); setSelected(null); setAnswers({}); setError(""); setDone(false); }

  if (done) return <div className="space-y-5 px-6 py-8"><p role="status" className="rounded-lg border border-brand-purple bg-brand-soft-pink/20 p-4 font-medium">Entry saved successfully</p><div className="flex justify-end gap-3"><button type="button" onClick={close} className="min-h-11 rounded-lg border border-border px-4">Done</button><button type="button" onClick={reset} className="min-h-11 rounded-lg bg-brand-pink px-4 font-semibold text-primary-foreground">Add another</button></div></div>;

  return <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
    <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground"><span className={step === 1 ? "text-brand-pink" : ""}>1. Test</span><span>›</span><span className={step === 2 ? "text-brand-pink" : ""}>2. Beneficiary</span><span>›</span><span className={step === 3 ? "text-brand-pink" : ""}>3. Responses</span></div>
      {step === 1 && <section className="space-y-4"><label className="block text-sm font-medium">Test *<select required value={test} onChange={(e) => { setTest(e.target.value); setPhase(""); }} className={INPUT}><option value="">Choose a test</option>{ASSESSMENT_TESTS.map((v) => <option key={v}>{v}</option>)}</select></label>{test === "Stirling" && <label className="block text-sm font-medium">Pre / Post *<select required value={phase} onChange={(e) => setPhase(e.target.value)} className={INPUT}><option value="">Choose phase</option>{ASSESSMENT_PHASES.map((v) => <option key={v}>{v}</option>)}</select></label>}<button type="button" disabled={!test || (test === "Stirling" && !phase)} onClick={() => { setStep(2); setError(""); }} className="min-h-11 rounded-lg bg-brand-pink px-4 font-semibold text-primary-foreground disabled:opacity-50">Continue</button></section>}
      {step === 2 && <section className="space-y-4"><label className="block text-sm font-medium">Search beneficiary by name or ID<input autoComplete="off" value={search} onChange={(e) => { setSearch(e.target.value); setSelected(null); }} placeholder="Type at least 2 characters" className={INPUT} /></label><div className="max-h-56 overflow-y-auto rounded-lg border border-border">{search.trim().length >= 2 ? matches.map((person) => <button key={person.beneficiary_id} type="button" onClick={() => { setSelected(person); setSearch(`${person.beneficiary_id} · ${person.name_of_child}`); setMatches([]); }} className="block min-h-11 w-full border-b border-border px-3 text-left text-sm last:border-0 hover:bg-brand-light-blue/30">{person.beneficiary_id} · {person.name_of_child}</button>) : null}{search.trim().length >= 2 && !matches.length && !selected ? <p className="p-3 text-sm text-muted-foreground">No matching beneficiaries.</p> : null}</div>{selected ? <p className="rounded-lg bg-muted p-3 text-sm">Selected: <strong>{selected.beneficiary_id} · {selected.name_of_child}</strong></p> : null}<div className="flex justify-between"><button type="button" onClick={() => setStep(1)} className="min-h-11 rounded-lg border border-border px-4">Back</button><button type="button" disabled={!selected} onClick={() => { setStep(3); setError(""); }} className="min-h-11 rounded-lg bg-brand-pink px-4 font-semibold text-primary-foreground disabled:opacity-50">Continue</button></div></section>}
      {step === 3 && <>
        <div className="grid gap-3 sm:grid-cols-2"><label className="text-sm font-medium">Beneficiary<input readOnly value={selected ? `${selected.beneficiary_id} · ${selected.name_of_child}` : ""} className={INPUT} /></label><label className="text-sm font-medium">Assessment date *<input type="date" name="assessment_date" required max={TODAY} defaultValue={TODAY} className={INPUT} /></label></div>
        <p className="text-sm font-semibold">{answered} of {count} answered</p>
        <div className="space-y-3">{Array.from({ length: count }, (_, index) => index + 1).map((n) => <fieldset key={n} className="rounded-lg border border-border p-3"><legend className="px-1 text-sm font-medium">{test === "Rosenberg" ? `Q${n}` : `Q${n}. ${STIRLING_QUESTIONS[n - 1]}`}</legend><div className="mt-2 flex flex-wrap gap-2">{(test === "Rosenberg" ? ["SA", "A", "DA", "SD"] : ["1", "2", "3", "4", "5"]).map((choice) => <button key={choice} type="button" aria-pressed={answers[n] === choice} onClick={() => setAnswers((v) => ({ ...v, [n]: choice }))} className={`min-h-10 min-w-12 rounded-lg border px-3 text-sm font-semibold ${answers[n] === choice ? "border-brand-pink bg-brand-pink text-primary-foreground" : "border-border bg-card hover:bg-brand-soft-pink/30"}`}>{choice}</button>)}</div></fieldset>)}</div>
        <p className="text-xs text-muted-foreground">Rosenberg answers are saved as entered with their numeric values. No reverse scoring or total is calculated. Stirling responses use the source sheet’s scale of 1 (Never) to 5 (All the time).</p>
        <button type="button" onClick={() => setStep(2)} className="min-h-10 rounded-lg border border-border px-4">Back</button>
      </>}
      {error && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
    </div>
    <div className="flex justify-end gap-3 border-t border-border px-6 py-4"><button type="button" disabled={pending} onClick={close} className="min-h-11 rounded-lg border border-border px-4">Cancel</button>{step === 3 ? <button type="submit" disabled={pending || answered !== count} className="min-h-11 rounded-lg bg-brand-pink px-4 font-semibold text-primary-foreground disabled:opacity-50">{pending ? "Saving…" : "Save entry"}</button> : null}</div>
  </form>;
}

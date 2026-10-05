import { MONTHS } from "@/lib/daycare";
export { MONTHS };
export const ASSESSMENT_TESTS = ["Rosenberg", "Stirling"] as const;
export const ASSESSMENT_PHASES = ["Pre", "Post"] as const;
export type AssessmentFilters = { test: string; phase: string; month: string };
export function currentAssessmentMonth() { return new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", month: "long" }).format(new Date()); }

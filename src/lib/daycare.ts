export const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"] as const;
export type Month = (typeof MONTHS)[number];
export const ATTENDANCE_PROGRAMS = ["Daycare", "Homecare"] as const;
export type DaycareFilters = { month: string; program: string; beneficiary: string };
export function currentIndiaMonth() {
  return new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", month: "long" }).format(new Date());
}
export function monthIndex(month: string) { return MONTHS.indexOf(month as Month); }

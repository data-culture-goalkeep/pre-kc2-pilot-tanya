ALTER TABLE public.daycare_attendance
  ADD COLUMN IF NOT EXISTS name_of_child text;

COMMENT ON COLUMN public.daycare_attendance.name_of_child IS
  'Preserves the child name from the source attendance tab.';

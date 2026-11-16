-- Only pre-kc2-happy-feet-test (ktobhlqfeqdxydppczmm).
-- This helper contains one non-sensitive constant, not beneficiary/source data.
CREATE TABLE public.keepalive (
  id integer PRIMARY KEY CHECK (id = 1)
);
ALTER TABLE public.keepalive ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.keepalive FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.keepalive TO anon;
CREATE POLICY keepalive_anon_read ON public.keepalive
  FOR SELECT TO anon USING (id = 1);
INSERT INTO public.keepalive (id) VALUES (1);
COMMENT ON TABLE public.keepalive IS
  'Non-sensitive heartbeat for the twice-daily project Data API check; not source data.';

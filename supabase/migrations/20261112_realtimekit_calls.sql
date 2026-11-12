-- =====================================================
-- PHASE 5: CALL MANAGEMENT
-- =====================================================

-- Ensure RLS remains enabled.

ALTER TABLE public.calls
ENABLE ROW LEVEL SECURITY;


-- Normal users can read authorized calls.
-- All call writes are performed through NestJS.

REVOKE INSERT, UPDATE, DELETE
ON public.calls
FROM anon, authenticated;

GRANT SELECT
ON public.calls
TO authenticated;


-- Replace the previous read policy.

DROP POLICY IF EXISTS "Participants read calls"
ON public.calls;

DROP POLICY IF EXISTS "Call participants can read"
ON public.calls;


CREATE POLICY "Call participants can read"
ON public.calls
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.patients p
        WHERE p.id = calls.patient_id
          AND p.doctor_id = calls.doctor_id
          AND (
              p.doctor_id = (SELECT auth.uid())
              OR p.user_id = (SELECT auth.uid())
          )
    )
);


-- One open consultation per patient.

CREATE UNIQUE INDEX IF NOT EXISTS
idx_calls_one_open_per_patient
ON public.calls(patient_id)
WHERE status IN ('ringing', 'accepted', 'active');


-- One open consultation per doctor.

CREATE UNIQUE INDEX IF NOT EXISTS
idx_calls_one_open_per_doctor
ON public.calls(doctor_id)
WHERE status IN ('ringing', 'accepted', 'active');


-- Helps retrieve recent calls.

CREATE INDEX IF NOT EXISTS idx_calls_patient_created
ON public.calls(patient_id, created_at DESC);


-- Store Cloudflare participant identifiers.
-- Never store participant tokens in this table.

CREATE TABLE IF NOT EXISTS public.call_participants (
    call_id UUID NOT NULL
        REFERENCES public.calls(id)
        ON DELETE CASCADE,

    user_id UUID NOT NULL
        REFERENCES public.profiles(id),

    cloudflare_participant_id TEXT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL
        DEFAULT NOW(),

    PRIMARY KEY (call_id, user_id)
);


ALTER TABLE public.call_participants
ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.call_participants
FROM anon, authenticated;
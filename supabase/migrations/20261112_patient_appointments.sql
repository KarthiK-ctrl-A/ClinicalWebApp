CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    patient_id UUID NOT NULL
        REFERENCES public.patients(id),

    doctor_id UUID NOT NULL
        REFERENCES public.profiles(id),

    scheduled_at TIMESTAMPTZ NOT NULL,

    mode TEXT NOT NULL DEFAULT 'video'
        CHECK (mode IN ('audio', 'video')),

    status TEXT NOT NULL DEFAULT 'scheduled'
        CHECK (
            status IN (
                'scheduled',
                'completed',
                'cancelled'
            )
        ),

    created_at TIMESTAMPTZ NOT NULL
        DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS
idx_appointments_patient_scheduled
ON public.appointments (
    patient_id,
    scheduled_at
);

ALTER TABLE public.appointments
ENABLE ROW LEVEL SECURITY;

-- For this phase, scheduling writes and reads
-- are handled only by the authorized backend.

REVOKE ALL
ON public.appointments
FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE
ON public.appointments
TO service_role;

NOTIFY pgrst, 'reload schema';
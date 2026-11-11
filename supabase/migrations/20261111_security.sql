ALTER TABLE public.profiles
ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.patients
ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.lab_results
ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.imaging_reports
ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.prescriptions
ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.messages
ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.calls
ENABLE ROW LEVEL SECURITY;


-- Remove existing client privileges.

REVOKE ALL ON TABLE
    public.profiles,
    public.patients,
    public.lab_results,
    public.imaging_reports,
    public.prescriptions,
    public.messages,
    public.calls
FROM anon, authenticated;


-- Allow authenticated users to read
-- records permitted by RLS policies.

GRANT SELECT ON TABLE
    public.profiles,
    public.patients,
    public.lab_results,
    public.imaging_reports,
    public.prescriptions,
    public.messages,
    public.calls
TO authenticated;

-- =====================================================
-- PATIENT ACCESS
-- =====================================================

CREATE POLICY "Read assigned or own patient"
ON public.patients
FOR SELECT
TO authenticated
USING (
    doctor_id = (SELECT auth.uid())
    OR user_id = (SELECT auth.uid())
);


-- =====================================================
-- PROFILE ACCESS
-- =====================================================

CREATE POLICY "Read connected profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
    id = (SELECT auth.uid())

    OR EXISTS (
        SELECT 1
        FROM public.patients p
        WHERE
            (
                p.doctor_id = (SELECT auth.uid())
                AND p.user_id = profiles.id
            )
            OR
            (
                p.user_id = (SELECT auth.uid())
                AND p.doctor_id = profiles.id
            )
    )
);


-- =====================================================
-- LAB RESULT ACCESS
-- Only assigned doctors can read.
-- =====================================================

CREATE POLICY "Doctors read assigned labs"
ON public.lab_results
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.patients p
        WHERE p.id = lab_results.patient_id
        AND p.doctor_id = (SELECT auth.uid())
    )
);


-- =====================================================
-- IMAGING REPORT ACCESS
-- =====================================================

CREATE POLICY "Doctors read assigned imaging"
ON public.imaging_reports
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.patients p
        WHERE p.id = imaging_reports.patient_id
        AND p.doctor_id = (SELECT auth.uid())
    )
);


-- =====================================================
-- PRESCRIPTION ACCESS
-- =====================================================

CREATE POLICY "Doctors read assigned prescriptions"
ON public.prescriptions
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.patients p
        WHERE p.id = prescriptions.patient_id
        AND p.doctor_id = (SELECT auth.uid())
    )
);


-- =====================================================
-- MESSAGE ACCESS
-- Doctor and assigned patient can read.
-- =====================================================

CREATE POLICY "Participants read messages"
ON public.messages
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.patients p
        WHERE p.id = messages.patient_id
        AND (
            p.doctor_id = (SELECT auth.uid())
            OR p.user_id = (SELECT auth.uid())
        )
    )
);


-- =====================================================
-- CALL ACCESS
-- Doctor and assigned patient can read.
-- =====================================================

CREATE POLICY "Participants read calls"
ON public.calls
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.patients p
        WHERE p.id = calls.patient_id
        AND (
            p.doctor_id = (SELECT auth.uid())
            OR p.user_id = (SELECT auth.uid())
        )
    )
);
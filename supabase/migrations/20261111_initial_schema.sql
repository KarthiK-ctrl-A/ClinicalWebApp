-- =====================================================
-- CLINIC WEB APPLICATION
-- INITIAL DATABASE SCHEMA
-- =====================================================

-- 1. USER PROFILES

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY
        REFERENCES auth.users(id)
        ON DELETE CASCADE,

    full_name TEXT NOT NULL,

    role TEXT NOT NULL
        CHECK (role IN ('doctor', 'patient')),

    specialty TEXT,

    created_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW()
);


-- 2. PATIENTS

CREATE TABLE IF NOT EXISTS public.patients (
    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL UNIQUE
        REFERENCES public.profiles(id)
        ON DELETE CASCADE,

    doctor_id UUID NOT NULL
        REFERENCES public.profiles(id),

    date_of_birth DATE,

    gender TEXT,

    phone TEXT,

    address TEXT,

    allergies TEXT,

    medical_notes TEXT,

    created_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW()
);


-- 3. LAB RESULTS

CREATE TABLE IF NOT EXISTS public.lab_results (
    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    patient_id UUID NOT NULL
        REFERENCES public.patients(id)
        ON DELETE CASCADE,

    test_name TEXT NOT NULL,

    result_value TEXT,

    unit TEXT,

    reference_range TEXT,

    collected_at DATE,

    created_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW()
);


-- 4. IMAGING REPORTS

CREATE TABLE IF NOT EXISTS public.imaging_reports (
    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    patient_id UUID NOT NULL
        REFERENCES public.patients(id)
        ON DELETE CASCADE,

    imaging_type TEXT NOT NULL,

    findings TEXT,

    impression TEXT,

    report_date DATE,

    created_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW()
);


-- 5. PRESCRIPTIONS

CREATE TABLE IF NOT EXISTS public.prescriptions (
    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    patient_id UUID NOT NULL
        REFERENCES public.patients(id)
        ON DELETE CASCADE,

    doctor_id UUID NOT NULL
        REFERENCES public.profiles(id),

    medication_name TEXT NOT NULL,

    dosage TEXT NOT NULL,

    frequency TEXT,

    duration_days INTEGER
        CHECK (
            duration_days IS NULL
            OR duration_days > 0
        ),

    instructions TEXT,

    status TEXT NOT NULL DEFAULT 'active'
        CHECK (
            status IN (
                'active',
                'completed',
                'discontinued'
            )
        ),

    prescribed_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW()
);


-- 6. MESSAGES

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    patient_id UUID NOT NULL
        REFERENCES public.patients(id)
        ON DELETE CASCADE,

    doctor_id UUID NOT NULL
        REFERENCES public.profiles(id),

    sender_id UUID NOT NULL
        REFERENCES public.profiles(id),

    content TEXT NOT NULL
        CHECK (length(trim(content)) > 0),

    created_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW()
);


-- 7. CALLS

CREATE TABLE IF NOT EXISTS public.calls (
    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    patient_id UUID NOT NULL
        REFERENCES public.patients(id)
        ON DELETE CASCADE,

    doctor_id UUID NOT NULL
        REFERENCES public.profiles(id),

    call_type TEXT NOT NULL
        CHECK (call_type IN ('audio', 'video')),

    status TEXT NOT NULL DEFAULT 'ringing'
        CHECK (
            status IN (
                'ringing',
                'accepted',
                'active',
                'declined',
                'ended',
                'failed'
            )
        ),

    cloudflare_meeting_id TEXT,

    started_at TIMESTAMPTZ,

    ended_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW()
);


-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_patients_doctor
ON public.patients(doctor_id);

CREATE INDEX IF NOT EXISTS idx_lab_patient
ON public.lab_results(patient_id);

CREATE INDEX IF NOT EXISTS idx_imaging_patient
ON public.imaging_reports(patient_id);

CREATE INDEX IF NOT EXISTS idx_prescriptions_patient
ON public.prescriptions(patient_id);

CREATE INDEX IF NOT EXISTS idx_messages_patient_time
ON public.messages(patient_id, created_at);

CREATE INDEX IF NOT EXISTS idx_calls_patient_time
ON public.calls(patient_id, created_at);
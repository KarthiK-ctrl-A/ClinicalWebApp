-- Allow authenticated users to insert
-- only the fields required for prescriptions.

GRANT INSERT (
    patient_id,
    doctor_id,
    medication_name,
    dosage,
    frequency,
    duration_days,
    instructions
)
ON public.prescriptions
TO authenticated;


-- Only assigned doctors may create prescriptions.

CREATE POLICY "Doctors create assigned prescriptions"
ON public.prescriptions
FOR INSERT
TO authenticated
WITH CHECK (
    doctor_id = (SELECT auth.uid())

    AND EXISTS (
        SELECT 1
        FROM public.patients p
        WHERE p.id = prescriptions.patient_id
          AND p.doctor_id = (SELECT auth.uid())
    )

    AND EXISTS (
        SELECT 1
        FROM public.profiles d
        WHERE d.id = (SELECT auth.uid())
          AND d.role = 'doctor'
    )
);
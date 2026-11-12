-- =====================================================
-- PHASE 4: MESSAGING SECURITY
-- =====================================================

ALTER TABLE public.messages
ENABLE ROW LEVEL SECURITY;


-- Restrict database privileges.

REVOKE INSERT, UPDATE, DELETE
ON public.messages
FROM anon, authenticated;

GRANT SELECT
ON public.messages
TO authenticated;

GRANT INSERT (
    patient_id,
    doctor_id,
    sender_id,
    content
)
ON public.messages
TO authenticated;


-- Replace the previous Phase 1 read policy.

DROP POLICY IF EXISTS
"Participants read messages"
ON public.messages;

DROP POLICY IF EXISTS
"Conversation participants can read"
ON public.messages;


-- Only the assigned doctor and patient can read.

CREATE POLICY "Conversation participants can read"
ON public.messages
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.patients p
        WHERE p.id = messages.patient_id
          AND p.doctor_id = messages.doctor_id
          AND (
              p.doctor_id = (SELECT auth.uid())
              OR p.user_id = (SELECT auth.uid())
          )
    )
);


-- Allow messages only from legitimate participants.

DROP POLICY IF EXISTS
"Conversation participants can send"
ON public.messages;

CREATE POLICY "Conversation participants can send"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (
    sender_id = (SELECT auth.uid())

    AND EXISTS (
        SELECT 1
        FROM public.patients p
        WHERE p.id = messages.patient_id

          AND p.doctor_id = messages.doctor_id

          AND (
              p.doctor_id = (SELECT auth.uid())
              OR p.user_id = (SELECT auth.uid())
          )
    )
);


ALTER TABLE public.messages
ADD CONSTRAINT messages_content_length_check
CHECK (
    char_length(trim(content)) BETWEEN 1 AND 2000
);
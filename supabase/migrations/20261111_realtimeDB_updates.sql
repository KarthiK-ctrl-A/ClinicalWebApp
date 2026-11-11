ALTER PUBLICATION supabase_realtime
ADD TABLE public.messages, public.calls;

SELECT
    schemaname,
    tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime';
DO $$
BEGIN
    IF to_regclass('public.authorized_users') IS NULL THEN
        RAISE EXCEPTION 'Create public.authorized_users before applying this migration';
    END IF;
END
$$;

GRANT SELECT, INSERT, DELETE ON TABLE public.authorized_users TO service_role;

DO $$
DECLARE
    id_sequence text;
BEGIN
    id_sequence := pg_get_serial_sequence('public.authorized_users', 'id');
    IF id_sequence IS NOT NULL THEN
        EXECUTE format('GRANT USAGE, SELECT ON SEQUENCE %s TO service_role', id_sequence);
    END IF;
END
$$;

NOTIFY pgrst, 'reload schema';

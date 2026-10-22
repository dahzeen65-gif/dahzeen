ALTER TABLE public.member_contributions
    ALTER COLUMN mpesa_reference DROP NOT NULL,
    ADD COLUMN IF NOT EXISTS checkout_request_id text UNIQUE,
    ADD COLUMN IF NOT EXISTS merchant_request_id text UNIQUE,
    ADD COLUMN IF NOT EXISTS status_token_hash text UNIQUE,
    ADD COLUMN IF NOT EXISTS result_code integer,
    ADD COLUMN IF NOT EXISTS result_description text,
    ADD COLUMN IF NOT EXISTS completed_at timestamptz;

ALTER TABLE public.member_contributions
    DROP CONSTRAINT IF EXISTS member_contributions_status_check;

ALTER TABLE public.member_contributions
    ADD CONSTRAINT member_contributions_status_check
    CHECK (status IN (
        'Pending Verification',
        'Pending Payment',
        'Prompt Sent',
        'Paid',
        'Failed',
        'Review Required',
        'Verified',
        'Rejected'
    ));

ALTER TABLE public.member_contributions
    ALTER COLUMN status SET DEFAULT 'Pending Payment';

GRANT SELECT, INSERT, UPDATE ON TABLE public.member_contributions TO service_role;

NOTIFY pgrst, 'reload schema';

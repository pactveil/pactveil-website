CREATE TABLE IF NOT EXISTS inquiries (
 id text PRIMARY KEY,
 created_at timestamptz NOT NULL,
 name text NOT NULL,
 email text NOT NULL,
 company text NOT NULL,
 market text NOT NULL,
 interest text NOT NULL,
 message text NOT NULL,
 consent_version text NOT NULL
);
CREATE INDEX IF NOT EXISTS inquiries_created_at_idx ON inquiries(created_at DESC);
CREATE TABLE IF NOT EXISTS rate_limits (
 key text PRIMARY KEY,
 attempts integer NOT NULL,
 expires_at timestamptz NOT NULL
);

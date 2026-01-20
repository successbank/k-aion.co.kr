-- Migration: Add username to members table
-- Date: 2026-01-06

-- Step 1: Add username column (nullable initially)
ALTER TABLE members ADD COLUMN IF NOT EXISTS username VARCHAR(50);

-- Step 2: Create index on username (will be unique after data migration)
CREATE INDEX IF NOT EXISTS idx_members_username ON members(username);

-- Step 3: Make email nullable
ALTER TABLE members ALTER COLUMN email DROP NOT NULL;

-- Step 4: Drop unique constraint on email (if exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'members_email_key'
    ) THEN
        ALTER TABLE members DROP CONSTRAINT members_email_key;
    END IF;
END $$;

-- Note: username will be populated by data migration script
-- After data migration, run:
-- ALTER TABLE members ALTER COLUMN username SET NOT NULL;
-- ALTER TABLE members ADD CONSTRAINT members_username_key UNIQUE (username);

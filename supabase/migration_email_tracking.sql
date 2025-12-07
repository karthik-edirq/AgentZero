-- Migration: Update email_events table for Resend webhook tracking
-- This adds fields required for webhook event tracking

-- Add new columns to email_events table if they don't exist
DO $$ 
BEGIN
  -- Add user_id column (text) - can store recipient email or user identifier
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'email_events' AND column_name = 'user_id') THEN
    ALTER TABLE email_events ADD COLUMN user_id TEXT;
  END IF;

  -- Add campaign_id column (text) - for direct campaign reference
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'email_events' AND column_name = 'campaign_id') THEN
    ALTER TABLE email_events ADD COLUMN campaign_id TEXT;
  END IF;

  -- Add recipient column (text) - for recipient email address
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'email_events' AND column_name = 'recipient') THEN
    ALTER TABLE email_events ADD COLUMN recipient TEXT;
  END IF;

  -- Rename created_at to timestamp if needed (keeping both for backward compatibility)
  -- Actually, we'll keep created_at and add timestamp as an alias via view or just use created_at

  -- Rename metadata to raw for storing raw webhook payload
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'email_events' AND column_name = 'metadata') THEN
    -- If raw doesn't exist, rename metadata to raw
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'email_events' AND column_name = 'raw') THEN
      ALTER TABLE email_events RENAME COLUMN metadata TO raw;
    END IF;
  ELSE
    -- If metadata doesn't exist, add raw column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'email_events' AND column_name = 'raw') THEN
      ALTER TABLE email_events ADD COLUMN raw JSONB DEFAULT '{}';
    END IF;
  END IF;

  -- Change email_id to TEXT if it's currently UUID (for Resend email IDs)
  -- Actually, we'll keep it as UUID for our internal emails table reference
  -- But we'll also store the Resend email ID in the raw JSONB field
END $$;

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_email_events_user_id ON email_events(user_id);
CREATE INDEX IF NOT EXISTS idx_email_events_campaign_id ON email_events(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_events_recipient ON email_events(recipient);
CREATE INDEX IF NOT EXISTS idx_email_events_timestamp ON email_events(created_at);

-- Update the email_id column to support both UUID (internal) and TEXT (Resend IDs)
-- We'll keep it as UUID but add a comment
COMMENT ON COLUMN email_events.email_id IS 'References emails.id (UUID) or can be Resend email ID (text)';


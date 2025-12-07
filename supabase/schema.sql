-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recipients table
CREATE TABLE IF NOT EXISTS recipients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  name TEXT,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  business_function TEXT,
  role TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(email, organization_id)
);

-- Campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  business_function TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'cancelled')),
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  launched_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Emails table (sent emails)
CREATE TABLE IF NOT EXISTS emails (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES recipients(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'bounced', 'failed')),
  resend_email_id TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email events table (for tracking opens, clicks, etc.)
CREATE TABLE IF NOT EXISTS email_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email_id UUID REFERENCES emails(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained', 'unsubscribed')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campaign recipients junction table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS campaign_recipients (
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES recipients(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (campaign_id, recipient_id)
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_recipients_organization ON recipients(organization_id);
CREATE INDEX IF NOT EXISTS idx_recipients_business_function ON recipients(business_function);
CREATE INDEX IF NOT EXISTS idx_campaigns_organization ON campaigns(organization_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_emails_campaign ON emails(campaign_id);
CREATE INDEX IF NOT EXISTS idx_emails_recipient ON emails(recipient_id);
CREATE INDEX IF NOT EXISTS idx_emails_status ON emails(status);
CREATE INDEX IF NOT EXISTS idx_email_events_email ON email_events(email_id);
CREATE INDEX IF NOT EXISTS idx_email_events_type ON email_events(event_type);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_campaign ON campaign_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_recipient ON campaign_recipients(recipient_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically update updated_at
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recipients_updated_at BEFORE UPDATE ON recipients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emails_updated_at BEFORE UPDATE ON emails
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Views for analytics
CREATE OR REPLACE VIEW campaign_stats AS
SELECT 
  c.id,
  c.name,
  c.status,
  COUNT(DISTINCT cr.recipient_id) as total_recipients,
  COUNT(DISTINCT e.id) as total_sent,
  COUNT(DISTINCT CASE WHEN e.status = 'delivered' THEN e.id END) as delivered,
  COUNT(DISTINCT CASE WHEN e.status = 'bounced' THEN e.id END) as bounced,
  COUNT(DISTINCT CASE WHEN ee.event_type = 'opened' THEN ee.id END) as opened,
  COUNT(DISTINCT CASE WHEN ee.event_type = 'clicked' THEN ee.id END) as clicked,
  CASE 
    WHEN COUNT(DISTINCT CASE WHEN e.status = 'delivered' THEN e.id END) > 0 
    THEN ROUND(
      (COUNT(DISTINCT CASE WHEN ee.event_type = 'opened' THEN ee.id END)::DECIMAL / 
       COUNT(DISTINCT CASE WHEN e.status = 'delivered' THEN e.id END)) * 100, 
      2
    )
    ELSE 0 
  END as open_rate,
  CASE 
    WHEN COUNT(DISTINCT CASE WHEN e.status = 'delivered' THEN e.id END) > 0 
    THEN ROUND(
      (COUNT(DISTINCT CASE WHEN ee.event_type = 'clicked' THEN ee.id END)::DECIMAL / 
       COUNT(DISTINCT CASE WHEN e.status = 'delivered' THEN e.id END)) * 100, 
      2
    )
    ELSE 0 
  END as click_rate
FROM campaigns c
LEFT JOIN campaign_recipients cr ON c.id = cr.campaign_id
LEFT JOIN emails e ON c.id = e.campaign_id
LEFT JOIN email_events ee ON e.id = ee.email_id
GROUP BY c.id, c.name, c.status;

-- Row Level Security (RLS) policies
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_recipients ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations for service role (for API routes)
-- In production, you should implement proper user-based RLS policies
CREATE POLICY "Allow all for service role" ON organizations FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON recipients FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON campaigns FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON emails FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON email_events FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON campaign_recipients FOR ALL USING (true);

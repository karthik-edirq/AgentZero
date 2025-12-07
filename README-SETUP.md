# Supabase Setup Instructions

## 1. Push Schema to Supabase

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to the SQL Editor
3. Copy the contents of `supabase/schema.sql`
4. Paste and run the SQL in the Supabase SQL Editor
5. This will create all necessary tables, indexes, views, and RLS policies

## 2. Environment Variables

Make sure your `.env` or `.env.local` file contains:

```env
# Supabase (use NEXT_PUBLIC_ prefix for client-side access)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SECRET_KEY=your-service-role-key

# Resend API
RESEND_API_KEY=re_your_resend_api_key
# Optional: Configure the "from" email address (default: AgentZero <onboarding@resend.dev>)
# Format: "Name <email@domain.com>" or just "email@domain.com"
RESEND_FROM_EMAIL="AgentZero <noreply@yourdomain.com>"
# Optional: Webhook secret for verifying Resend webhook signatures
# Get this from Resend Dashboard → Webhooks → Your Webhook → Secret
RESEND_WEBHOOK_SECRET=your_webhook_secret_here

# Gemini API
GEMINI_API_KEY=your_gemini_api_key
```

## 3. Database Schema Overview

The schema includes:

- **organizations**: Stores organization information
- **recipients**: Stores recipient email addresses and metadata
- **campaigns**: Stores campaign information
- **emails**: Stores sent email records
- **email_events**: Tracks email events (sent, delivered, opened, clicked, etc.)
- **campaign_recipients**: Junction table linking campaigns to recipients
- **campaign_stats**: View for aggregated campaign statistics

## 4. Testing the Integration

After pushing the schema:

1. Start your Next.js dev server: `npm run dev`
2. Try creating a campaign - it should save to Supabase
3. Try adding recipients - they should be saved to the recipients table
4. The email generation and sending should work with Gemini and Resend APIs

## 5. Row Level Security (RLS)

The schema includes RLS policies that allow all operations for the service role. In production, you should implement proper user-based RLS policies based on your authentication requirements.


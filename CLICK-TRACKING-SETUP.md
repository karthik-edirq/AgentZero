# Click & Open Tracking Setup Guide

## Important: Enable Tracking in Resend

**Both click and open tracking are disabled by default in Resend** and must be enabled at the domain level for events to be tracked.

## How to Enable Tracking

### Option 1: Via Resend Dashboard (Recommended)

1. Go to [Resend Dashboard](https://resend.com/domains)
2. Select your domain (or the default domain you're using)
3. Navigate to **Settings** → **Tracking**
4. Enable **Click Tracking** ✅
5. Enable **Open Tracking** ✅
6. Save changes

**Note:** Both tracking options should be enabled for full email analytics.

### Option 2: Via Resend API

```javascript
import { Resend } from 'resend';

const resend = new Resend('your-api-key');

await resend.domains.update({
  id: 'your-domain-id',
  clickTracking: true
});
```

## Verify Click Tracking is Working

1. **Send a test email** with a clickable link
2. **Click the link** in the email
3. **Check your webhook logs** - you should see:
   ```
   🖱️ CLICK EVENT DETECTED: { ... }
   🖱️ Processing click event: { ... }
   ```
4. **Check the dashboard** - click events should appear in the email timeline

## Webhook Events

Once enabled, Resend will send `email.clicked` webhook events when recipients click links in your emails. The webhook handler will:

- ✅ Save click events to the `email_events` table
- ✅ Update the `clicked_at` timestamp in the `emails` table
- ✅ Store the clicked link URL in the event's `raw` data
- ✅ Link click events to campaigns and recipients

## Troubleshooting

### No Click Events Being Received

1. **Check if click tracking is enabled:**
   - Go to Resend Dashboard → Domains → Your Domain → Settings
   - Verify "Click Tracking" is enabled

2. **Verify webhook is configured:**
   - Go to Resend Dashboard → Webhooks
   - Ensure `email.clicked` event is selected
   - Verify webhook URL is correct

3. **Check email content:**
   - Emails must contain clickable links (HTML `<a>` tags or markdown links)
   - Plain text URLs won't be tracked

4. **Check webhook logs:**
   - Look for `🖱️ CLICK EVENT DETECTED` in server logs
   - If not present, Resend isn't sending click events

### Click Events Received But Not Saved

1. **Check database logs:**
   - Look for `🖱️ Processing click event` in server logs
   - Verify `emailRecordId` is found (email must exist in database)

2. **Verify email linking:**
   - Click events are linked by `resend_email_id`
   - Ensure emails are saved with correct `resend_email_id` when sent

## Notes

- Click tracking works automatically once enabled - no code changes needed
- Click events include the clicked link URL in `event.data.link`
- Multiple clicks on the same link generate multiple events
- Click tracking only works for links in HTML emails (not plain text)


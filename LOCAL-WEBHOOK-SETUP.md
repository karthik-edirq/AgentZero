# Local Development Webhook Setup

## The Problem

Resend webhooks **cannot reach localhost**. When you run your app locally at `http://localhost:3000`, Resend's servers can't send webhook events to it because `localhost` is only accessible on your machine.

## Solution: Use a Tunnel Service

You need to expose your local server to the internet using a tunnel service.

## Option 1: ngrok (Recommended)

### Installation & Setup
```bash
# macOS
brew install ngrok

# Or download from https://ngrok.com/download
```

### Authentication (Required)
1. **Sign up for free account:**
   - Go to: https://dashboard.ngrok.com/signup
   - Create account (free)

2. **Get your authtoken:**
   - Go to: https://dashboard.ngrok.com/get-started/your-authtoken
   - Copy your authtoken

3. **Install authtoken:**
   ```bash
   ngrok config add-authtoken YOUR_AUTHTOKEN_HERE
   ```

### Usage
1. **Start your Next.js dev server:**
   ```bash
   npm run dev
   # Server runs on http://localhost:3000
   ```

2. **In a new terminal, start ngrok:**
   ```bash
   ngrok http 3000
   ```

3. **Copy the HTTPS URL:**
   ```
   Forwarding  https://abc123.ngrok.io -> http://localhost:3000
   ```

4. **Configure Resend webhook:**
   - Go to Resend Dashboard → Webhooks
   - Create/Edit webhook
   - URL: `https://abc123.ngrok.io/api/resend/webhook`
   - Select all events
   - Save

5. **Test:**
   - Send a test email
   - Check ngrok dashboard: http://localhost:4040 (shows all requests)
   - Check your server logs for webhook events

### ngrok Pro Tips
- **Free tier:** URL changes every time you restart ngrok
- **Paid tier:** Can use custom domain
- **Dashboard:** Visit http://localhost:4040 to see all webhook requests

## Option 2: Cloudflare Tunnel

### Installation
```bash
# macOS
brew install cloudflare/cloudflare/cloudflared
```

### Usage
```bash
cloudflared tunnel --url http://localhost:3000
```

## Option 3: LocalTunnel (No Signup Required! ⚡)

### Quick Start (Easiest Option)
```bash
# No installation needed - uses npx
npx localtunnel --port 3000
```

This will give you a URL like: `https://random-name.loca.lt`

**Advantages:**
- ✅ No signup required
- ✅ Works immediately
- ✅ Free

**Disadvantages:**
- ⚠️ URL changes each time
- ⚠️ May ask to visit URL in browser first (to verify you're human)

## Option 4: VS Code Port Forwarding

If using VS Code with port forwarding:
1. Right-click on port 3000
2. Select "Port Visibility" → "Public"
3. Use the provided public URL

## Testing Webhooks Locally

### 1. Verify Webhook Endpoint
```bash
curl https://your-tunnel-url.ngrok.io/api/resend/webhook
# Should return: { "message": "Resend webhook endpoint is active", ... }
```

### 2. Test with Resend Dashboard
- Go to Resend Dashboard → Webhooks → Your Webhook → Test
- Or send a real email and check webhook logs

### 3. Monitor Webhook Events
- **ngrok dashboard:** http://localhost:4040
- **Server logs:** Look for "🔔 Resend webhook received"
- **Resend Dashboard:** Webhooks → Your Webhook → Logs

## Quick Start Script

Create a script to start both servers:

```bash
#!/bin/bash
# start-dev.sh

# Start Next.js in background
npm run dev &

# Start ngrok
ngrok http 3000
```

## Production Setup

Once deployed to production (Vercel, Railway, etc.):
1. Update webhook URL to your production domain
2. Webhooks will work automatically
3. No tunnel needed!

## Troubleshooting

### Webhook not receiving events
1. ✅ Verify tunnel is running
2. ✅ Check webhook URL in Resend Dashboard
3. ✅ Test endpoint: `curl https://your-tunnel-url/api/resend/webhook`
4. ✅ Check ngrok dashboard for incoming requests
5. ✅ Check server logs for webhook events

### ngrok URL changes
- Free ngrok URLs change on restart
- Update webhook URL in Resend Dashboard each time
- Or use paid ngrok for static domain

### Webhook signature verification fails
- Make sure `RESEND_WEBHOOK_SECRET` matches Resend Dashboard
- Or temporarily disable signature check for testing


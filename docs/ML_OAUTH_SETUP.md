# 🔑 MercadoLibre OAuth Setup Guide

## Understanding the Credentials

### What You Already Have ✅
```bash
ML_APP_ID="1859583576625723"                           # Static (never changes)
ML_APP_SECRET_KEY="5hc7HhvtENT6Kd2hSgR3mhTW0Iql9WwS"    # Static (never changes)
```
**These are your APP credentials** - like a username/password for your application.

### What You Need to Generate 🔄
```bash
ML_ACCESS_TOKEN="TG-67891..."     # Expires every 6 hours
ML_REFRESH_TOKEN="TG-67892..."    # Used to get new access tokens
```
**These are USER credentials** - they prove you (the user) authorized the app.

---

## 🎯 Quick Setup (Recommended)

### Method 1: Use the Auto Script

Run this command:
```bash
cd /Users/agustinmontoya/Projectos/real-estate
node scripts/generate-ml-token.js
```

**What happens:**
1. Script starts a local server
2. Opens your browser to MercadoLibre authorization page
3. You click "Authorize"
4. Script automatically captures the tokens
5. Displays them for you to copy to `.env`

**Expected output:**
```
🎉 SUCCESS! Your tokens:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Add these to your .env file:

ML_ACCESS_TOKEN="TG-67891234abcd5678efgh9012ijkl3456"
ML_REFRESH_TOKEN="TG-67892345bcde6789fghi0123jklm4567"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⏰ Access token expires in: 6 hours
🔄 Refresh token expires in: Never
```

Then just copy those two lines to your `.env` file!

---

## 🔧 Method 2: Manual (If Script Fails)

### Step 1: Get Authorization URL
Visit this URL in your browser:
```
https://auth.mercadolibre.com.ar/authorization?response_type=code&client_id=1859583576625723&redirect_uri=http://localhost:3000/callback
```

### Step 2: Authorize the App
- Log in with your MercadoLibre account
- Click "Authorize"
- You'll be redirected to `http://localhost:3000/callback?code=TG-...`
- **Copy the code from the URL** (the part after `code=`)

### Step 3: Exchange Code for Tokens
Run this command (replace `YOUR_CODE_HERE` with the code from step 2):
```bash
curl -X POST https://api.mercadolibre.com/oauth/token \
  -H "Content-Type: application/json" \
  -d '{
    "grant_type": "authorization_code",
    "client_id": "1859583576625723",
    "client_secret": "5hc7HhvtENT6Kd2hSgR3mhTW0Iql9WwS",
    "code": "YOUR_CODE_HERE",
    "redirect_uri": "http://localhost:3000/callback"
  }'
```

**Response:**
```json
{
  "access_token": "TG-67891234abcd5678efgh9012ijkl3456",
  "refresh_token": "TG-67892345bcde6789fghi0123jklm4567",
  "expires_in": 21600,
  "user_id": 123456789,
  "token_type": "Bearer"
}
```

### Step 4: Add to .env
```bash
ML_ACCESS_TOKEN="TG-67891234abcd5678efgh9012ijkl3456"
ML_REFRESH_TOKEN="TG-67892345bcde6789fghi0123jklm4567"
```

---

## 🔄 When Tokens Expire

Access tokens expire after 6 hours. When that happens:

### Option A: Auto-Refresh (Built into scraper)
The scraper will automatically refresh the token using the refresh token when it gets a 401 error.

### Option B: Manual Refresh
```bash
curl -X POST https://api.mercadolibre.com/oauth/token \
  -H "Content-Type: application/json" \
  -d '{
    "grant_type": "refresh_token",
    "client_id": "1859583576625723",
    "client_secret": "5hc7HhvtENT6Kd2hSgR3mhTW0Iql9WwS",
    "refresh_token": "YOUR_REFRESH_TOKEN"
  }'
```

---

## 🧪 Test Your Tokens

Once you have the tokens in `.env`, test them:

```bash
# Test with MercadoLibre API
curl -H "Authorization: Bearer $ML_ACCESS_TOKEN" \
  https://api.mercadolibre.com/users/me

# Test the scraper
curl "http://localhost:3000/api/scrape/mercadolibre?limit=5"
```

---

## ❓ FAQ

### Q: Do I need a MercadoLibre seller account?
**A:** No, any MercadoLibre user account works (buyer or seller).

### Q: Why do tokens expire?
**A:** Security. Access tokens are short-lived (6 hours). Refresh tokens last forever and are used to get new access tokens.

### Q: What if the script doesn't open my browser?
**A:** Copy the URL from the terminal and paste it into your browser manually.

### Q: Can I use the same tokens on multiple machines?
**A:** Yes, but only one set of tokens works at a time. Generating new tokens invalidates the old ones.

### Q: What permissions does the app need?
**A:** Just read access to public listings. No write permissions needed for scraping.

---

## 🚨 Troubleshooting

### Error: "redirect_uri mismatch"
The redirect URI in your MercadoLibre app settings must match exactly:
```
http://localhost:6019/callback
```

Go to: https://developers.mercadolibre.com.ar → Your App → Settings → Add redirect URI

### Error: "invalid_client"
Double-check your `ML_APP_ID` and `ML_APP_SECRET_KEY` in `.env`

### Error: "code_verifier required"
MercadoLibre may require PKCE. Use the auto script instead of manual method.

---

**Next:** After adding tokens to `.env`, test the scraper:
```bash
curl "http://localhost:3000/api/scrape/mercadolibre?city=Córdoba&limit=5"
```

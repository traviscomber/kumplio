# KUMPLIO - Quick Deploy Guide

## For First-Time Deployment

### 30-Second Setup
```bash
# 1. Ensure environment variables are set in Vercel:
#    - NEXT_PUBLIC_SUPABASE_URL
#    - NEXT_PUBLIC_SUPABASE_ANON_KEY
#    - SUPABASE_SERVICE_ROLE_KEY
#    - OPENAI_API_KEY

# 2. Push to main branch
git push origin main

# 3. Watch deployment on Vercel Dashboard
# Deployment completes in ~60-90 seconds

# 4. Test at https://your-domain.com
```

---

## Key Files

| File | Purpose | When to Change |
|------|---------|-----------------|
| `DEPLOYMENT_READINESS.md` | Complete deployment guide | Before production |
| `DEPLOYMENT_CHECKLIST.md` | Production checklist | After each deploy |
| `scripts/verify-deployment.sh` | Pre-deploy verification | Before pushing |
| `next.config.mjs` | Next.js config | For optimization |
| `vercel.json` | Vercel settings | For custom routing |

---

## Critical Environment Variables

Must be set in Vercel Project Settings → Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL      = Your Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY = Your anon key (public, safe)
SUPABASE_SERVICE_ROLE_KEY     = Service role key (secret!)
OPENAI_API_KEY                = Your OpenAI API key
```

---

## Verify Before Deploy

```bash
# Run this script
bash scripts/verify-deployment.sh

# If all checks pass: ✅ Ready to deploy
# If any fail: Fix issues first, then try again
```

---

## After Deployment

1. **Monitor first 15 minutes**
   - Vercel Dashboard → Deployments
   - Look for errors or warnings

2. **Test critical flows**
   - Sign-up: https://your-domain.com/sign-up
   - Login: https://your-domain.com/sign-in
   - Dashboard: https://your-domain.com/dashboard

3. **Check logs**
   - Supabase: Database → Logs
   - Browser: F12 → Console tab

---

## Emergency Rollback

If deployment breaks:

```bash
# Go to Vercel Dashboard → Deployments
# Find previous working deployment
# Click "Restore" button
# That's it! Takes ~30 seconds
```

---

## Success Criteria

Site is live when you see:
- ✅ Green deployment status in Vercel
- ✅ Pages load without errors
- ✅ Authentication works
- ✅ Dashboard displays correctly
- ✅ No console errors (F12)

---

## Need Help?

- Check `DEPLOYMENT_READINESS.md` for detailed guide
- Review `DEPLOYMENT_CHECKLIST.md` for pre-launch items
- See "Common Issues & Solutions" in `DEPLOYMENT_READINESS.md`

**Time to Deploy:** ~5 minutes  
**Time to Verify:** ~10 minutes  
**Total:** ~15 minutes

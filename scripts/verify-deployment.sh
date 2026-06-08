#!/bin/bash
# KUMPLIO Deployment Verification Script
# Run this before deploying to verify everything is ready

set -e

echo "🚀 KUMPLIO Deployment Verification"
echo "==================================="
echo ""

# Check 1: Build Status
echo "✓ Checking build status..."
if npm run build > /dev/null 2>&1; then
    echo "  ✅ Build successful (0 errors)"
else
    echo "  ❌ Build failed - fix errors before deploying"
    exit 1
fi
echo ""

# Check 2: TypeScript
echo "✓ Checking TypeScript..."
if npx tsc --noEmit > /dev/null 2>&1; then
    echo "  ✅ TypeScript: No errors"
else
    echo "  ⚠️  TypeScript errors found"
fi
echo ""

# Check 3: Environment Variables
echo "✓ Checking environment variables..."
required_vars=("NEXT_PUBLIC_SUPABASE_URL" "NEXT_PUBLIC_SUPABASE_ANON_KEY" "OPENAI_API_KEY")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "  ⚠️  Missing: $var (set in Vercel Settings)"
    else
        echo "  ✅ $var: Set"
    fi
done
echo ""

# Check 4: Routes
echo "✓ Checking routes..."
route_count=$(find app -name "page.tsx" | wc -l)
echo "  ✅ Found $route_count pages"
echo ""

# Check 5: Git Status
echo "✓ Checking git status..."
if [ -z "$(git status --porcelain)" ]; then
    echo "  ✅ Git: Clean (ready to push)"
else
    echo "  ⚠️  Git: Uncommitted changes"
    git status --porcelain | head -5
fi
echo ""

echo "==================================="
echo "✅ Pre-deployment checks complete!"
echo ""
echo "Next steps:"
echo "1. Verify environment variables in Vercel Settings"
echo "2. Test locally: npm run dev"
echo "3. Deploy: git push origin main"
echo "4. Monitor: Check Vercel dashboard"

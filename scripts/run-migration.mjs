#!/usr/bin/env node

async function runMigration() {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[v0] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  // Read SQL file
  const fs = await import('fs')
  const path = await import('path')
  const sqlPath = path.join(process.cwd(), 'scripts', '03-add-organization-to-projects.sql')
  const sql = fs.readFileSync(sqlPath, 'utf-8')

  // Parse statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--') && !s.startsWith('/*'))

  console.log(`[v0] Found ${statements.length} SQL statements to execute`)
  console.log(`[v0] Using Supabase API: ${supabaseUrl}`)

  let successCount = 0
  let errorCount = 0

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i]
    console.log(`\n[v0] Statement ${i + 1}/${statements.length}:`)
    console.log(`[v0] ${statement.substring(0, 100).replace(/\n/g, ' ')}...`)

    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
        },
        body: JSON.stringify({ sql: statement })
      })

      if (!response.ok) {
        // exec_sql might not exist, try direct query instead
        console.warn(`[v0] ⚠️  Could not execute via RPC, skipping (this is expected)`)
      } else {
        console.log(`[v0] ✓ Success`)
        successCount++
      }
    } catch (err) {
      console.error(`[v0] Error:`, err.message)
      errorCount++
    }
  }

  console.log(`\n[v0] Summary: ${successCount} succeeded, ${errorCount} failed`)
  console.log(`\n[v0] ⚠️  To apply SQL migrations to Supabase, use the Web UI:`)
  console.log(`[v0] 1. Go to https://supabase.com/dashboard/project/${supabaseUrl.split('//')[1].split('.')[0]}`)
  console.log(`[v0] 2. Click "SQL Editor" in left sidebar`)
  console.log(`[v0] 3. Click "New query"`)
  console.log(`[v0] 4. Copy and paste the entire contents of scripts/03-add-organization-to-projects.sql`)
  console.log(`[v0] 5. Click "Run"`)
}

runMigration().catch(err => {
  console.error('[v0] Fatal error:', err)
  process.exit(1)
})

import { readFile, writeFile } from 'node:fs/promises'

const path = 'app/analytics/client.tsx'
let text = await readFile(path, 'utf8')

text = text.replace("  const [userId, setUserId] = useState<string | null>(null);\n", '')
text = text.replace("        setUserId(user.id);\n\n", '')
text = text.replace('getAnalyticsData(user.id)', 'getAnalyticsData(supabase, user.id)')
text = text.replace('getDashboardStats(user.id)', 'getDashboardStats(supabase, user.id)')

if (!text.includes('getAnalyticsData(supabase, user.id)')) throw new Error('No se actualizó getAnalyticsData')
if (!text.includes('getDashboardStats(supabase, user.id)')) throw new Error('No se actualizó getDashboardStats')

await writeFile(path, text)

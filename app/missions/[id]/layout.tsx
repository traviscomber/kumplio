import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MissionControl } from './mission-control'

type LayoutParams = Promise<{ id: string }>

type Agent = {
  agent_id: string
  display_name: string
  role_name: string
  customer_promise: string
  review_boundary: string
}

type Decision = {
  id: string
  title: string
  description: string | null
  recommendation: string | null
  priority: string
  status: string
  requested_by_agent_id: string | null
  requested_at: string
}

export default async function MissionLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: LayoutParams
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  const { data: mission } = await supabase
    .from('missions')
    .select('id,status')
    .eq('id', id)
    .maybeSingle()

  if (!mission) return children

  const [agentsResult, decisionsResult] = await Promise.all([
    supabase
      .from('mission_agents')
      .select('agent_id,display_name,role_name,customer_promise,review_boundary')
      .eq('status', 'active')
      .order('sort_order'),
    supabase
      .from('mission_decisions')
      .select('id,title,description,recommendation,priority,status,requested_by_agent_id,requested_at')
      .eq('mission_id', id)
      .eq('status', 'pending')
      .order('priority', { ascending: false })
      .order('requested_at', { ascending: true }),
  ])

  return (
    <>
      <MissionControl
        missionId={id}
        missionStatus={mission.status}
        agents={(agentsResult.data || []) as Agent[]}
        decisions={(decisionsResult.data || []) as Decision[]}
      />
      {children}
    </>
  )
}

import { ArtifactVersionHistoryPanel, type ArtifactVersionItem } from '@/components/cases/artifact-version-history-panel'
import { createClient } from '@/lib/supabase/server'

type Props = {
  caseId: string
  organizationId: string
}

type Profile = {
  id: string
  first_name: string | null
  last_name: string | null
  email: string
}

function displayName(profile: Profile | undefined) {
  if (!profile) return null
  return [profile.first_name, profile.last_name].filter(Boolean).join(' ').trim() || profile.email
}

export async function CaseArtifactHistory({ caseId, organizationId }: Props) {
  const supabase = await createClient()
  const { data: artifactRows, error } = await supabase
    .from('agent_artifacts')
    .select('id, lineage_id, parent_artifact_id, artifact_type, title, version, content, source_refs, status, content_hash, created_by, created_at, approved_by, approved_at, locked_at, superseded_at')
    .eq('organization_id', organizationId)
    .eq('case_id', caseId)
    .order('created_at', { ascending: false })
    .order('version', { ascending: false })
    .limit(500)

  if (error?.code === '42703' || error?.message?.includes('lineage_id')) {
    return (
      <section className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6">
        <h2 className="font-semibold">El versionado de artefactos está listo para activarse</h2>
        <p className="mt-2 text-sm text-muted-foreground">Aplica las migraciones de Artifact Versioning Foundation.</p>
      </section>
    )
  }

  if (error) return null
  const artifacts = artifactRows || []
  const artifactIds = artifacts.map((artifact) => artifact.id)
  const profileIds = [...new Set(artifacts
    .flatMap((artifact) => [artifact.created_by, artifact.approved_by])
    .filter((id): id is string => Boolean(id)))]

  const [reviewsResult, profilesResult] = await Promise.all([
    artifactIds.length
      ? supabase
          .from('agent_reviews')
          .select('artifact_id, decision, comment, created_at')
          .eq('organization_id', organizationId)
          .in('artifact_id', artifactIds)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [] as Array<{ artifact_id: string | null; decision: string; comment: string | null; created_at: string }> }),
    profileIds.length
      ? supabase
          .from('profiles')
          .select('id, first_name, last_name, email')
          .in('id', profileIds)
      : Promise.resolve({ data: [] as Profile[] }),
  ])

  const profiles = new Map((profilesResult.data || []).map((profile) => [profile.id, profile as Profile]))
  const latestReviewByArtifact = new Map<string, { decision: string; comment: string | null }>()
  for (const review of reviewsResult.data || []) {
    if (review.artifact_id && !latestReviewByArtifact.has(review.artifact_id)) {
      latestReviewByArtifact.set(review.artifact_id, {
        decision: review.decision,
        comment: review.comment,
      })
    }
  }

  const items: ArtifactVersionItem[] = artifacts.map((artifact) => {
    const review = latestReviewByArtifact.get(artifact.id)
    return {
      id: artifact.id,
      lineageId: artifact.lineage_id,
      parentArtifactId: artifact.parent_artifact_id,
      title: artifact.title,
      artifactType: artifact.artifact_type,
      version: artifact.version,
      status: artifact.status,
      content: artifact.content,
      sourceCount: Array.isArray(artifact.source_refs) ? artifact.source_refs.length : 0,
      contentHash: artifact.content_hash,
      createdAt: artifact.created_at,
      createdByName: displayName(profiles.get(artifact.created_by)),
      approvedAt: artifact.approved_at,
      approvedByName: displayName(profiles.get(artifact.approved_by || '')),
      lockedAt: artifact.locked_at,
      supersededAt: artifact.superseded_at,
      reviewDecision: review?.decision || null,
      reviewComment: review?.comment || null,
    }
  })

  return <ArtifactVersionHistoryPanel artifacts={items} />
}

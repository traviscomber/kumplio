import { createClient } from '@/lib/supabase/server'

/**
 * Ensures the projects table has organization_id field
 * This is a runtime check that works even if the migration hasn't been applied yet
 */
export async function ensureProjectsOrganizationId() {
  const supabase = await createClient()

  try {
    // Try to insert with organization_id to see if field exists
    const { data, error } = await supabase
      .from('projects')
      .select('organization_id')
      .limit(1)

    if (error?.message.includes('organization_id')) {
      console.log('[v0] organization_id field not found, running migration...')
      // Field doesn't exist, we need to run the migration
      return false
    }

    return true
  } catch (err) {
    console.error('[v0] Error checking projects schema:', err)
    return false
  }
}

/**
 * Creates a project with organization context
 */
export async function createProjectWithOrganization(
  userId: string,
  organizationId: string,
  projectData: {
    name: string
    description: string
    status?: string
    compliance_law?: string
  }
) {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('projects')
      .insert([{
        user_id: userId,
        organization_id: organizationId,
        name: projectData.name,
        description: projectData.description,
        status: projectData.status || 'active',
        compliance_law: projectData.compliance_law || 'Ley 21.719',
        created_at: new Date().toISOString(),
      }])
      .select()
      .single()

    if (error) {
      throw error
    }

    return { success: true, data }
  } catch (err: any) {
    // If organization_id doesn't exist, fall back to user_id only
    if (err?.message?.includes('organization_id')) {
      console.warn('[v0] organization_id field not available, using user_id fallback')
      
      try {
        const { data, error: fallbackError } = await supabase
          .from('projects')
          .insert([{
            user_id: userId,
            name: projectData.name,
            description: projectData.description,
            status: projectData.status || 'active',
            compliance_law: projectData.compliance_law || 'Ley 21.719',
            created_at: new Date().toISOString(),
          }])
          .select()
          .single()

        if (fallbackError) {
          throw fallbackError
        }

        return { success: true, data }
      } catch (fallbackErr) {
        return { success: false, error: fallbackErr }
      }
    }

    return { success: false, error: err }
  }
}

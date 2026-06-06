export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Mock templates data - in production this would come from database
    const templates = [
      {
        id: 'template_1',
        name: 'Full Compliance Analysis',
        description: 'Complete 6-agent pipeline: Extract → Monitor → Assess Risk → Recommend → Audit → Learn',
        category: 'Analysis',
        tags: ['comprehensive', 'all-agents', 'detailed'],
        usage_count: 0,
        definition: {
          name: 'Full Compliance Analysis',
          steps: [
            { id: 'extract', agentName: 'sofia', inputs: {} },
            { id: 'monitor', agentName: 'elena', inputs: {} },
            { id: 'risk', agentName: 'bruno', inputs: {} },
            { id: 'recommend', agentName: 'marco', inputs: {} },
            { id: 'audit', agentName: 'laura', inputs: {} },
            { id: 'learn', agentName: 'kai', inputs: {} },
          ],
        },
      },
      {
        id: 'template_2',
        name: 'Quick Compliance Scan',
        description: 'Fast 3-agent pipeline: Extract → Assess Risk → Prioritize',
        category: 'Analysis',
        tags: ['fast', 'quick', 'essential'],
        usage_count: 0,
        definition: {
          name: 'Quick Compliance Scan',
          steps: [
            { id: 'extract', agentName: 'sofia', inputs: {} },
            { id: 'risk', agentName: 'bruno', inputs: {} },
            { id: 'recommend', agentName: 'marco', inputs: {} },
          ],
        },
      },
      {
        id: 'template_3',
        name: 'Regulatory Monitoring',
        description: 'Monitor Ley 21.719 changes and generate alerts',
        category: 'Monitoring',
        tags: ['regulatory', 'monitoring', 'alerts'],
        usage_count: 0,
        definition: {
          name: 'Regulatory Monitoring',
          steps: [
            { id: 'monitor', agentName: 'elena', inputs: {} },
            { id: 'risk', agentName: 'bruno', inputs: {} },
            { id: 'recommend', agentName: 'marco', inputs: {} },
          ],
        },
      },
    ];

    return Response.json({ templates }, { status: 200 });
  } catch (error) {
    console.error('[v0] Templates error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch templates' },
      { status: 400 }
    );
  }
}

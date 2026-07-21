import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getAgentProfile } from '@/lib/agents/catalog'
import { prepareAgentInput } from '@/lib/agents/input-security'
import { AgentRuntimeError, runAgent } from '@/lib/agents/openai-runtime'

export const runtime = 'nodejs'
export const maxDuration = 300

const requestSchema = z.object({
'use client'

import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  CheckCircle2,
  FileCheck2,
  GitBranch,
  ListChecks,
  SearchCheck,
  ShieldCheck,
  TriangleAlert,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Footer } from '@/components/footer'
import { TrustSignals } from '@/components/trust-signals'
import { InteractiveDiagnosis } from '@/components/interactive-diagnosis'
import { SpecialistsGrid } from '@/components/specialists-grid'

const lifecycle = [
  {
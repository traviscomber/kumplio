import { CheckCircle2, Circle } from 'lucide-react'
import { passwordRequirements } from '@/lib/auth/password-policy'

export function PasswordRequirements({ password }: { password: string }) {
  const requirements = passwordRequirements(password)

  return (
    <div aria-live="polite" className="grid gap-2 rounded-xl border border-border bg-muted/20 p-3 sm:grid-cols-2">
      {requirements.map((requirement) => (
        <div
          key={requirement.id}
          className={`flex items-center gap-2 text-xs ${requirement.met ? 'text-emerald-700 dark:text-emerald-300' : 'text-muted-foreground'}`}
        >
          {requirement.met
            ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            : <Circle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
          <span>{requirement.label}</span>
        </div>
      ))}
    </div>
  )
}

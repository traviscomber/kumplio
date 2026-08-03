import { readFile, writeFile } from 'node:fs/promises'

async function updateSignUp() {
  const path = 'app/(auth)/sign-up/page.tsx'
  let text = await readFile(path, 'utf8')

  text = text.replace(
    "import { FormEvent, useMemo, useState } from 'react'",
    "import { FormEvent, useState } from 'react'",
  )
  text = text.replace(
    "import { Button } from '@/components/ui/button'",
    "import { Button } from '@/components/ui/button'\nimport { PasswordRequirements } from '@/components/auth/password-requirements'\nimport { PASSWORD_MIN_LENGTH, PASSWORD_POLICY_MESSAGE, authErrorMessage, isStrongPassword } from '@/lib/auth/password-policy'",
  )

  text = text.replace(/\nfunction passwordScore\(password: string\) \{[\s\S]*?\n\}\n\nexport default function SignUp/, '\nexport default function SignUp')
  text = text.replace(
    "  const strength = useMemo(() => passwordScore(password), [password])\n  const passwordReady = password.length >= 10 && strength >= 3",
    "  const passwordReady = isStrongPassword(password)",
  )
  text = text.replace(
    "setError('La contraseña debe tener al menos 10 caracteres y combinar distintos tipos de caracteres.')",
    'setError(PASSWORD_POLICY_MESSAGE)',
  )
  text = text.replace('setError(signUpError.message)', 'setError(authErrorMessage(signUpError))')
  text = text.replace('minLength={10} autoComplete="new-password" placeholder="Mínimo 10 caracteres"', 'minLength={PASSWORD_MIN_LENGTH} autoComplete="new-password" placeholder="Mínimo 12 caracteres"')
  text = text.replace(/\n              <div className="grid grid-cols-5 gap-1" aria-label="Fortaleza de contraseña">[\s\S]*?<\/div>\n              <span className="text-xs text-muted-foreground">Usa 10 o más caracteres y combina mayúsculas, minúsculas, números o símbolos\.<\/span>/, '\n              <PasswordRequirements password={password} />')

  if (!text.includes('isStrongPassword(password)')) throw new Error('No se aplicó la política en registro')
  if (!text.includes('<PasswordRequirements password={password} />')) throw new Error('No se agregó la lista de requisitos en registro')
  await writeFile(path, text)
}

async function updatePasswordRecovery() {
  const path = 'app/(auth)/update-password/page.tsx'
  let text = await readFile(path, 'utf8')

  text = text.replace(
    "import { FormEvent, useEffect, useMemo, useState } from 'react'",
    "import { FormEvent, useEffect, useState } from 'react'",
  )
  text = text.replace(
    "import { Button } from '@/components/ui/button'",
    "import { Button } from '@/components/ui/button'\nimport { PasswordRequirements } from '@/components/auth/password-requirements'\nimport { PASSWORD_MIN_LENGTH, PASSWORD_POLICY_MESSAGE, authErrorMessage, isStrongPassword } from '@/lib/auth/password-policy'",
  )

  text = text.replace(/\nfunction passwordScore\(password: string\) \{[\s\S]*?\n\}\n\nexport default function UpdatePasswordPage/, '\nexport default function UpdatePasswordPage')
  text = text.replace(
    "  const strength = useMemo(() => passwordScore(password), [password])\n  const passwordReady = password.length >= 10 && strength >= 3 && password === confirmation",
    "  const passwordReady = isStrongPassword(password) && password === confirmation",
  )
  text = text.replace(
    "setError('La contraseña debe tener al menos 10 caracteres y combinar distintos tipos de caracteres.')",
    'setError(PASSWORD_POLICY_MESSAGE)',
  )
  text = text.replace('setError(updateError.message)', 'setError(authErrorMessage(updateError))')
  text = text.replaceAll('minLength={10}', 'minLength={PASSWORD_MIN_LENGTH}')
  text = text.replace(/\n            <div className="grid grid-cols-5 gap-1">[\s\S]*?<\/div>/, '\n            <PasswordRequirements password={password} />')

  if (!text.includes('isStrongPassword(password)')) throw new Error('No se aplicó la política en recuperación')
  if (!text.includes('<PasswordRequirements password={password} />')) throw new Error('No se agregó la lista de requisitos en recuperación')
  await writeFile(path, text)
}

async function updateSignIn() {
  const path = 'app/(auth)/sign-in/page.tsx'
  let text = await readFile(path, 'utf8')
  text = text.replace(
    "import { Button } from '@/components/ui/button'",
    "import { Button } from '@/components/ui/button'\nimport { authErrorMessage } from '@/lib/auth/password-policy'",
  )
  text = text.replace('setError(signInError.message)', 'setError(authErrorMessage(signInError))')
  if (!text.includes('authErrorMessage(signInError)')) throw new Error('No se normalizaron errores de inicio de sesión')
  await writeFile(path, text)
}

await updateSignUp()
await updatePasswordRecovery()
await updateSignIn()

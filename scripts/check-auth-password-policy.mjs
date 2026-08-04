import { readFile } from 'node:fs/promises'

const failures = []
const files = {
  signup: await readFile('app/(auth)/sign-up/page.tsx', 'utf8'),
  update: await readFile('app/(auth)/update-password/page.tsx', 'utf8'),
  signin: await readFile('app/(auth)/sign-in/page.tsx', 'utf8'),
  policy: await readFile('lib/auth/password-policy.ts', 'utf8'),
}

for (const [name, content] of Object.entries(files)) {
  if (content.includes('passwordScore(')) failures.push(`${name} mantiene una política duplicada passwordScore`)
  if (content.includes('minLength={10}')) failures.push(`${name} todavía acepta 10 caracteres`)
}

for (const expected of [
  'PASSWORD_MIN_LENGTH = 12',
  'isStrongPassword',
  'Una letra minúscula',
  'Una letra mayúscula',
  'Un número',
  'Un símbolo',
]) {
  if (!files.policy.includes(expected)) failures.push(`La política central no contiene: ${expected}`)
}

for (const expected of [
  'isStrongPassword(password)',
  '<PasswordRequirements password={password} />',
  'minLength={PASSWORD_MIN_LENGTH}',
]) {
  if (!files.signup.includes(expected)) failures.push(`Registro no contiene: ${expected}`)
  if (!files.update.includes(expected)) failures.push(`Recuperación no contiene: ${expected}`)
}

if (!files.signin.includes('authErrorMessage(signInError)')) {
  failures.push('Inicio de sesión no normaliza errores de contraseña débil')
}

if (failures.length) {
  console.error('\nAuth password policy validation failed:\n')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}

console.log('Auth password policy validation passed.')

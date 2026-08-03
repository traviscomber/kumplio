export const PASSWORD_MIN_LENGTH = 12

export type PasswordRequirement = {
  id: 'length' | 'lowercase' | 'uppercase' | 'number' | 'symbol'
  label: string
  met: boolean
}

export function passwordRequirements(password: string): PasswordRequirement[] {
  return [
    {
      id: 'length',
      label: `${PASSWORD_MIN_LENGTH} o más caracteres`,
      met: password.length >= PASSWORD_MIN_LENGTH,
    },
    {
      id: 'lowercase',
      label: 'Una letra minúscula',
      met: /[a-z]/.test(password),
    },
    {
      id: 'uppercase',
      label: 'Una letra mayúscula',
      met: /[A-Z]/.test(password),
    },
    {
      id: 'number',
      label: 'Un número',
      met: /\d/.test(password),
    },
    {
      id: 'symbol',
      label: 'Un símbolo',
      met: /[^A-Za-z0-9]/.test(password),
    },
  ]
}

export function isStrongPassword(password: string) {
  return passwordRequirements(password).every((requirement) => requirement.met)
}

export const PASSWORD_POLICY_MESSAGE =
  'Usa 12 o más caracteres e incluye minúscula, mayúscula, número y símbolo.'

type AuthErrorLike = {
  code?: string
  name?: string
  message?: string
}

export function authErrorMessage(error: AuthErrorLike) {
  if (error.code === 'weak_password' || error.name === 'AuthWeakPasswordError') {
    return 'Tu contraseña actual ya no cumple la política de seguridad. Restablécela para continuar.'
  }

  if (error.code === 'invalid_credentials') {
    return 'El correo o la contraseña no son correctos.'
  }

  if (error.code === 'email_not_confirmed') {
    return 'Confirma tu correo antes de iniciar sesión.'
  }

  if (error.code === 'user_banned') {
    return 'Esta cuenta no puede iniciar sesión. Contacta a soporte.'
  }

  return error.message || 'No fue posible completar la autenticación.'
}

# Flujo de autenticación

## Registro

1. La persona selecciona un plan o ingresa directamente al registro.
2. Kumplio conserva `plan` y `next` durante el alta.
3. Supabase envía la confirmación a `/auth/callback`.
4. El callback valida el destino y continúa a `/onboarding`.

## Recuperación de contraseña

1. `/forgot-password` solicita un enlace temporal mediante Supabase.
2. El enlace vuelve a `/auth/callback?next=/update-password`.
3. `/update-password` valida la sesión de recuperación y permite definir una contraseña nueva.
4. Al finalizar se cierra la sesión temporal y se redirige a `/sign-in`.

## Configuración requerida

- Autorizar `https://kumplio.app/auth/callback` en las Redirect URLs de Supabase.
- Autorizar las URLs de preview necesarias solo durante validación.
- No iniciar cobros automáticamente desde el registro o el onboarding.

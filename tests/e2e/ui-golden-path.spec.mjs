import { expect, test } from '@playwright/test'

const email = requiredEnv('E2E_EMAIL')
const password = requiredEnv('E2E_PASSWORD')
const organizationName = requiredEnv('E2E_ORGANIZATION_NAME')
const runId = requiredEnv('GITHUB_RUN_ID')
const runAttempt = requiredEnv('GITHUB_RUN_ATTEMPT')
const marker = `${runId}-${runAttempt}`
const goal = `UI E2E ${marker}: preparar una organización sintética para la Ley 21.719 con evidencia, responsables y límites explícitos`
const activityName = `Gestión sintética de solicitudes de privacidad ${marker}`

test('completa el tercer golden path usando únicamente la interfaz', async ({ page }, testInfo) => {
  await test.step('conservar el contexto desde la entrada pública', async () => {
    await page.goto('/es')
    await page.getByRole('button', { name: 'Persona', exact: true }).click()
    await page.getByRole('button', { name: 'Quiero entender cómo están usando mis datos', exact: true }).click()
    await page.getByRole('button', { name: 'Empezar con guía experta', exact: true }).click()
    await expect(page).toHaveURL(/\/sign-up\?/, { timeout: 30_000 })
    expect(new URL(page.url()).searchParams.get('next')).toBe('/onboarding')
  })

  await test.step('iniciar sesión con una cuenta E2E confirmada', async () => {
    await page.goto('/sign-in?next=/onboarding')
    await page.getByLabel('Correo electrónico').fill(email)
    await page.locator('input#password').fill(password)
    await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click()
    await expect(page).toHaveURL(/\/onboarding(?:\?|$)/, { timeout: 45_000 })
    await expect(page.getByRole('heading', { name: /Persona, profesional o empresa/ })).toBeVisible()
  })

  await test.step('crear el workspace desde el onboarding visual', async () => {
    await page.getByRole('button', { name: /^Empresa/ }).click()
    await page.getByRole('button', { name: 'Continuar', exact: true }).click()

    await page.getByPlaceholder(/Necesito ordenar contratos/).fill(goal)
    await page.getByRole('button', { name: 'Continuar', exact: true }).click()

    await page.getByLabel('Nombre').fill('UI Golden Path')
    await page.getByLabel('Apellido (opcional)').fill('E2E')
    await page.getByLabel('Organización').fill(organizationName)
    await page.getByLabel('Trabajadores aproximados').fill('20')
    await page.getByRole('button', { name: 'Continuar', exact: true }).click()

    const handoff = page.getByText('Diagnóstico inicial preparado', { exact: true })
    const submit = page.getByRole('button', { name: 'Crear mi primer diagnóstico', exact: true })
    await expect(submit.or(handoff)).toBeVisible({ timeout: 60_000 })
    if (await submit.isVisible().catch(() => false)) await submit.click()

    await expect(handoff).toBeVisible({ timeout: 60_000 })
    await expect(page.getByRole('heading', { name: 'Tu primer paso ya está claro', exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Ir a mi siguiente acción', exact: true })).toBeVisible()
    await page.getByRole('link', { name: 'Ver mi inicio', exact: true }).click()
    await expect(page).toHaveURL(/\/app\/inicio(?:\?|$)/, { timeout: 45_000 })
  })

  await test.step('abrir un expediente guiado desde la UI', async () => {
    await page.goto('/cases/new')
    await page.getByRole('button', { name: 'Empresa', exact: true }).click()
    await page.getByLabel('¿Qué necesitas proteger o resolver?').fill(goal)
    await page.getByRole('button', { name: 'Preparar mi caso', exact: true }).click()
    await expect(page).toHaveURL(/\/cases\/[0-9a-f-]{36}(?:\?|$)/i, { timeout: 90_000 })
    await expect(page.getByRole('heading', { name: goal })).toBeVisible()
  })

  for (let stageIndex = 0; stageIndex < 3; stageIndex += 1) {
    await test.step(`revisar y aprobar la etapa ${stageIndex + 1} de 3`, async () => {
      const review = page.getByRole('main')
      await waitForReview(page, stageIndex)
      await review.getByPlaceholder('Justifica la aprobación o explica qué debe corregirse...').fill(
        `Aprobación UI E2E de la etapa ${stageIndex + 1}: se revisaron fuentes, evidencia, reservas y límites antes de continuar.`,
      )
      await review.getByLabel('Revisé las fuentes y evidencias relacionadas.').check()
      await review.getByLabel('Entiendo los supuestos, reservas y datos que todavía faltan.').check()
      await review.getByLabel('La conclusión está suficientemente respaldada para avanzar.').check()
      await review.getByRole('button', { name: 'Aprobar y continuar', exact: true }).click()
      await expect(review.getByRole('button', { name: 'Aprobar y continuar', exact: true })).toBeHidden({ timeout: 90_000 })
    })
  }

  await test.step('crear misión y solicitud de evidencia desde el expediente', async () => {
    await waitForWorkflowCompletion(page)
    await page.getByRole('button', { name: 'Convertir en plan operativo', exact: true }).click()
    const dialog = page.getByRole('dialog', { name: 'Plan operativo del expediente' })
    await expect(dialog).toBeVisible()
    await dialog.getByRole('button', { name: 'Crear misión y solicitud', exact: true }).click()
    await expect(dialog.getByText('Plan operativo creado.')).toBeVisible({ timeout: 60_000 })
    await dialog.getByRole('button', { name: 'Cerrar', exact: true }).click()
    await expect(dialog).toBeHidden()
  })

  await test.step('cerrar la línea base con aceptación humana explícita', async () => {
    await page.reload({ waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: 'Cerrar una línea base honesta y verificable' })).toBeVisible({ timeout: 60_000 })
    await page.getByLabel(/Acepto el alcance inicial/).check()
    await page.getByLabel(/Acepto la operación parcial/).check()
    await page.getByRole('button', { name: 'Aceptar línea base y cerrar misión', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Línea base inicial cerrada.' })).toBeVisible({ timeout: 90_000 })
  })

  await test.step('registrar y revisar una actividad de tratamiento desde el formulario', async () => {
    await page.goto('/digital-twin')
    await expect(page.getByRole('heading', { name: 'Qué datos usas, para qué y dónde están.' })).toBeVisible()

    const registerButton = page.getByRole('button', { name: 'Registrar actividad', exact: true })
    if (await registerButton.isVisible().catch(() => false)) await registerButton.click()

    await page.getByLabel('Expediente relacionado').selectOption({ label: goal })
    const controlSelect = page.getByLabel('Control de inventario')
    if (!(await controlSelect.inputValue())) {
      const firstControl = await controlSelect.locator('option').nth(1).getAttribute('value')
      if (firstControl) await controlSelect.selectOption(firstControl)
    }

    await page.getByLabel('Nombre de la actividad').fill(activityName)
    await page.getByLabel('Propósito').fill('Recibir, ordenar y responder solicitudes sintéticas de privacidad durante la prueba E2E de Kumplio.')
    await page.getByLabel('Descripción operacional').fill('El flujo comienza con una solicitud sintética, registra su contexto y termina con una respuesta revisada.')
    await page.getByLabel('Base propuesta').fill('Solicitud del titular; hipótesis pendiente de validación jurídica antes de cualquier uso distinto.')
    await page.getByLabel('Titulares').fill('Solicitantes sintéticos, Contactos internos')
    await page.getByLabel('Categorías de datos').fill('Identificación, Contacto, Contenido de la solicitud')
    await page.getByLabel('Retención').fill('Pendiente de aprobar; revisar y definir antes del siguiente ciclo mensual.')
    await page.getByLabel('Sistema o repositorio').fill('Portal Kumplio UI E2E')
    await page.getByLabel('Tipo de sistema').fill('web_application_database')
    await page.getByLabel('País o región de hosting').fill('Chile')
    await page.getByLabel('Proveedor técnico').fill('Kumplio')
    await page.getByLabel('Tercero o destinatario').fill('Proveedor sintético UI E2E')
    await page.getByLabel('Servicio del tercero').fill('Alojamiento sintético para assurance')
    await page.getByLabel('País del tercero').fill('Chile')
    await page.getByLabel('Fuente revisada').fill('Flujo visual E2E de Kumplio')
    await page.getByLabel('Referencia').fill(`GitHub Actions run ${runId}, intento ${runAttempt}`)
    await page.getByLabel('Desconocidos abiertos').fill('Base jurídica pendiente de validación, Retención pendiente de aprobación')
    await page.getByLabel('Justificación de revisión').fill('Se verificó el recorrido visual y la persistencia del alcance sintético. La revisión no acredita cumplimiento legal ni cobertura organizacional completa.')
    await page.getByLabel('Revisé esta actividad y confirmo que la evidencia solo respalda el alcance declarado.').check()
    await page.getByLabel('Entiendo que la base registrada es una propuesta pendiente de validación jurídica.').check()
    await page.getByRole('button', { name: 'Registrar y revisar', exact: true }).click()

    const activityHeading = page.getByRole('heading', { name: activityName, exact: true })
    const activity = page
      .getByRole('article')
      .filter({ has: activityHeading })
      .filter({ has: page.getByText('Parcial', { exact: true }) })
    await expect(activity).toHaveCount(1, { timeout: 90_000 })
    await expect(activity).toBeVisible()
    await expect(activity.getByText('Parcial', { exact: true })).toBeVisible()
    await expect(activity.getByText('Portal Kumplio UI E2E', { exact: true })).toBeVisible()
    await expect(activity.getByText('Proveedor sintético UI E2E', { exact: true })).toBeVisible()
    await expect(activity.getByText(/accepted · verified/i)).toBeVisible()
    await expect(activity.getByText(/SHA-256 [a-f0-9]{64}/i)).toBeVisible()
    await expect(activity.getByRole('listitem').filter({ hasText: 'Base jurídica pendiente de validación' })).toBeVisible()
    await expect(activity.getByRole('listitem').filter({ hasText: 'Retención pendiente de aprobación' })).toBeVisible()
  })

  await page.screenshot({ path: 'test-results/ui-golden-path-success.png', fullPage: true })
  await testInfo.attach('UI golden-path identity', {
    body: JSON.stringify({ email, organizationName, goal, activityName, runId, runAttempt }, null, 2),
    contentType: 'application/json',
  })
})

async function waitForReview(page, stageIndex) {
  const deadline = Date.now() + 12 * 60 * 1000
  const main = page.getByRole('main')
  while (Date.now() < deadline) {
    await page.reload({ waitUntil: 'domcontentloaded' })
    const approve = main.getByRole('button', { name: 'Aprobar y continuar', exact: true })
    if (await approve.isVisible().catch(() => false)) return

    const retry = main.getByRole('button', { name: 'Reintentar etapa', exact: true })
    if (await retry.isVisible().catch(() => false)) {
      throw new Error(`La etapa ${stageIndex + 1} llegó a estado de reintento y no produjo un resultado aprobable.`)
    }

    const exhausted = main.getByText(/Límite alcanzado:/)
    if (await exhausted.isVisible().catch(() => false)) {
      throw new Error(`La etapa ${stageIndex + 1} agotó sus intentos.`)
    }

    const recover = main.getByRole('button', { name: 'Recuperar ejecución detenida', exact: true })
    if (await recover.isVisible().catch(() => false)) await recover.click()
    await page.waitForTimeout(10_000)
  }
  throw new Error(`La etapa ${stageIndex + 1} no llegó a revisión dentro de 12 minutos.`)
}

async function waitForWorkflowCompletion(page) {
  const deadline = Date.now() + 2 * 60 * 1000
  while (Date.now() < deadline) {
    await page.reload({ waitUntil: 'domcontentloaded' })
    const progress = page.getByText('3 de 3', { exact: true })
    const close = page.getByRole('button', { name: 'Marcar como resuelto', exact: true })
    if (await progress.isVisible().catch(() => false) && await close.isVisible().catch(() => false)) return
    await page.waitForTimeout(5_000)
  }
  throw new Error('El workflow no quedó visible como 3 de 3 aprobado.')
}

function requiredEnv(name) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required environment variable: ${name}`)
  return value
}
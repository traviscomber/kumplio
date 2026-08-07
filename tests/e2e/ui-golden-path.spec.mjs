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
  await test.step('iniciar sesión con una cuenta E2E confirmada', async () => {
    await page.goto('/sign-in?next=/onboarding')
    await page.getByLabel('Correo electrónico').fill(email)
    await page.locator('input#password').fill(password)
    await page.getByRole('button', { name: 'Iniciar sesión' }).click()
    await expect(page).toHaveURL(/\/onboarding(?:\?|$)/, { timeout: 45_000 })
    await expect(page.getByRole('heading', { name: /Quiero entender tu organización/ })).toBeVisible()
  })

  await test.step('crear el workspace desde el onboarding visual', async () => {
    await page.getByPlaceholder('Nombre').fill('UI Golden Path')
    await page.getByPlaceholder('Apellido (opcional)').fill('E2E')
    await page.getByRole('button', { name: 'Continuar' }).click()

    await page.getByPlaceholder('Ej. Empresa Andes SpA').fill(organizationName)
    await page.getByRole('button', { name: 'Continuar' }).click()

    await page.getByRole('button', { name: 'Servicios generales' }).click()
    await page.getByRole('button', { name: 'Continuar' }).click()

    await page.getByRole('button', { name: '10–49 personas' }).click()
    await page.getByRole('button', { name: 'Preparar mi diagnóstico' }).click()
    await expect(page).toHaveURL(/\/cases\/[0-9a-f-]{36}(?:\?|$)/i, { timeout: 60_000 })
  })

  await test.step('abrir un expediente guiado desde la UI', async () => {
    await page.goto('/cases/new')
    await page.getByRole('button', { name: 'Empresa' }).click()
    await page.getByLabel('¿Qué necesitas proteger o resolver?').fill(goal)
    await page.getByRole('button', { name: 'Preparar mi caso' }).click()
    await expect(page).toHaveURL(/\/cases\/[0-9a-f-]{36}(?:\?|$)/i, { timeout: 90_000 })
    await expect(page.getByRole('heading', { name: goal })).toBeVisible()
  })

  for (let stageIndex = 0; stageIndex < 5; stageIndex += 1) {
    await test.step(`revisar y aprobar la etapa ${stageIndex + 1} de 5`, async () => {
      await waitForReview(page, stageIndex)
      await page.getByPlaceholder('Justifica la aprobación o explica qué debe corregirse...').fill(
        `Aprobación UI E2E de la etapa ${stageIndex + 1}: se revisaron fuentes, evidencia, reservas y límites antes de continuar.`,
      )
      await page.getByLabel('Revisé las fuentes y evidencias relacionadas.').check()
      await page.getByLabel('Entiendo los supuestos, reservas y datos que todavía faltan.').check()
      await page.getByLabel('La conclusión está suficientemente respaldada para avanzar.').check()
      await page.getByRole('button', { name: 'Aprobar y continuar' }).click()
      await expect(page.getByRole('button', { name: 'Aprobar y continuar' })).toBeHidden({ timeout: 90_000 })
    })
  }

  await test.step('crear misión y solicitud de evidencia desde el expediente', async () => {
    await waitForWorkflowCompletion(page)
    await page.getByRole('button', { name: 'Convertir en plan operativo' }).click()
    const dialog = page.getByRole('dialog', { name: 'Plan operativo del expediente' })
    await expect(dialog).toBeVisible()
    await dialog.getByRole('button', { name: 'Crear misión y solicitud' }).click()
    await expect(dialog.getByText('Plan operativo creado.')).toBeVisible({ timeout: 60_000 })
    await dialog.getByRole('button', { name: 'Cerrar' }).click()
    await expect(dialog).toBeHidden()
  })

  await test.step('cerrar la línea base con aceptación humana explícita', async () => {
    await page.reload({ waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: 'Cerrar una línea base honesta y verificable' })).toBeVisible({ timeout: 60_000 })
    await page.getByLabel(/Acepto el alcance inicial/).check()
    await page.getByLabel(/Acepto la operación parcial/).check()
    await page.getByRole('button', { name: 'Aceptar línea base y cerrar misión' }).click()
    await expect(page.getByRole('heading', { name: 'Línea base inicial cerrada.' })).toBeVisible({ timeout: 90_000 })
  })

  await test.step('registrar y revisar una actividad de tratamiento desde el formulario', async () => {
    await page.goto('/digital-twin')
    await expect(page.getByRole('heading', { name: 'Qué datos usas, para qué y dónde están.' })).toBeVisible()

    const registerButton = page.getByRole('button', { name: 'Registrar actividad' })
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
    await page.getByRole('button', { name: 'Registrar y revisar' }).click()

    await expect(page.getByText('Actividad registrada y revisada.')).toBeVisible({ timeout: 60_000 })
    await expect(page.getByRole('heading', { name: activityName })).toBeVisible()
  })

  await page.screenshot({ path: 'test-results/ui-golden-path-success.png', fullPage: true })
  await testInfo.attach('UI golden-path identity', {
    body: JSON.stringify({ email, organizationName, goal, activityName, runId, runAttempt }, null, 2),
    contentType: 'application/json',
  })
})

async function waitForReview(page, stageIndex) {
  const deadline = Date.now() + 12 * 60 * 1000
  while (Date.now() < deadline) {
    await page.reload({ waitUntil: 'domcontentloaded' })
    const approve = page.getByRole('button', { name: 'Aprobar y continuar' })
    if (await approve.isVisible().catch(() => false)) return

    const retry = page.getByRole('button', { name: 'Reintentar etapa' })
    if (await retry.isVisible().catch(() => false)) {
      throw new Error(`La etapa ${stageIndex + 1} llegó a estado de reintento y no produjo un resultado aprobable.`)
    }

    const exhausted = page.getByText(/Límite alcanzado:/)
    if (await exhausted.isVisible().catch(() => false)) {
      throw new Error(`La etapa ${stageIndex + 1} agotó sus intentos.`)
    }

    const recover = page.getByRole('button', { name: 'Recuperar ejecución detenida' })
    if (await recover.isVisible().catch(() => false)) await recover.click()
    await page.waitForTimeout(10_000)
  }
  throw new Error(`La etapa ${stageIndex + 1} no llegó a revisión dentro de 12 minutos.`)
}

async function waitForWorkflowCompletion(page) {
  const deadline = Date.now() + 2 * 60 * 1000
  while (Date.now() < deadline) {
    await page.reload({ waitUntil: 'domcontentloaded' })
    const progress = page.getByText('5 de 5', { exact: true })
    const close = page.getByRole('button', { name: 'Marcar como resuelto' })
    if (await progress.isVisible().catch(() => false) && await close.isVisible().catch(() => false)) return
    await page.waitForTimeout(5_000)
  }
  throw new Error('El workflow no quedó visible como 5 de 5 aprobado.')
}

function requiredEnv(name) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required environment variable: ${name}`)
  return value
}

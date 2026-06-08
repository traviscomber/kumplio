# Migración: Añadir organization_id a la tabla projects

## Descripción

Esta migración añade soporte para conectar proyectos directamente a organizaciones, permitiendo que usuarios con organizaciones puedan crear proyectos correctamente.

## Cambios

### 1. Tabla `projects`
- Añade columna `organization_id` (UUID)
- Crea restricción de clave externa a `organizations.id`
- Crea índice para optimizar consultas

### 2. Políticas de Seguridad (RLS)
- Reemplaza políticas basadas en `user_id` con basadas en `organization_id`
- Comprueba membresía en organización para acceso
- Mantiene la seguridad a nivel de fila

## Cómo aplicar la migración

### Opción 1: Web UI de Supabase (Recomendado)

1. Abre [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto
3. Navega a **SQL Editor** en la barra lateral izquierda
4. Haz click en **New query**
5. Abre el archivo `scripts/03-add-organization-to-projects.sql` y copia TODO su contenido
6. Pega el SQL en el editor
7. Haz click en **Run** (botón verde en la esquina inferior derecha)

### Opción 2: Línea de comandos (Requiere Supabase CLI)

```bash
# Instalar Supabase CLI si no lo tienes
npm install -g @supabase/cli

# Ejecutar la migración
supabase db push

# O si necesitas conectar primero:
supabase link --project-ref <PROJECT_ID>
supabase db push
```

### Opción 3: Script Node.js automático (Experimental)

```bash
# Nota: Esto mostrará las instrucciones
node --env-file=/vercel/share/.env.project scripts/run-migration.mjs
```

## Verificación

Después de aplicar la migración, verifica que funcione correctamente:

```sql
-- Verifica que la columna exista
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'projects' AND column_name = 'organization_id';

-- Verifica que el índice exista
SELECT indexname FROM pg_indexes 
WHERE tablename = 'projects' AND indexname = 'idx_projects_organization_id';

-- Verifica que las políticas estén creadas
SELECT policyname FROM pg_policies 
WHERE tablename = 'projects';
```

## Impacto en el código

El código en `app/projects/new/client.tsx` ya está preparado para ambos escenarios:

1. **Si la migración se aplica correctamente**: Usa `organization_id` para crear proyectos
2. **Si la migración NO se aplica**: Cae de vuelta a usar solo `user_id`

Esto significa que la aplicación seguirá funcionando incluso si la migración no se ha aplicado aún.

## Resolución de problemas

### Error: "Unauthorized"
- Asegúrate de estar usando la **Service Role Key** (no la Anon Key)
- Verifica que tienes permisos de administrador en Supabase

### Error: "Column already exists"
- La columna `organization_id` ya existe en la tabla
- Ejecuta solo las políticas RLS si es necesario

### Error: "Permission denied"
- Verifica que RLS esté habilitado en la tabla `projects`
- Confirma que tienes permisos de superusuario

## Próximos pasos

1. Aplica esta migración en Supabase
2. Los usuarios podrán crear proyectos normalmente
3. Los proyectos existentes serán accesibles para el usuario que los creó
4. Considera migrar datos antiguos si es necesario (script por venir)

## Contacto

Si encuentras problemas, por favor abre un issue en GitHub con:
- El error exacto
- Los pasos que seguiste
- Tu entorno (local/producción/staging)

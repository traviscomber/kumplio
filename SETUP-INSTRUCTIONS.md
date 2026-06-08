## SETUP DE ORGANIZATION_ID EN SUPABASE

### PASO 1: Acceder a Supabase

1. Ve a https://supabase.com/dashboard
2. Selecciona tu proyecto KUMPLIO
3. En la barra lateral izquierda, haz click en **SQL Editor**

### PASO 2: Crear Nueva Query

1. Haz click en el botón **New query**
2. Se abrirá un editor SQL en blanco

### PASO 3: Copiar el SQL

Copia TODO este SQL (de abajo):

```
-- Add organization_id to projects table
-- This connects projects to organizations instead of just users

ALTER TABLE projects ADD COLUMN IF NOT EXISTS organization_id UUID;

-- Add foreign key constraint
ALTER TABLE projects 
ADD CONSTRAINT fk_projects_organizations
FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_projects_organization_id ON projects(organization_id);

-- Update RLS policies to include organization_id filtering
DROP POLICY IF EXISTS projects_select_own ON projects;
DROP POLICY IF EXISTS projects_insert_own ON projects;
DROP POLICY IF EXISTS projects_update_own ON projects;
DROP POLICY IF EXISTS projects_delete_own ON projects;

-- New RLS policies that check organization membership
CREATE POLICY projects_select_own ON projects
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY projects_insert_own ON projects
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY projects_update_own ON projects
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY projects_delete_own ON projects
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );
```

### PASO 4: Pegar en Supabase

1. En el editor SQL de Supabase, pega el SQL que copiaste
2. Debería verse exactamente igual al código de arriba (sin etiquetas de markdown)

### PASO 5: Ejecutar

1. Haz click en el botón **RUN** (verde, esquina inferior derecha)
2. Espera a que termine (toma 2-5 segundos)
3. Verás un mensaje "Query successful" en verde

### ¡LISTO!

El setup está completo. Ahora:
- Los usuarios pueden crear proyectos correctamente
- Los proyectos se conectan a organizaciones en lugar de solo a usuarios
- Las políticas de seguridad protegen los datos por organización

### VERIFICACIÓN

Para verificar que funcionó:

1. Ve a SQL Editor
2. Crea una nueva query
3. Ejecuta este SQL:
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'projects' AND column_name = 'organization_id';
```

Si ves una fila con `organization_id`, está correcto.

### PROBLEMAS

**Si ves un error:**
- Asegúrate de que el SQL está completo (sin caracteres "#" o markdown)
- Copia directamente del archivo `SETUP-ORGANIZATION-ID.sql` en el proyecto
- No copies desde archivos de markdown

**Si necesitas ayuda:**
- Verifica que estás en el proyecto correcto en Supabase
- Asegúrate de que la tabla `projects` existe
- Verifica que la tabla `organizations` existe

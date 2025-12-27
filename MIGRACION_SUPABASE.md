# Migración a Supabase - Canvita

## 📋 Resumen

Este documento describe cómo migrar Canvita de localStorage a Supabase para persistencia en la nube.

## ✅ Archivos Creados

### 1. Schema de Base de Datos
- `supabase/schema.sql` - Schema completo de PostgreSQL con tablas, índices, RLS y funciones

### 2. Configuración de Supabase
- `src/lib/supabase.ts` - Cliente de Supabase configurado con helpers
- `src/types/database.ts` - Tipos TypeScript generados para la BD

### 3. Servicios Migrados
- `src/services/templateService.supabase.ts` - Templates con Supabase
- `src/services/projectService.supabase.ts` - Proyectos y carpetas con Supabase
- `src/services/paletteService.supabase.ts` - Paletas de colores con Supabase

### 4. Variables de Entorno
- `.env.example` - Plantilla con las variables necesarias

## 🚀 Pasos de Migración

### Paso 1: Crear Proyecto en Supabase

1. Ve a https://app.supabase.com
2. Crea una nueva organización (si no tienes)
3. Crea un nuevo proyecto:
   - Nombre: "canvita" (o el que prefieras)
   - Database Password: **Guárdala en un lugar seguro**
   - Región: Selecciona la más cercana (ej: South America)
   - Plan: Free tier está bien para empezar

4. Espera a que el proyecto se inicialice (tarda 1-2 minutos)

### Paso 2: Ejecutar el Schema SQL

1. En tu proyecto de Supabase, ve a **SQL Editor** (en el menú lateral)
2. Copia TODO el contenido de `supabase/schema.sql`
3. Pégalo en el editor SQL
4. Click en **Run** (o presiona Cmd/Ctrl + Enter)
5. Verifica que se ejecutó sin errores

### Paso 3: Obtener Credenciales

1. En tu proyecto de Supabase, ve a **Settings** > **API**
2. Copia estos dos valores:
   - **Project URL**: `https://xxxxxxxxxxxxx.supabase.co`
   - **anon public key**: Una cadena larga que empieza con `eyJ...`

### Paso 4: Configurar Variables de Entorno

1. Crea un archivo `.env` en la raíz del proyecto (copia `.env.example`)
2. Agrega las credenciales:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

3. **IMPORTANTE**: Verifica que `.env` esté en tu `.gitignore`

### Paso 5: Reemplazar Servicios

Ahora tienes dos opciones:

#### Opción A: Migración Gradual (Recomendado)
Mantener ambas versiones durante un período de prueba:

```typescript
// En App.tsx (por ejemplo)
import { TemplateService } from './services/templateService'; // localStorage
import { TemplateService as TemplateServiceSupabase } from './services/templateService.supabase';

// Usar uno u otro según feature flag
const useSupabase = import.meta.env.VITE_USE_SUPABASE === 'true';
const service = useSupabase ? TemplateServiceSupabase : TemplateService;
```

#### Opción B: Migración Completa
Reemplazar directamente los imports:

```bash
# Renombrar archivos originales como backup
mv src/services/templateService.ts src/services/templateService.old.ts
mv src/services/projectService.ts src/services/projectService.old.ts
mv src/services/paletteService.ts src/services/paletteService.old.ts

# Renombrar los nuevos
mv src/services/templateService.supabase.ts src/services/templateService.ts
mv src/services/projectService.supabase.ts src/services/projectService.ts
mv src/services/paletteService.supabase.ts src/services/paletteService.ts
```

### Paso 6: Actualizar Componentes

Los servicios ahora son **asíncronos**, así que debes actualizar los componentes:

#### Antes (localStorage):
```typescript
const templates = TemplateService.getCustomTemplates();
```

#### Después (Supabase):
```typescript
const [templates, setTemplates] = useState<CategorizedTemplate[]>([]);

useEffect(() => {
  async function loadTemplates() {
    const data = await TemplateService.getCustomTemplates();
    setTemplates(data);
  }
  loadTemplates();
}, []);
```

### Paso 7: Configurar Autenticación

Por ahora, los servicios asumen que ya tienes un usuario autenticado. Necesitarás implementar auth:

```typescript
// En App.tsx o un AuthProvider
import { supabase } from './lib/supabase';

// Sign up
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123',
});

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123',
});

// Get current user
const { data: { user } } = await supabase.auth.getUser();
```

## 📊 Schema de la Base de Datos

### Tablas

1. **users**
   - Usuarios (admins y clientes)
   - Almacena paleta de colores para clientes
   - Referencia a paleta activa para admins

2. **saved_palettes**
   - Paletas guardadas por admins
   - Relación con users

3. **templates**
   - Templates personalizados
   - Canvas JSON serializado
   - Categorización por rubro y estilo
   - Thumbnail para preview

4. **folders**
   - Carpetas para organizar proyectos
   - Relación con users

5. **projects**
   - Proyectos de usuarios
   - Canvas data y thumbnail
   - Relación con users, folders y templates

### Seguridad (Row Level Security)

Todas las tablas tienen RLS activado:
- Los usuarios solo pueden ver/editar sus propios datos
- Los templates activos son visibles para todos
- Solo admins pueden crear/editar templates

## 🔄 Migrar Datos Existentes

Si ya tienes datos en localStorage, puedes crear un script de migración:

```typescript
// scripts/migrate-to-supabase.ts
import { TemplateService as LocalService } from './services/templateService';
import { TemplateService as SupabaseService } from './services/templateService.supabase';

async function migrateTemplates() {
  const localTemplates = LocalService.getCustomTemplates();

  for (const template of localTemplates) {
    // Recrear cada template en Supabase
    // Necesitarás adaptar esto según tu estructura
  }
}
```

## 🧪 Testing

1. Verifica que el schema se creó correctamente:
   - Ve a **Table Editor** en Supabase
   - Deberías ver: users, templates, projects, folders, saved_palettes

2. Prueba crear un template desde la UI
   - Debería aparecer en la tabla `templates` en Supabase

3. Verifica que RLS funciona:
   - Intenta acceder a datos de otro usuario
   - Debería ser bloqueado automáticamente

## 🔥 Rollback

Si algo sale mal, puedes volver a localStorage:

```bash
# Restaurar archivos originales
mv src/services/templateService.old.ts src/services/templateService.ts
mv src/services/projectService.old.ts src/services/projectService.ts
mv src/services/paletteService.old.ts src/services/paletteService.ts
```

## 📝 Notas Importantes

1. **Anon Key es segura**: La anon key de Supabase es segura para usar en el frontend porque está protegida por RLS

2. **Límites del Free Tier**:
   - 500 MB de base de datos
   - 1 GB de storage
   - 2 GB de ancho de banda
   - Más que suficiente para empezar

3. **Backup**: Supabase hace backups automáticos en planes pagos

4. **Realtime**: Puedes habilitar subscripciones realtime después:
```typescript
supabase
  .from('templates')
  .on('INSERT', payload => {
    console.log('Nuevo template!', payload);
  })
  .subscribe();
```

## 🆘 Troubleshooting

### Error: "Missing Supabase environment variables"
- Verifica que `.env` existe y tiene las variables correctas
- Reinicia el servidor de desarrollo (`npm run dev`)

### Error: "Invalid API key"
- Verifica que copiaste la anon key completa
- Asegúrate de no haber copiado espacios extras

### Error: "Row Level Security policy violation"
- Verifica que el usuario está autenticado
- Revisa las políticas RLS en Supabase Dashboard

### Templates no se guardan
- Abre la consola del navegador para ver errores
- Verifica en Supabase Dashboard > Table Editor > templates
- Revisa que el usuario sea admin (para crear templates)

## 📚 Recursos

- [Documentación de Supabase](https://supabase.com/docs)
- [Supabase + React](https://supabase.com/docs/guides/getting-started/tutorials/with-react)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

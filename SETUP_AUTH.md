# 🔐 Configurar Autenticación con Supabase

## ✅ Código ya completado

El código ya está listo. Solo necesitas ejecutar los pasos en Supabase Dashboard.

## 📋 PASO A PASO

### **PASO 1: Configurar Email Auth en Supabase**

1. Ve a tu proyecto en https://app.supabase.com
2. Click en **Authentication** (ícono de llave 🔑) en el menú lateral
3. Click en **Settings** (o Configuration)
4. Busca la sección **Email Auth**:
   - ✅ Asegúrate que esté **ENABLED**
   - ⚠️ **Confirm email**: Ponlo en **OFF** (para testing rápido)
   - ⚠️ **Secure email change**: OFF
   - Click **Save**

5. En la misma página, busca **Site URL**:
   - Agregar: `http://localhost:5173`
   - En **Redirect URLs** agregar: `http://localhost:5173/**`
   - Click **Save**

---

### **PASO 2: Ejecutar el Trigger SQL**

1. Ve a **SQL Editor** en el menú lateral
2. Click en **New Query**
3. Copia TODO el contenido del archivo `supabase/auth-trigger.sql`
4. Pégalo en el editor
5. Click en **Run** (o Cmd/Ctrl + Enter)
6. Deberías ver: ✅ **Success. No rows returned**

Esto hace dos cosas:
- ✅ Crea un trigger que automáticamente crea usuarios en tu tabla cuando alguien se registra
- ✅ Desactiva RLS temporalmente para testing

---

### **PASO 3: Verificar que funciona**

1. Recarga la aplicación en el navegador (http://localhost:5173)
2. Deberías ver la pantalla de login
3. Click en **"¿No tienes cuenta? Regístrate"**
4. Registra un usuario administrador:
   - **Email**: admin@test.com
   - **Password**: admin123
   - **Nombre**: Admin Test
   - **¡IMPORTANTE!**: El código por defecto crea usuarios "client". Para crear un admin, necesitas modificar temporalmente el código.

**Para crear un admin temporalmente:**

En `src/components/AuthScreen.tsx`, busca la línea que dice:
```typescript
const success = await register(email, password, name);
```

Y cámbiala por:
```typescript
const success = await register(email, password, name, 'admin');
```

5. Después de registrarte, deberías estar logueado automáticamente

---

### **PASO 4: Verificar en Supabase**

1. Ve a **Authentication** > **Users** en Supabase
2. Deberías ver tu usuario registrado
3. Ve a **Table Editor** > **users**
4. Deberías ver el mismo usuario con sus datos

---

### **PASO 5: Probar funcionalidad**

1. **Crear un template** (como admin)
2. **Guardar un proyecto** (como client)
3. **Cerrar sesión**
4. **Iniciar sesión nuevamente**
5. Verificar que tus datos persisten

---

## 🎯 Próximos pasos (cuando esté funcionando)

### Habilitar RLS (Row Level Security)

**Solo cuando hayas probado que todo funciona**, ejecuta este SQL:

1. Ve a **SQL Editor**
2. Abre el archivo `supabase/rls-policies.sql`
3. Copia y pega todo el contenido
4. Click en **Run**

Esto habilitará seguridad real para que:
- Los usuarios solo vean sus propios datos
- Solo admins puedan crear templates
- Cada usuario tenga su espacio privado

---

## 🐛 Troubleshooting

### Error: "invalid input syntax for type uuid"
- ✅ **Solucionado**: Ya usamos Supabase Auth que genera UUIDs automáticamente

### Error: "User already exists"
- Borra el usuario en **Authentication** > **Users** > Click en el usuario > Delete
- También bórralo de **Table Editor** > **users**

### Error: "New row violates row-level security policy"
- RLS está activo demasiado pronto
- Ve al SQL Editor y ejecuta:
  ```sql
  ALTER TABLE users DISABLE ROW LEVEL SECURITY;
  ALTER TABLE templates DISABLE ROW LEVEL SECURITY;
  ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
  ALTER TABLE folders DISABLE ROW LEVEL SECURITY;
  ALTER TABLE saved_palettes DISABLE ROW LEVEL SECURITY;
  ```

### No se crea el usuario en la tabla 'users'
- Verifica que el trigger se ejecutó correctamente
- Ve a **Database** > **Functions** y busca `handle_new_user`
- Ve a **Database** > **Triggers** y busca `on_auth_user_created`

---

## 📚 Archivos relevantes

- `src/services/authService.ts` - Lógica de autenticación
- `src/contexts/AuthContext.tsx` - Context de auth con Supabase
- `supabase/auth-trigger.sql` - Trigger para crear usuarios
- `supabase/rls-policies.sql` - Políticas de seguridad (usar después)

---

## 🎉 ¡Listo!

Una vez que hayas ejecutado el trigger SQL, la aplicación debería funcionar completamente con:
- ✅ Registro de usuarios
- ✅ Login/Logout
- ✅ Persistencia en la nube
- ✅ Datos separados por usuario

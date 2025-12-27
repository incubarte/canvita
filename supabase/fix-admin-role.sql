-- ============================================================
-- SCRIPT PARA VERIFICAR Y CORREGIR ROLES DE USUARIOS
-- ============================================================

-- 1. VER TODOS LOS USUARIOS Y SUS ROLES
SELECT id, email, name, role, created_at
FROM users
ORDER BY created_at DESC;

-- 2. CAMBIAR UN USUARIO A ADMIN (Reemplaza 'tu-email@ejemplo.com' con el email del admin)
-- Descomentar y ejecutar esta línea:
-- UPDATE users SET role = 'admin' WHERE email = 'admin@test.com';

-- 3. VERIFICAR QUE SE CAMBIÓ
SELECT id, email, name, role
FROM users
WHERE role = 'admin';

-- ============================================================
-- SI NECESITAS CREAR UN ADMIN MANUALMENTE:
-- ============================================================
-- 1. Primero regístrate normalmente en la app
-- 2. Luego ejecuta este UPDATE con tu email:
--
-- UPDATE users SET role = 'admin' WHERE email = 'TU_EMAIL_AQUI';
--
-- ============================================================

-- ============================================================
-- VERIFICAR METADATA EN AUTH.USERS
-- ============================================================
-- Esto muestra los metadatos de los usuarios en la tabla de auth
SELECT
  id,
  email,
  raw_user_meta_data->>'name' as nombre_metadata,
  raw_user_meta_data->>'role' as role_metadata,
  created_at
FROM auth.users
ORDER BY created_at DESC;

-- ============================================================
-- LIMPIAR Y EMPEZAR DE NUEVO (SI ES NECESARIO)
-- ============================================================
-- ADVERTENCIA: Esto BORRA TODOS los datos!
-- Descomentar solo si quieres empezar desde cero:

-- DELETE FROM auth.users;
-- DELETE FROM users;
-- DELETE FROM templates;
-- DELETE FROM projects;
-- DELETE FROM folders;
-- DELETE FROM saved_palettes;

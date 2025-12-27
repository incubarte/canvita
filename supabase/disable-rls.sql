-- ============================================================
-- DESHABILITAR RLS TEMPORALMENTE PARA DEBUGGING
-- ============================================================
-- Este script desactiva Row Level Security en todas las tablas
-- para permitir que la aplicación funcione mientras debugueamos

-- Deshabilitar RLS en todas las tablas
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS folders DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS saved_palettes DISABLE ROW LEVEL SECURITY;

-- Eliminar todas las políticas existentes (por si tienen errores)
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Everyone can read templates" ON templates;
DROP POLICY IF EXISTS "Only admins can create templates" ON templates;
DROP POLICY IF EXISTS "Only admins can update templates" ON templates;
DROP POLICY IF EXISTS "Only admins can delete templates" ON templates;
DROP POLICY IF EXISTS "Users can read own projects" ON projects;
DROP POLICY IF EXISTS "Users can create own projects" ON projects;
DROP POLICY IF EXISTS "Users can update own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON projects;
DROP POLICY IF EXISTS "Users can read own folders" ON folders;
DROP POLICY IF EXISTS "Users can create own folders" ON folders;
DROP POLICY IF EXISTS "Users can update own folders" ON folders;
DROP POLICY IF EXISTS "Users can delete own folders" ON folders;
DROP POLICY IF EXISTS "Users can read own palettes" ON saved_palettes;
DROP POLICY IF EXISTS "Users can create own palettes" ON saved_palettes;
DROP POLICY IF EXISTS "Users can update own palettes" ON saved_palettes;
DROP POLICY IF EXISTS "Users can delete own palettes" ON saved_palettes;

-- Verificar que RLS está deshabilitado
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('users', 'templates', 'projects', 'folders', 'saved_palettes');

-- Si rowsecurity = false, entonces RLS está deshabilitado correctamente

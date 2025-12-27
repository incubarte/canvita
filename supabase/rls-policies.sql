-- ============================================================
-- RLS POLICIES CON SUPABASE AUTH
-- ============================================================
-- Este archivo contiene las políticas de seguridad correctas
-- que usan auth.uid() de Supabase Auth
--
-- EJECUTAR DESPUÉS DE PROBAR QUE TODO FUNCIONA

-- ============================================================
-- LIMPIAR POLICIES ANTIGUAS
-- ============================================================

-- Users
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;

-- Saved Palettes
DROP POLICY IF EXISTS "Users can view their own palettes" ON saved_palettes;
DROP POLICY IF EXISTS "Users can insert their own palettes" ON saved_palettes;
DROP POLICY IF EXISTS "Users can update their own palettes" ON saved_palettes;
DROP POLICY IF EXISTS "Users can delete their own palettes" ON saved_palettes;

-- Templates
DROP POLICY IF EXISTS "Everyone can view active templates" ON templates;
DROP POLICY IF EXISTS "Admins can insert templates" ON templates;
DROP POLICY IF EXISTS "Admins can update templates" ON templates;

-- Folders
DROP POLICY IF EXISTS "Users can view their own folders" ON folders;
DROP POLICY IF EXISTS "Users can insert their own folders" ON folders;
DROP POLICY IF EXISTS "Users can update their own folders" ON folders;
DROP POLICY IF EXISTS "Users can delete their own folders" ON folders;

-- Projects
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
DROP POLICY IF EXISTS "Users can insert their own projects" ON projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;

-- ============================================================
-- HABILITAR RLS
-- ============================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_palettes ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- POLICIES PARA USERS
-- ============================================================

-- Los usuarios pueden ver su propia información
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Los usuarios pueden actualizar su propia información
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- ============================================================
-- POLICIES PARA SAVED_PALETTES
-- ============================================================

CREATE POLICY "Users can view own palettes"
  ON saved_palettes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own palettes"
  ON saved_palettes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own palettes"
  ON saved_palettes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own palettes"
  ON saved_palettes FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- POLICIES PARA TEMPLATES
-- ============================================================

-- Todos pueden ver templates activos
CREATE POLICY "Anyone can view active templates"
  ON templates FOR SELECT
  USING (is_active = TRUE);

-- Solo admins pueden crear templates
CREATE POLICY "Admins can create templates"
  ON templates FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Solo admins pueden actualizar templates
CREATE POLICY "Admins can update templates"
  ON templates FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Solo admins pueden eliminar templates
CREATE POLICY "Admins can delete templates"
  ON templates FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- POLICIES PARA FOLDERS
-- ============================================================

CREATE POLICY "Users can view own folders"
  ON folders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own folders"
  ON folders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own folders"
  ON folders FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own folders"
  ON folders FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- POLICIES PARA PROJECTS
-- ============================================================

CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- GRANT PERMISSIONS
-- ============================================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON users TO authenticated;
GRANT ALL ON saved_palettes TO authenticated;
GRANT ALL ON templates TO authenticated;
GRANT ALL ON folders TO authenticated;
GRANT ALL ON projects TO authenticated;

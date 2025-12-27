-- Canvita Database Schema for Supabase
-- Este archivo contiene el schema completo de la base de datos

-- ============================================================
-- TABLA: users
-- Almacena la información de usuarios (admins y clientes)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'client')),
  color_palette JSONB, -- Para clientes: {principal1, principal2, secundario1, secundario2, secundario3}
  active_palette_id UUID, -- Para admins: referencia a saved_palettes
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: saved_palettes
-- Paletas guardadas por admins
-- ============================================================
CREATE TABLE IF NOT EXISTS saved_palettes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  palette JSONB NOT NULL, -- {principal1, principal2, secundario1, secundario2, secundario3}
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: templates
-- Templates personalizados creados por admins
-- ============================================================
CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  thumbnail TEXT, -- Data URL de la imagen

  -- Canvas configuration
  canvas_width INTEGER NOT NULL,
  canvas_height INTEGER NOT NULL,
  canvas_background_color TEXT NOT NULL DEFAULT '#ffffff',

  -- Canvas JSON (objetos de Fabric.js serializados)
  canvas_json JSONB NOT NULL,

  -- Categorización
  category TEXT NOT NULL DEFAULT 'instagram-post', -- Legacy
  business_category TEXT NOT NULL CHECK (business_category IN ('inmobiliaria', 'comida', 'ropa', 'generico')),
  style TEXT NOT NULL CHECK (style IN ('post', 'historia', 'imagen')),

  -- Metadata
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  demo_theme JSONB, -- Paleta de colores de demostración

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: folders
-- Carpetas para organizar proyectos
-- ============================================================
CREATE TABLE IF NOT EXISTS folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: projects
-- Proyectos de usuarios (diseños basados en templates)
-- ============================================================
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
  template_id UUID REFERENCES templates(id) ON DELETE SET NULL,

  name TEXT NOT NULL,
  canvas_data TEXT NOT NULL, -- JSON serializado del canvas de Fabric.js
  thumbnail TEXT, -- Data URL de la preview

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ÍNDICES para mejorar performance
-- ============================================================

-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Templates
CREATE INDEX idx_templates_business_category ON templates(business_category);
CREATE INDEX idx_templates_style ON templates(style);
CREATE INDEX idx_templates_is_active ON templates(is_active);
CREATE INDEX idx_templates_created_by ON templates(created_by);

-- Projects
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_folder_id ON projects(folder_id);
CREATE INDEX idx_projects_template_id ON projects(template_id);

-- Folders
CREATE INDEX idx_folders_user_id ON folders(user_id);

-- Saved Palettes
CREATE INDEX idx_saved_palettes_user_id ON saved_palettes(user_id);

-- ============================================================
-- TRIGGERS para updated_at automático
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_palettes ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Políticas para USERS
-- Los usuarios solo pueden ver y editar su propia información
CREATE POLICY "Users can view their own data"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own data"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Políticas para SAVED_PALETTES
-- Los usuarios solo pueden ver y gestionar sus propias paletas
CREATE POLICY "Users can view their own palettes"
  ON saved_palettes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own palettes"
  ON saved_palettes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own palettes"
  ON saved_palettes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own palettes"
  ON saved_palettes FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas para TEMPLATES
-- Todos pueden ver templates activos, solo admins pueden crear/editar
CREATE POLICY "Everyone can view active templates"
  ON templates FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Admins can insert templates"
  ON templates FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update templates"
  ON templates FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Políticas para FOLDERS
-- Los usuarios solo pueden ver y gestionar sus propias carpetas
CREATE POLICY "Users can view their own folders"
  ON folders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own folders"
  ON folders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own folders"
  ON folders FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own folders"
  ON folders FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas para PROJECTS
-- Los usuarios solo pueden ver y gestionar sus propios proyectos
CREATE POLICY "Users can view their own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
  ON projects FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- FUNCIONES ÚTILES
-- ============================================================

-- Función para verificar si un usuario es admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener templates filtrados
CREATE OR REPLACE FUNCTION get_templates_by_category(
  p_business_category TEXT,
  p_style TEXT DEFAULT NULL
)
RETURNS SETOF templates AS $$
BEGIN
  IF p_style IS NULL THEN
    RETURN QUERY
    SELECT * FROM templates
    WHERE business_category = p_business_category
      AND is_active = TRUE
    ORDER BY created_at DESC;
  ELSE
    RETURN QUERY
    SELECT * FROM templates
    WHERE business_category = p_business_category
      AND style = p_style
      AND is_active = TRUE
    ORDER BY created_at DESC;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

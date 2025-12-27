-- ============================================================
-- TRIGGER: Crear usuario en tabla 'users' al registrarse
-- ============================================================
-- Este trigger se ejecuta automáticamente cuando un usuario
-- se registra en Supabase Auth y crea el registro correspondiente
-- en nuestra tabla 'users'

-- Función que se ejecutará en el trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Usuario'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'client'),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear el trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- DESACTIVAR RLS TEMPORALMENTE PARA TESTING
-- ============================================================
-- IMPORTANTE: Esto es solo para desarrollo!
-- En producción deberías usar las policies correctas

-- Desactivar RLS en todas las tablas (SOLO PARA TESTING)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE saved_palettes DISABLE ROW LEVEL SECURITY;
ALTER TABLE templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE folders DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- NOTA PARA MÁS ADELANTE:
-- ============================================================
-- Cuando estés listo para producción, ejecuta el archivo
-- supabase/rls-policies.sql para habilitar RLS correctamente
-- con policies que usen auth.uid()

-- ============================================================
-- SCRIPT COMPLETO PARA LIMPIAR PERMISOS Y RLS
-- ============================================================

-- 1. DESHABILITAR RLS
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS saved_palettes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS folders DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS projects DISABLE ROW LEVEL SECURITY;

-- 2. ELIMINAR TODAS LAS POLICIES
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I',
            r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- 3. REVOCAR TODOS LOS GRANTS PROBLEMÁTICOS
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM admin;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM admin;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM admin;
REVOKE ALL ON SCHEMA public FROM admin;

-- 4. DAR PERMISOS CORRECTOS (solo a authenticated y anon)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- 5. VERIFICAR EL ESTADO
SELECT
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 6. VERIFICAR QUE NO HAY POLICIES ACTIVAS
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE schemaname = 'public';

-- 7. PROBAR UNA QUERY SIMPLE
-- Si esto falla, hay un problema más profundo
SELECT id, email, role FROM users LIMIT 1;

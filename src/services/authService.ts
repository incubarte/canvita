import { supabase } from '../lib/supabase';
import type { User, UserRole } from '../types/user';

export class AuthService {
  // Registrar nuevo usuario
  static async signUp(email: string, password: string, name: string, role: UserRole = 'client') {
    try {
      // 1. Crear usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role,
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('No se pudo crear el usuario');

      console.log('✅ Usuario creado en Auth:', authData.user.id);

      // 2. El trigger automáticamente creará el registro en la tabla users
      // Esperar un momento para que el trigger se ejecute
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 3. Obtener el usuario completo de la tabla users
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (userError) {
        console.error('Error obteniendo usuario de la tabla:', userError);
        throw userError;
      }

      return this.mapDbToUser(userData);
    } catch (error: any) {
      console.error('Error en signUp:', error);
      throw new Error(error.message || 'Error al registrarse');
    }
  }

  // Iniciar sesión
  static async signIn(email: string, password: string): Promise<User> {
    try {
      console.log('🔐 [AuthService] Starting signIn for:', email);

      console.log('🔐 [AuthService] Calling supabase.auth.signInWithPassword...');
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      console.log('✅ [AuthService] signInWithPassword completed');

      if (authError) {
        console.error('❌ [AuthService] Auth error:', authError);
        throw authError;
      }
      if (!authData.user) {
        console.error('❌ [AuthService] No user data returned');
        throw new Error('No se pudo iniciar sesión');
      }

      console.log('👤 [AuthService] User authenticated:', authData.user.id, authData.user.email);

      // Obtener datos completos del usuario
      console.log('📊 [AuthService] Fetching user data from database...');
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      console.log('✅ [AuthService] Database query completed');

      if (userError) {
        console.error('❌ [AuthService] User data error:', userError);
        throw userError;
      }

      if (!userData) {
        console.error('❌ [AuthService] No user data found in database');
        throw new Error('Usuario no encontrado en la base de datos');
      }

      console.log('✅ [AuthService] User data retrieved:', userData);
      const mappedUser = this.mapDbToUser(userData);
      console.log('✅ [AuthService] User mapped:', mappedUser);

      return mappedUser;
    } catch (error: any) {
      console.error('💥 [AuthService] Error en signIn:', error);
      throw new Error(error.message || 'Error al iniciar sesión');
    }
  }

  // Cerrar sesión
  static async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  // Obtener usuario actual
  static async getCurrentUser(): Promise<User | null> {
    try {
      console.log('🔍 [getCurrentUser] Starting...');

      console.log('🔍 [getCurrentUser] Getting session (instead of getUser)...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error('❌ [getCurrentUser] Session error:', sessionError);
        return null;
      }
      if (!session?.user) {
        console.log('⚠️ [getCurrentUser] No session or user found');
        return null;
      }

      const authUser = session.user;
      console.log('✅ [getCurrentUser] Session user found:', authUser.id);
      console.log('📊 [getCurrentUser] Querying database for user data...');

      // Timeout para la query
      const queryPromise = supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Database query timeout after 5s')), 5000)
      );

      const { data: userData, error: userError } = await Promise.race([
        queryPromise,
        timeoutPromise
      ]) as any;

      console.log('✅ [getCurrentUser] Query completed');

      if (userError) {
        console.error('❌ [getCurrentUser] Database error:', userError);
        return null;
      }

      if (!userData) {
        console.error('❌ [getCurrentUser] No user data in database');
        return null;
      }

      console.log('✅ [getCurrentUser] User data retrieved:', userData);
      return this.mapDbToUser(userData);
    } catch (error: any) {
      console.error('💥 [getCurrentUser] Error:', error.message);
      return null;
    }
  }

  // Actualizar usuario
  static async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    const dbUpdates: any = {};

    if (updates.name) dbUpdates.name = updates.name;
    if (updates.email) dbUpdates.email = updates.email;
    if (updates.colorPalette) dbUpdates.color_palette = updates.colorPalette;
    if (updates.activePaletteId) dbUpdates.active_palette_id = updates.activePaletteId;

    const { data, error } = await supabase
      .from('users')
      .update(dbUpdates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    return this.mapDbToUser(data);
  }

  // Mapear datos de DB a User
  private static mapDbToUser(dbRow: any): User {
    return {
      id: dbRow.id,
      email: dbRow.email,
      name: dbRow.name,
      role: dbRow.role,
      createdAt: dbRow.created_at,
      colorPalette: dbRow.color_palette,
      activePaletteId: dbRow.active_palette_id,
    };
  }
}

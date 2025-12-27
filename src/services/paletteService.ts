import type { User, SavedPalette, ColorPalette } from '../types/user';
import { supabase, handleSupabaseError } from '../lib/supabase';

export class PaletteService {
  // Paletas predeterminadas para admins
  static getDefaultPalettes(): SavedPalette[] {
    return [
      {
        id: 'default-vibrant',
        name: 'Vibrante',
        createdAt: new Date().toISOString(),
        palette: {
          principal1: '#667eea',
          principal2: '#764ba2',
          secundario1: '#f093fb',
          secundario2: '#4facfe',
          secundario3: '#43e97b',
        }
      },
      {
        id: 'default-food',
        name: 'Comida',
        createdAt: new Date().toISOString(),
        palette: {
          principal1: '#FF6B35',
          principal2: '#004E89',
          secundario1: '#F7931E',
          secundario2: '#C1121F',
          secundario3: '#FFFFFF',
        }
      },
      {
        id: 'default-real-estate',
        name: 'Inmobiliaria',
        createdAt: new Date().toISOString(),
        palette: {
          principal1: '#2C3E50',
          principal2: '#3498DB',
          secundario1: '#E74C3C',
          secundario2: '#F39C12',
          secundario3: '#ECF0F1',
        }
      },
      {
        id: 'default-fashion',
        name: 'Moda',
        createdAt: new Date().toISOString(),
        palette: {
          principal1: '#000000',
          principal2: '#C4A77D',
          secundario1: '#8B7355',
          secundario2: '#D4AF37',
          secundario3: '#FFFFFF',
        }
      }
    ];
  }

  // Obtener las paletas del usuario admin desde Supabase
  static async getUserPalettes(userId: string): Promise<SavedPalette[]> {
    try {
      const { data, error } = await supabase
        .from('saved_palettes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Si no tiene paletas guardadas, retornar las predeterminadas
      if (!data || data.length === 0) {
        return this.getDefaultPalettes();
      }

      return data.map(this.mapDbToPalette);
    } catch (error) {
      console.error('Error getting user palettes:', error);
      return this.getDefaultPalettes();
    }
  }

  // Obtener la paleta activa del usuario
  static async getActivePalette(user: User): Promise<ColorPalette | null> {
    try {
      if (user.role !== 'admin') {
        // Para clientes, usar la paleta del usuario
        return user.colorPalette || null;
      }

      // Para admins, obtener paletas guardadas
      const palettes = await this.getUserPalettes(user.id);

      if (!palettes || palettes.length === 0) {
        return null;
      }

      // Si tiene una paleta activa seleccionada, buscarla
      if (user.activePaletteId) {
        const active = palettes.find(p => p.id === user.activePaletteId);
        if (active) {
          return active.palette;
        }
      }

      // Si no, retornar la primera
      return palettes[0].palette;
    } catch (error) {
      console.error('Error getting active palette:', error);
      return null;
    }
  }

  // Guardar una nueva paleta (sobrecarga para mantener compatibilidad)
  static async savePalette(userOrId: User | string, name: string, palette: ColorPalette): Promise<SavedPalette> {
    const userId = typeof userOrId === 'string' ? userOrId : userOrId.id;
    try {
      const { data, error } = await supabase
        .from('saved_palettes')
        .insert({
          user_id: userId,
          name,
          palette,
        })
        .select()
        .single();

      if (error) throw error;

      return this.mapDbToPalette(data);
    } catch (error) {
      handleSupabaseError(error, 'savePalette');
    }
  }

  // Eliminar una paleta (compatible con firma anterior que recibía User)
  static async deletePalette(userOrPaletteId: User | string, paletteId?: string): Promise<void> {
    // Si se pasó User y paletteId por separado (firma legacy)
    const actualPaletteId = paletteId || (typeof userOrPaletteId === 'string' ? userOrPaletteId : '');
    try {
      const { error } = await supabase
        .from('saved_palettes')
        .delete()
        .eq('id', actualPaletteId);

      if (error) throw error;
    } catch (error) {
      handleSupabaseError(error, 'deletePalette');
    }
  }

  // Actualizar una paleta existente (compatible con firma anterior)
  static async updatePalette(userOrPaletteId: User | string, updatesOrPaletteId: Partial<SavedPalette> | string, legacyUpdates?: Partial<SavedPalette>): Promise<SavedPalette> {
    // Determinar parámetros reales
    let paletteId: string;
    let updates: Partial<SavedPalette>;

    if (typeof userOrPaletteId === 'string' && typeof updatesOrPaletteId === 'object') {
      // Firma nueva: (paletteId, updates)
      paletteId = userOrPaletteId;
      updates = updatesOrPaletteId;
    } else {
      // Firma legacy: (user, paletteId, updates)
      paletteId = updatesOrPaletteId as string;
      updates = legacyUpdates!;
    }
    try {
      const dbUpdates: any = {};
      if (updates.name) dbUpdates.name = updates.name;
      if (updates.palette) dbUpdates.palette = updates.palette;

      const { data, error } = await supabase
        .from('saved_palettes')
        .update(dbUpdates)
        .eq('id', paletteId)
        .select()
        .single();

      if (error) throw error;

      return this.mapDbToPalette(data);
    } catch (error) {
      handleSupabaseError(error, 'updatePalette');
    }
  }

  // Actualizar la paleta de un usuario cliente
  static async updateUserPalette(userId: string, palette: ColorPalette): Promise<void> {
    try {
      const { error } = await supabase
        .from('users')
        .update({ color_palette: palette })
        .eq('id', userId);

      if (error) throw error;
    } catch (error) {
      handleSupabaseError(error, 'updateUserPalette');
    }
  }

  // Actualizar la paleta activa de un admin
  static async setActivePalette(userId: string, paletteId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('users')
        .update({ active_palette_id: paletteId })
        .eq('id', userId);

      if (error) throw error;
    } catch (error) {
      handleSupabaseError(error, 'setActivePalette');
    }
  }

  // ============================================================
  // MAPPER
  // ============================================================

  private static mapDbToPalette(dbRow: any): SavedPalette {
    return {
      id: dbRow.id,
      name: dbRow.name,
      palette: dbRow.palette as ColorPalette,
      createdAt: dbRow.created_at,
    };
  }
}

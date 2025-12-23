import type { User, SavedPalette, ColorPalette } from '../types/user';

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

  // Obtener las paletas del usuario admin
  static getUserPalettes(user: User): SavedPalette[] {
    if (user.role !== 'admin') {
      return [];
    }

    // Si no tiene paletas guardadas, retornar las predeterminadas
    if (!user.savedPalettes || user.savedPalettes.length === 0) {
      return this.getDefaultPalettes();
    }

    return user.savedPalettes;
  }

  // Obtener la paleta activa del admin
  static getActivePalette(user: User): ColorPalette | null {
    if (user.role !== 'admin') {
      return user.colorPalette || null;
    }

    const palettes = this.getUserPalettes(user);

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
  }

  // Guardar una nueva paleta
  static savePalette(user: User, name: string, palette: ColorPalette): SavedPalette[] {
    const palettes = this.getUserPalettes(user);

    const newPalette: SavedPalette = {
      id: `palette-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      palette,
      createdAt: new Date().toISOString(),
    };

    return [...palettes, newPalette];
  }

  // Eliminar una paleta
  static deletePalette(user: User, paletteId: string): SavedPalette[] {
    const palettes = this.getUserPalettes(user);
    return palettes.filter(p => p.id !== paletteId);
  }

  // Actualizar una paleta existente
  static updatePalette(user: User, paletteId: string, updates: Partial<SavedPalette>): SavedPalette[] {
    const palettes = this.getUserPalettes(user);
    return palettes.map(p =>
      p.id === paletteId ? { ...p, ...updates } : p
    );
  }
}

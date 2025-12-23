export type UserRole = 'admin' | 'client';

export type ColorVariableName = 'principal1' | 'principal2' | 'secundario1' | 'secundario2' | 'secundario3';

export interface ColorPalette {
  principal1: string;
  principal2: string;
  secundario1: string;
  secundario2: string;
  secundario3: string;
}

export interface SavedPalette {
  id: string;
  name: string;
  palette: ColorPalette;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
  colorPalette?: ColorPalette; // Para clientes: su paleta única
  savedPalettes?: SavedPalette[]; // Para admins: múltiples paletas guardadas
  activePaletteId?: string; // Para admins: ID de la paleta activa
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  folderId: string | null;
  templateId: string;
  canvasData: string; // JSON serializado del canvas
  thumbnail: string; // Data URL de la preview
  createdAt: string;
  updatedAt: string;
}

export interface Folder {
  id: string;
  userId: string;
  name: string;
  color?: string;
  createdAt: string;
}

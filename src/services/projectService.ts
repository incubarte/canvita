import type { Project, Folder } from '../types/user';
import { Canvas } from 'fabric';
import { supabase, handleSupabaseError } from '../lib/supabase';

export class ProjectService {
  // ============================================================
  // PROYECTOS
  // ============================================================

  // Obtener proyectos del usuario
  static async getProjects(userId: string): Promise<Project[]> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(this.mapDbToProject);
    } catch (error) {
      handleSupabaseError(error, 'getProjects');
    }
  }

  // Obtener un proyecto específico
  static async getProject(projectId: string): Promise<Project | null> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error) throw error;

      return data ? this.mapDbToProject(data) : null;
    } catch (error) {
      console.error('Error getting project:', error);
      return null;
    }
  }

  // Guardar proyecto (crear o actualizar)
  static async saveProject(
    userId: string,
    name: string,
    templateId: string,
    canvas: Canvas,
    folderId: string | null = null,
    existingProjectId?: string
  ): Promise<Project> {
    try {
      const canvasData = JSON.stringify(canvas.toJSON());
      const thumbnail = canvas.toDataURL({ format: 'png', quality: 0.5, multiplier: 0.2 });

      if (existingProjectId) {
        // Actualizar proyecto existente
        const { data, error } = await supabase
          .from('projects')
          .update({
            name,
            folder_id: folderId,
            canvas_data: canvasData,
            thumbnail,
          })
          .eq('id', existingProjectId)
          .select()
          .single();

        if (error) throw error;

        return this.mapDbToProject(data);
      } else {
        // Crear nuevo proyecto
        const { data, error } = await supabase
          .from('projects')
          .insert({
            user_id: userId,
            name,
            folder_id: folderId,
            template_id: templateId,
            canvas_data: canvasData,
            thumbnail,
          })
          .select()
          .single();

        if (error) throw error;

        return this.mapDbToProject(data);
      }
    } catch (error) {
      handleSupabaseError(error, 'saveProject');
    }
  }

  // Eliminar proyecto
  static async deleteProject(projectId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;
    } catch (error) {
      handleSupabaseError(error, 'deleteProject');
    }
  }

  // Duplicar proyecto
  static async duplicateProject(projectId: string): Promise<Project | null> {
    try {
      const original = await this.getProject(projectId);
      if (!original) return null;

      const { data, error } = await supabase
        .from('projects')
        .insert({
          user_id: original.userId,
          name: `${original.name} (copia)`,
          folder_id: original.folderId,
          template_id: original.templateId,
          canvas_data: original.canvasData,
          thumbnail: original.thumbnail,
        })
        .select()
        .single();

      if (error) throw error;

      return this.mapDbToProject(data);
    } catch (error) {
      console.error('Error duplicating project:', error);
      return null;
    }
  }

  // ============================================================
  // CARPETAS
  // ============================================================

  // Obtener carpetas del usuario
  static async getFolders(userId: string): Promise<Folder[]> {
    try {
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(this.mapDbToFolder);
    } catch (error) {
      handleSupabaseError(error, 'getFolders');
    }
  }

  // Crear carpeta
  static async createFolder(userId: string, name: string, color?: string): Promise<Folder> {
    try {
      const { data, error } = await supabase
        .from('folders')
        .insert({
          user_id: userId,
          name,
          color,
        })
        .select()
        .single();

      if (error) throw error;

      return this.mapDbToFolder(data);
    } catch (error) {
      handleSupabaseError(error, 'createFolder');
    }
  }

  // Actualizar carpeta
  static async updateFolder(folderId: string, updates: Partial<Folder>): Promise<void> {
    try {
      const dbUpdates: any = {};
      if (updates.name) dbUpdates.name = updates.name;
      if (updates.color !== undefined) dbUpdates.color = updates.color;

      const { error } = await supabase
        .from('folders')
        .update(dbUpdates)
        .eq('id', folderId);

      if (error) throw error;
    } catch (error) {
      handleSupabaseError(error, 'updateFolder');
    }
  }

  // Eliminar carpeta
  static async deleteFolder(folderId: string): Promise<void> {
    try {
      // Los proyectos se actualizarán automáticamente a NULL por la FK con ON DELETE SET NULL
      // Pero lo hacemos explícito para mayor control
      await supabase
        .from('projects')
        .update({ folder_id: null })
        .eq('folder_id', folderId);

      const { error } = await supabase
        .from('folders')
        .delete()
        .eq('id', folderId);

      if (error) throw error;
    } catch (error) {
      handleSupabaseError(error, 'deleteFolder');
    }
  }

  // ============================================================
  // MAPPERS
  // ============================================================

  private static mapDbToProject(dbRow: any): Project {
    return {
      id: dbRow.id,
      userId: dbRow.user_id,
      name: dbRow.name,
      folderId: dbRow.folder_id,
      templateId: dbRow.template_id,
      canvasData: dbRow.canvas_data,
      thumbnail: dbRow.thumbnail,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at,
    };
  }

  private static mapDbToFolder(dbRow: any): Folder {
    return {
      id: dbRow.id,
      userId: dbRow.user_id,
      name: dbRow.name,
      color: dbRow.color,
      createdAt: dbRow.created_at,
    };
  }
}

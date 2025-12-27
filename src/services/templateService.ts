import { Canvas } from 'fabric';
import type { CategorizedTemplate, BusinessCategory, TemplateStyle } from '../types/template';
import type { ColorPalette } from '../types/user';
import { supabase, handleSupabaseError } from '../lib/supabase';

export class TemplateService {
  // Obtener todos los templates personalizados
  static async getCustomTemplates(): Promise<CategorizedTemplate[]> {
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(this.mapDbToTemplate);
    } catch (error) {
      handleSupabaseError(error, 'getCustomTemplates');
    }
  }

  // Obtener templates filtrados por rubro y estilo
  static async getTemplatesByCategory(
    businessCategory: BusinessCategory,
    style: TemplateStyle
  ): Promise<CategorizedTemplate[]> {
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('business_category', businessCategory)
        .eq('style', style)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(this.mapDbToTemplate);
    } catch (error) {
      handleSupabaseError(error, 'getTemplatesByCategory');
    }
  }

  // Obtener templates por rubro (todos los estilos)
  static async getTemplatesByBusinessCategory(
    businessCategory: BusinessCategory
  ): Promise<CategorizedTemplate[]> {
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('business_category', businessCategory)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(this.mapDbToTemplate);
    } catch (error) {
      handleSupabaseError(error, 'getTemplatesByBusinessCategory');
    }
  }

  // Guardar un nuevo template (solo admins)
  static async saveTemplate(
    userId: string,
    name: string,
    description: string,
    businessCategory: BusinessCategory,
    style: TemplateStyle,
    canvas: Canvas,
    demoTheme: ColorPalette,
    baseTemplateId?: string
  ): Promise<CategorizedTemplate> {
    try {
      // El canvas está escalado a 0.35, necesitamos el tamaño real
      const SCALE = 0.35;
      const realWidth = Math.round((canvas.width || 1080) / SCALE);
      const realHeight = Math.round((canvas.height || 1080) / SCALE);

      // Generar thumbnail del canvas
      const thumbnail = canvas.toDataURL({
        format: 'jpeg',
        quality: 0.5,
        multiplier: 0.5 / SCALE,
      });

      // Serializar canvas
      // @ts-expect-error - Fabric.js toJSON typing issue
      const canvasJson = canvas.toJSON(['data', 'id', 'selectable', 'evented', 'editable']);

      // Agregar propiedades personalizadas a cada objeto
      const canvasObjects = canvas.getObjects();
      if (canvasJson.objects) {
        canvasJson.objects.forEach((jsonObj: any, index: number) => {
          const fabricObj = canvasObjects[index];
          const colorVariable = (fabricObj as any).colorVariable;
          const editable = (fabricObj as any).editable;
          const isCustomizable = (fabricObj as any).isCustomizable;
          const customizableName = (fabricObj as any).customizableName;
          const allowedProperties = (fabricObj as any).allowedProperties;

          if (colorVariable) {
            jsonObj.colorVariable = colorVariable;
          }
          jsonObj.editable = editable !== undefined ? editable : true;
          jsonObj.isCustomizable = isCustomizable || false;
          jsonObj.customizableName = customizableName || '';
          jsonObj.allowedProperties = allowedProperties || [];
        });
      }

      // Log para debug
      console.log('📝 Template guardado con objetos:');
      if (canvasJson.objects) {
        canvasJson.objects.forEach((obj: any, index: number) => {
          console.log(`  Objeto ${index} (${obj.type}):`, {
            fill: obj.fill,
            colorVariable: obj.colorVariable,
            editable: obj.editable,
            isCustomizable: obj.isCustomizable,
            customizableName: obj.customizableName,
            allowedProperties: obj.allowedProperties
          });
        });
      }

      // Insertar en Supabase
      const { data, error } = await supabase
        .from('templates')
        .insert({
          name,
          description,
          thumbnail,
          canvas_width: realWidth,
          canvas_height: realHeight,
          canvas_background_color: canvas.backgroundColor as string || '#ffffff',
          canvas_json: canvasJson,
          category: 'instagram-post', // Legacy
          business_category: businessCategory,
          style,
          is_active: true,
          created_by: userId,
          demo_theme: demoTheme,
        })
        .select()
        .single();

      if (error) throw error;

      return this.mapDbToTemplate(data);
    } catch (error) {
      handleSupabaseError(error, 'saveTemplate');
    }
  }

  // Actualizar un template existente
  static async updateTemplate(
    templateId: string,
    updates: Partial<CategorizedTemplate>
  ): Promise<CategorizedTemplate | null> {
    try {
      const dbUpdates: any = {};

      if (updates.name) dbUpdates.name = updates.name;
      if (updates.description) dbUpdates.description = updates.description;
      if (updates.thumbnail) dbUpdates.thumbnail = updates.thumbnail;
      if (updates.businessCategory) dbUpdates.business_category = updates.businessCategory;
      if (updates.style) dbUpdates.style = updates.style;
      if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
      if (updates.demoTheme) dbUpdates.demo_theme = updates.demoTheme;

      const { data, error } = await supabase
        .from('templates')
        .update(dbUpdates)
        .eq('id', templateId)
        .select()
        .single();

      if (error) throw error;

      return data ? this.mapDbToTemplate(data) : null;
    } catch (error) {
      console.error('Error updating template:', error);
      return null;
    }
  }

  // Eliminar/desactivar un template
  static async deactivateTemplate(templateId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('templates')
        .update({ is_active: false })
        .eq('id', templateId);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error deactivating template:', error);
      return false;
    }
  }

  // Obtener un template específico
  static async getTemplateById(templateId: string): Promise<CategorizedTemplate | null> {
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (error) throw error;

      return data ? this.mapDbToTemplate(data) : null;
    } catch (error) {
      console.error('Error getting template by ID:', error);
      return null;
    }
  }

  // Obtener los datos del canvas de un template
  static async getTemplateCanvasData(templateId: string): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('canvas_json')
        .eq('id', templateId)
        .single();

      if (error) throw error;

      return data?.canvas_json || null;
    } catch (error) {
      console.error('Error getting template canvas data:', error);
      return null;
    }
  }

  // Eliminar templates por categoría de negocio
  static async deleteTemplatesByBusinessCategory(
    businessCategory: BusinessCategory
  ): Promise<number> {
    try {
      const { data: templates, error: selectError } = await supabase
        .from('templates')
        .select('id')
        .eq('business_category', businessCategory);

      if (selectError) throw selectError;

      const count = templates?.length || 0;

      if (count > 0) {
        const { error: deleteError } = await supabase
          .from('templates')
          .delete()
          .eq('business_category', businessCategory);

        if (deleteError) throw deleteError;
      }

      console.log(`🗑️ Eliminados ${count} templates de la categoría "${businessCategory}"`);
      return count;
    } catch (error) {
      console.error('Error deleting templates by business category:', error);
      return 0;
    }
  }

  // Eliminar todos los templates personalizados
  static async deleteAllCustomTemplates(): Promise<number> {
    try {
      const { data: templates, error: selectError } = await supabase
        .from('templates')
        .select('id');

      if (selectError) throw selectError;

      const count = templates?.length || 0;

      if (count > 0) {
        const { error: deleteError } = await supabase
          .from('templates')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

        if (deleteError) throw deleteError;
      }

      console.log(`🗑️ Eliminados ${count} templates personalizados`);
      return count;
    } catch (error) {
      console.error('Error deleting all custom templates:', error);
      return 0;
    }
  }

  // Helper: Mapear datos de DB a CategorizedTemplate
  private static mapDbToTemplate(dbRow: any): CategorizedTemplate {
    return {
      id: dbRow.id,
      name: dbRow.name,
      description: dbRow.description || '',
      thumbnail: dbRow.thumbnail,
      canvas: {
        width: dbRow.canvas_width,
        height: dbRow.canvas_height,
        backgroundColor: dbRow.canvas_background_color,
      },
      elements: [], // Los elementos están en canvas_json
      category: dbRow.category,
      businessCategory: dbRow.business_category,
      style: dbRow.style,
      isActive: dbRow.is_active,
      createdBy: dbRow.created_by,
      createdAt: dbRow.created_at,
      demoTheme: dbRow.demo_theme,
      // Agregar canvas_json como propiedad extra
      canvasJson: dbRow.canvas_json,
    } as CategorizedTemplate & { canvasJson: any };
  }
}

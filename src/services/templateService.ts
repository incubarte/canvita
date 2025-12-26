import { Canvas } from 'fabric';
import type { CategorizedTemplate, BusinessCategory, TemplateStyle } from '../types/template';
import type { ColorPalette } from '../types/user';

const TEMPLATES_STORAGE_KEY = 'canvita_custom_templates';

export class TemplateService {
  // Obtener todos los templates personalizados
  static getCustomTemplates(): CategorizedTemplate[] {
    const stored = localStorage.getItem(TEMPLATES_STORAGE_KEY);
    if (!stored) return [];

    try {
      return JSON.parse(stored);
    } catch (error) {
      console.error('Error parsing custom templates:', error);
      return [];
    }
  }

  // Obtener templates filtrados por rubro y estilo
  static getTemplatesByCategory(
    businessCategory: BusinessCategory,
    style: TemplateStyle
  ): CategorizedTemplate[] {
    const templates = this.getCustomTemplates();
    return templates.filter(
      t => t.businessCategory === businessCategory &&
           t.style === style &&
           t.isActive !== false
    );
  }

  // Obtener templates por rubro (todos los estilos)
  static getTemplatesByBusinessCategory(businessCategory: BusinessCategory): CategorizedTemplate[] {
    const templates = this.getCustomTemplates();
    return templates.filter(
      t => t.businessCategory === businessCategory && t.isActive !== false
    );
  }

  // Guardar un nuevo template (solo admins)
  static saveTemplate(
    userId: string,
    name: string,
    description: string,
    businessCategory: BusinessCategory,
    style: TemplateStyle,
    canvas: Canvas,
    demoTheme: ColorPalette,
    baseTemplateId?: string
  ): CategorizedTemplate {
    const templates = this.getCustomTemplates();

    // El canvas está escalado a 0.35, necesitamos el tamaño real
    const SCALE = 0.35;
    const realWidth = Math.round((canvas.width || 1080) / SCALE);
    const realHeight = Math.round((canvas.height || 1080) / SCALE);

    // Generar thumbnail del canvas (reducir tamaño para ahorrar espacio en localStorage)
    const thumbnail = canvas.toDataURL({
      format: 'jpeg', // JPEG es más liviano que PNG
      quality: 0.5,   // Reducir calidad para ahorrar espacio
      multiplier: 0.5 / SCALE, // Generar imagen más pequeña (50% del tamaño real)
    });

    // Serializar canvas
    // @ts-expect-error - Fabric.js toJSON typing issue
    const canvasJson = canvas.toJSON(['data', 'id', 'selectable', 'evented', 'editable']);

    // Manualmente agregar propiedades personalizadas a cada objeto después de toJSON
    // porque Fabric.js no serializa propiedades personalizadas correctamente
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
        // Guardar editable (por defecto true si no está definido)
        jsonObj.editable = editable !== undefined ? editable : true;

        // Guardar propiedades de customización
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

    const newTemplate: CategorizedTemplate = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      thumbnail,
      canvas: {
        width: realWidth,
        height: realHeight,
        backgroundColor: canvas.backgroundColor as string || '#ffffff',
      },
      elements: [], // Los elementos están en canvasJson
      category: 'instagram-post', // Legacy field
      businessCategory,
      style,
      isActive: true,
      createdBy: userId,
      createdAt: new Date().toISOString(),
      demoTheme,
    };

    // Guardar el JSON del canvas como parte del template
    (newTemplate as any).canvasJson = canvasJson;

    templates.push(newTemplate);
    localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(templates));

    return newTemplate;
  }

  // Actualizar un template existente
  static updateTemplate(
    templateId: string,
    updates: Partial<CategorizedTemplate>
  ): CategorizedTemplate | null {
    const templates = this.getCustomTemplates();
    const index = templates.findIndex(t => t.id === templateId);

    if (index === -1) return null;

    templates[index] = {
      ...templates[index],
      ...updates,
    };

    localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
    return templates[index];
  }

  // Eliminar/desactivar un template
  static deactivateTemplate(templateId: string): boolean {
    const templates = this.getCustomTemplates();
    const index = templates.findIndex(t => t.id === templateId);

    if (index === -1) return false;

    templates[index].isActive = false;
    localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
    return true;
  }

  // Obtener un template específico
  static getTemplateById(templateId: string): CategorizedTemplate | null {
    const templates = this.getCustomTemplates();
    return templates.find(t => t.id === templateId) || null;
  }

  // Obtener los datos del canvas de un template
  static getTemplateCanvasData(templateId: string): any | null {
    const template = this.getTemplateById(templateId);
    if (!template) return null;

    return (template as any).canvasJson || null;
  }

  // Eliminar templates por categoría de negocio
  static deleteTemplatesByBusinessCategory(businessCategory: BusinessCategory): number {
    const templates = this.getCustomTemplates();
    const remainingTemplates = templates.filter(t => t.businessCategory !== businessCategory);
    const deletedCount = templates.length - remainingTemplates.length;

    localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(remainingTemplates));
    console.log(`🗑️ Eliminados ${deletedCount} templates de la categoría "${businessCategory}"`);

    return deletedCount;
  }

  // Eliminar todos los templates personalizados
  static deleteAllCustomTemplates(): number {
    const templates = this.getCustomTemplates();
    const count = templates.length;
    localStorage.removeItem(TEMPLATES_STORAGE_KEY);
    console.log(`🗑️ Eliminados ${count} templates personalizados`);
    return count;
  }
}

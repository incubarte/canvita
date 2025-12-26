// Tipos de elementos que pueden estar en un template
export type ElementType = 'text' | 'image' | 'shape';

// Tipos de fuentes disponibles
export type FontFamily = 'Arial' | 'Helvetica' | 'Times New Roman' | 'Georgia' | 'Courier New' | 'Verdana';

// Configuración de un elemento de texto
export interface TextElement {
  id: string;
  type: 'text';
  content: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: FontFamily;
  color: string;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  textAlign: 'left' | 'center' | 'right';
  width?: number;
  height?: number;
  editable: boolean;
}

// Configuración de un elemento de imagen
export interface ImageElement {
  id: string;
  type: 'image';
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  editable: boolean;
  scaleX?: number;
  scaleY?: number;
}

// Configuración de un elemento de forma (rectángulo, círculo, etc.)
export interface ShapeElement {
  id: string;
  type: 'shape';
  shapeType: 'rectangle' | 'circle';
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  stroke?: string;
  strokeWidth?: number;
  editable: boolean;
}

// Unión de todos los tipos de elementos
export type TemplateElement = TextElement | ImageElement | ShapeElement;

// Configuración del canvas
export interface CanvasConfig {
  width: number;
  height: number;
  backgroundColor: string;
}

// Template completo
export interface Template {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
  canvas: CanvasConfig;
  elements: TemplateElement[];
}

// Rubros de negocio
export type BusinessCategory = 'inmobiliaria' | 'comida' | 'ropa' | 'generico';

// Estilos de template
export type TemplateStyle = 'post' | 'historia' | 'imagen';

// Categorías de templates (legacy - mantener para compatibilidad)
export type TemplateCategory = 'instagram-story' | 'instagram-post' | 'facebook-post' | 'twitter-post';

// Template con categoría (legacy)
export interface CategorizedTemplate extends Template {
  category: TemplateCategory;
  // Nuevos campos
  businessCategory?: BusinessCategory;
  style?: TemplateStyle;
  isActive?: boolean; // Para permitir desactivar templates
  createdBy?: string; // ID del admin que lo creó
  createdAt?: string;
  demoTheme?: import('../types/user').ColorPalette; // Theme de demostración del admin
}

// Propiedades customizables para cada tipo de elemento
export type CustomizableProperty =
  | 'position'    // Posición (x, y)
  | 'text'        // Contenido de texto
  | 'color'       // Color (fill)
  | 'size'        // Tamaño (fontSize para texto, width/height para otros)
  | 'image'       // Cambiar imagen
  | 'fontFamily'  // Estilo de letra
  | 'fontWeight'  // Negrita
  | 'fontStyle';  // Itálica

// Configuración de customización para un elemento
export interface ElementCustomization {
  elementId: string; // ID del elemento en el canvas
  elementName: string; // Nombre amigable para mostrar al usuario
  isCustomizable: boolean; // Si el elemento aparece en la solapa de customización
  allowedProperties: CustomizableProperty[]; // Propiedades que el usuario puede modificar
}

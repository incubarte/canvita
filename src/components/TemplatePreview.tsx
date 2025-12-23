import { useEffect, useRef } from 'react';
import { Canvas, FabricImage, IText, Rect, Circle } from 'fabric';
import type { CategorizedTemplate, TextElement, ImageElement } from '../types/template';
import type { ColorPalette } from '../types/user';

interface TemplatePreviewProps {
  template: CategorizedTemplate;
  clientColorPalette?: ColorPalette; // Paleta del cliente para reemplazar variables
}

export const TemplatePreview = ({ template, clientColorPalette }: TemplatePreviewProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<Canvas | null>(null);

  const SCALE = 0.35;

  // Función para reemplazar colores variables con colores del cliente
  const replaceColorVariables = (canvas: Canvas, colorPalette: ColorPalette) => {
    canvas.getObjects().forEach(obj => {
      // Check if object has a color variable
      const objColorVariable = (obj as any).colorVariable;
      if (objColorVariable && colorPalette[objColorVariable as keyof typeof colorPalette]) {
        const newColor = colorPalette[objColorVariable as keyof typeof colorPalette];
        obj.set('fill', newColor);
      }
    });
    canvas.requestRenderAll();
  };

  useEffect(() => {
    if (!canvasRef.current) return;

    let isDisposed = false;

    // Limpiar canvas anterior
    if (fabricCanvasRef.current) {
      try {
        fabricCanvasRef.current.dispose();
      } catch (e) {
        // Ignorar errores
      }
      fabricCanvasRef.current = null;
    }

    // Crear canvas
    const canvas = new Canvas(canvasRef.current, {
      width: template.canvas.width * SCALE,
      height: template.canvas.height * SCALE,
      backgroundColor: template.canvas.backgroundColor,
      selection: false,
      renderOnAddRemove: true,
    });

    fabricCanvasRef.current = canvas;

    // Si tiene canvasJson guardado (template custom), cargarlo
    if ((template as any).canvasJson) {
      try {
        const jsonData = (template as any).canvasJson;

        // Usar Promise para manejar la carga asíncrona
        canvas.loadFromJSON(jsonData).then(() => {
          if (isDisposed) return;

          // Asegurar que el canvas tenga las dimensiones correctas
          canvas.setDimensions({
            width: template.canvas.width * SCALE,
            height: template.canvas.height * SCALE
          });
          canvas.backgroundColor = template.canvas.backgroundColor;

          // Reemplazar colores variables con colores del cliente si está disponible
          if (clientColorPalette) {
            replaceColorVariables(canvas, clientColorPalette);
          }

          // Deshabilitar interacción en todos los objetos
          canvas.getObjects().forEach(obj => {
            obj.selectable = false;
            obj.evented = false;
          });

          // Esperar un frame antes de renderizar
          requestAnimationFrame(() => {
            if (!isDisposed) {
              canvas.renderAll();
            }
          });
        }).catch((error) => {
          console.error('Error loading canvas JSON for preview:', error);
          console.error('Template:', template.name, template.id);
          if (!isDisposed) {
            renderTemplate(canvas);
          }
        });
      } catch (error) {
        console.error('Error parsing canvas JSON for preview:', error);
        console.error('Template:', template.name, template.id);
        renderTemplate(canvas);
      }
    } else {
      // Template base, renderizar desde elementos
      renderTemplate(canvas);
    }

    return () => {
      isDisposed = true;
      try {
        if (fabricCanvasRef.current) {
          fabricCanvasRef.current.dispose();
        }
      } catch (e) {
        // Ignorar errores
      }
    };
  }, [template.id]);

  const renderTemplate = async (canvas: Canvas) => {
    canvas.clear();
    canvas.backgroundColor = template.canvas.backgroundColor;

    for (const element of template.elements) {
      if (element.type === 'text') {
        await addTextElement(canvas, element as TextElement);
      } else if (element.type === 'image') {
        await addImageElement(canvas, element as ImageElement);
      } else if (element.type === 'shape') {
        await addShapeElement(canvas, element);
      }
    }

    // Deshabilitar interacción
    canvas.getObjects().forEach(obj => {
      obj.selectable = false;
      obj.evented = false;
    });

    canvas.renderAll();
  };

  const addTextElement = async (canvas: Canvas, element: TextElement) => {
    const text = new IText(element.content, {
      left: element.x * SCALE,
      top: element.y * SCALE,
      fontSize: element.fontSize * SCALE,
      fontFamily: element.fontFamily,
      fill: element.color,
      fontWeight: element.fontWeight,
      fontStyle: element.fontStyle,
      textAlign: element.textAlign,
      selectable: false,
      evented: false,
      originX: 'center',
      originY: 'center',
    });

    canvas.add(text);
  };

  const addImageElement = async (canvas: Canvas, element: ImageElement) => {
    try {
      const img = await FabricImage.fromURL(element.src, {
        crossOrigin: 'anonymous'
      });

      img.set({
        left: element.x * SCALE,
        top: element.y * SCALE,
        scaleX: (element.width / (img.width || 1)) * SCALE,
        scaleY: (element.height / (img.height || 1)) * SCALE,
        selectable: false,
        evented: false,
        originX: 'center',
        originY: 'center',
      });

      canvas.add(img);
    } catch (error) {
      console.error('Error loading image:', error);
    }
  };

  const addShapeElement = async (canvas: Canvas, element: any) => {
    let shape;

    if (element.shapeType === 'rectangle') {
      shape = new Rect({
        left: element.x * SCALE,
        top: element.y * SCALE,
        width: element.width * SCALE,
        height: element.height * SCALE,
        fill: element.fill,
        stroke: element.stroke,
        strokeWidth: element.strokeWidth ? element.strokeWidth * SCALE : 0,
        selectable: false,
        evented: false,
      });
    } else {
      shape = new Circle({
        left: element.x * SCALE,
        top: element.y * SCALE,
        radius: (element.width / 2) * SCALE,
        fill: element.fill,
        stroke: element.stroke,
        strokeWidth: element.strokeWidth ? element.strokeWidth * SCALE : 0,
        selectable: false,
        evented: false,
      });
    }

    canvas.add(shape);
  };

  return (
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl blur-xl opacity-50"></div>
      <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-2xl">
        <canvas ref={canvasRef} className="rounded-xl shadow-lg" />
      </div>
    </div>
  );
};

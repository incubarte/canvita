import { useEffect, useRef, useState } from 'react';
import { Canvas, FabricImage, IText, Rect, Circle, FabricObject, Control, type TPointerEvent, type Transform } from 'fabric';
import type { Template, TemplateElement, TextElement, ImageElement } from '../types/template';
import type { ColorPalette } from '../types/user';

interface CanvasEditorProps {
  template: Template;
  onElementSelect?: (element: TemplateElement | null) => void;
  onCanvasReady?: (canvas: Canvas) => void;
  savedCanvasData?: string; // JSON del canvas guardado
  clientColorPalette?: ColorPalette; // Paleta de colores del cliente para reemplazar variables
  isAdmin?: boolean; // Si es admin, tiene control total; si no, solo puede editar elementos customizables
}

export const CanvasEditor = ({ template, onElementSelect, onCanvasReady, savedCanvasData, clientColorPalette, isAdmin = false }: CanvasEditorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<Canvas | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const SCALE = 0.35;

  // Función para reemplazar colores variables con colores del cliente
  const replaceColorVariables = (canvas: Canvas, colorPalette: ColorPalette) => {
    console.log('🎨 Reemplazando colores variables con paleta del cliente:', colorPalette);
    let replacedCount = 0;
    const objects = canvas.getObjects();
    console.log(`📦 Total de objetos en canvas: ${objects.length}`);

    objects.forEach((obj, index) => {
      const objColorVariable = (obj as any).colorVariable;
      console.log(`  Objeto ${index}: type=${obj.type}, colorVariable=`, objColorVariable);

      // Check if object has a color variable
      if (objColorVariable) {
        if (colorPalette[objColorVariable as keyof typeof colorPalette]) {
          const oldColor = obj.fill;
          const newColor = colorPalette[objColorVariable as keyof typeof colorPalette];
          obj.set('fill', newColor);
          console.log(`  ✅ Reemplazado ${objColorVariable}: ${oldColor} → ${newColor}`);
          replacedCount++;
        } else {
          console.warn(`  ⚠️ Variable de color "${objColorVariable}" no encontrada en la paleta del cliente`);
        }
      }
    });

    if (replacedCount === 0) {
      console.log('ℹ️ No se encontraron objetos con variables de color. Esto puede ocurrir si:');
      console.log('   1. El template fue creado antes de la funcionalidad de color variables');
      console.log('   2. Ningún objeto fue configurado con color variable');
      console.log('   👉 Crea un nuevo template y asigna colores variables para probar esta funcionalidad');
    }
    console.log(`🎨 Total de colores reemplazados: ${replacedCount}`);
    canvas.requestRenderAll();
  };

  // Función para configurar restricciones de usuario no-admin
  const applyUserRestrictions = (canvas: Canvas) => {
    if (isAdmin) {
      console.log('👑 Usuario admin - sin restricciones');
      return; // Admin tiene acceso total
    }

    console.log('👤 Usuario no-admin - aplicando restricciones...');
    const objects = canvas.getObjects();
    let customizableCount = 0;
    let lockedCount = 0;

    objects.forEach((obj, index) => {
      const isCustomizable = (obj as any).isCustomizable === true;
      const allowedProperties: string[] = (obj as any).allowedProperties || [];
      console.log(`  Objeto ${index}: type=${obj.type}, isCustomizable=${isCustomizable}, allowedProperties=`, allowedProperties);

      if (!isCustomizable) {
        // Hacer el objeto no seleccionable y no interactivo
        obj.set({
          selectable: false,
          evented: false,
        });
        lockedCount++;
      } else {
        // El objeto es customizable, pero restringir según allowedProperties
        const canMove = allowedProperties.includes('position');
        const canResize = allowedProperties.includes('size');
        const canEditText = allowedProperties.includes('text');

        // Configuración base para todos los elementos customizables
        obj.set({
          selectable: true,
          evented: true,
          // Deshabilitar movimiento si no está en allowedProperties
          lockMovementX: !canMove,
          lockMovementY: !canMove,
          // Deshabilitar redimensionamiento si no está en allowedProperties
          lockScalingX: !canResize,
          lockScalingY: !canResize,
          // Siempre deshabilitar rotación para usuarios
          lockRotation: true,
          // Deshabilitar skewing (inclinación)
          lockSkewingX: true,
          lockSkewingY: true,
          // Mostrar controles solo si puede redimensionar
          hasControls: canResize,
          // Siempre mostrar bordes cuando está seleccionado (para feedback visual)
          hasBorders: true,
        });

        // Para textos, configurar si se puede editar haciendo doble clic
        if (obj.type === 'i-text') {
          (obj as IText).set({
            editable: canEditText, // Solo editable si 'text' está en allowedProperties
          });
        }

        customizableCount++;
        console.log(`    ✓ Restricciones aplicadas: move=${canMove}, resize=${canResize}, editText=${canEditText}`);
      }
    });

    console.log(`🔒 Elementos bloqueados: ${lockedCount}`);
    console.log(`🎨 Elementos customizables: ${customizableCount}`);
    canvas.requestRenderAll();
  };

  // Función helper para crear un elemento desde un objeto de Fabric
  const createElementFromObject = (obj: any): TemplateElement | null => {
    // Si tiene data guardado, usarlo
    if (obj.data) {
      return obj.data as TemplateElement;
    }

    // Si no, inferir basado en el tipo de objeto
    if (obj.type === 'i-text' || obj.type === 'text') {
      return {
        id: obj.id || 'temp-' + Math.random(),
        type: 'text',
        content: obj.text || '',
        x: obj.left || 0,
        y: obj.top || 0,
        fontSize: obj.fontSize || 16,
        fontFamily: obj.fontFamily || 'Arial',
        color: obj.fill || '#000000',
        fontWeight: obj.fontWeight || 'normal',
        fontStyle: obj.fontStyle || 'normal',
        textAlign: obj.textAlign || 'left',
        editable: obj.selectable !== false,
      } as any;
    } else if (obj.type === 'image') {
      return {
        id: obj.id || 'temp-' + Math.random(),
        type: 'image',
        src: obj.src || obj._originalElement?.src || '',
        x: obj.left || 0,
        y: obj.top || 0,
        width: obj.width || 100,
        height: obj.height || 100,
        editable: obj.selectable !== false,
      } as any;
    } else if (obj.type === 'rect' || obj.type === 'circle') {
      return {
        id: obj.id || 'temp-' + Math.random(),
        type: 'shape',
        shapeType: obj.type === 'rect' ? 'rectangle' : 'circle',
        x: obj.left || 0,
        y: obj.top || 0,
        width: obj.width || 100,
        height: obj.height || 100,
        fill: obj.fill || '#000000',
        editable: obj.selectable !== false,
      } as any;
    }

    return null;
  };

  useEffect(() => {
    if (!canvasRef.current) return;

    let isDisposed = false;

    if (fabricCanvasRef.current) {
      try {
        fabricCanvasRef.current.dispose();
      } catch (e) {
        // Ignorar errores
      }
      fabricCanvasRef.current = null;
    }

    const canvas = new Canvas(canvasRef.current, {
      width: template.canvas.width * SCALE,
      height: template.canvas.height * SCALE,
      backgroundColor: template.canvas.backgroundColor,
      preserveObjectStacking: true, // Mantener el orden z-index al seleccionar
    });

    fabricCanvasRef.current = canvas;

    // Función para eliminar objeto
    const deleteObject = (_eventData: TPointerEvent, transform: Transform) => {
      const target = transform.target;
      const canvas = target.canvas;
      if (!canvas) return false;
      canvas.remove(target);
      canvas.requestRenderAll();
      return true;
    };

    // Función para mover adelante
    const bringForward = (_eventData: TPointerEvent, transform: Transform) => {
      const target = transform.target;
      const canvas = target.canvas;
      if (!canvas) return false;

      // Ejecutar después del ciclo de eventos actual
      setTimeout(() => {
        const objects = canvas.getObjects();
        const currentIndex = objects.indexOf(target);

        // Solo mover si no está al final
        if (currentIndex >= 0 && currentIndex < objects.length - 1) {
          // Obtener todos los objetos excepto el actual
          const filtered = objects.filter((obj: FabricObject) => obj !== target);
          // Insertar en la nueva posición
          filtered.splice(currentIndex + 1, 0, target);

          // Limpiar canvas y re-agregar en el nuevo orden
          canvas.remove(...objects);
          canvas.add(...filtered);
          canvas.setActiveObject(target);
          canvas.requestRenderAll();
        }
      }, 0);

      return true;
    };

    // Función para mover atrás
    const sendBackward = (_eventData: TPointerEvent, transform: Transform) => {
      const target = transform.target;
      const canvas = target.canvas;
      if (!canvas) return false;

      // Ejecutar después del ciclo de eventos actual
      setTimeout(() => {
        const objects = canvas.getObjects();
        const currentIndex = objects.indexOf(target);

        // Encontrar mínimo índice (después de fondos bloqueados)
        let minIndex = 0;
        for (let i = 0; i < objects.length; i++) {
          if (objects[i].selectable === false || objects[i].evented === false) {
            minIndex = i + 1;
          } else {
            break;
          }
        }

        // Solo mover si no está en el mínimo
        if (currentIndex > minIndex) {
          // Obtener todos los objetos excepto el actual
          const filtered = objects.filter((obj: FabricObject) => obj !== target);
          // Insertar en la nueva posición
          filtered.splice(currentIndex - 1, 0, target);

          // Limpiar canvas y re-agregar en el nuevo orden
          canvas.remove(...objects);
          canvas.add(...filtered);
          canvas.setActiveObject(target);
          canvas.requestRenderAll();
        }
      }, 0);

      return true;
    };

    // Función para renderizar el ícono de eliminar
    const renderDeleteIcon = (
      ctx: CanvasRenderingContext2D,
      left: number,
      top: number,
      styleOverride: any,
      fabricObject: FabricObject
    ) => {
      const size = 20;
      ctx.save();
      ctx.translate(left, top);
      ctx.rotate(((fabricObject.angle || 0) * Math.PI) / 180);

      // Círculo rojo de fondo
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(0, 0, size / 2, 0, 2 * Math.PI);
      ctx.fill();

      // X blanca
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-size / 4, -size / 4);
      ctx.lineTo(size / 4, size / 4);
      ctx.moveTo(size / 4, -size / 4);
      ctx.lineTo(-size / 4, size / 4);
      ctx.stroke();

      ctx.restore();
    };

    // Función para renderizar flecha arriba (traer adelante)
    const renderBringForwardIcon = (
      ctx: CanvasRenderingContext2D,
      left: number,
      top: number,
      styleOverride: any,
      fabricObject: FabricObject
    ) => {
      const size = 20;
      ctx.save();
      ctx.translate(left, top);
      ctx.rotate(((fabricObject.angle || 0) * Math.PI) / 180);

      // Círculo azul de fondo
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(0, 0, size / 2, 0, 2 * Math.PI);
      ctx.fill();

      // Flecha arriba blanca
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(0, -size / 4);
      ctx.lineTo(-size / 4, size / 8);
      ctx.moveTo(0, -size / 4);
      ctx.lineTo(size / 4, size / 8);
      ctx.stroke();

      ctx.restore();
    };

    // Función para renderizar flecha abajo (enviar atrás)
    const renderSendBackwardIcon = (
      ctx: CanvasRenderingContext2D,
      left: number,
      top: number,
      styleOverride: any,
      fabricObject: FabricObject
    ) => {
      const size = 20;
      ctx.save();
      ctx.translate(left, top);
      ctx.rotate(((fabricObject.angle || 0) * Math.PI) / 180);

      // Círculo naranja de fondo
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(0, 0, size / 2, 0, 2 * Math.PI);
      ctx.fill();

      // Flecha abajo blanca
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(0, size / 4);
      ctx.lineTo(-size / 4, -size / 8);
      ctx.moveTo(0, size / 4);
      ctx.lineTo(size / 4, -size / 8);
      ctx.stroke();

      ctx.restore();
    };

    // Crear controles
    const deleteControl = new Control({
      x: 0.5,
      y: -0.5,
      offsetY: -16,
      offsetX: 16,
      cursorStyle: 'pointer',
      mouseUpHandler: deleteObject,
      render: renderDeleteIcon,
    });

    const bringForwardControl = new Control({
      x: -0.5,
      y: -0.5,
      offsetY: -16,
      offsetX: -16,
      cursorStyle: 'pointer',
      mouseUpHandler: bringForward,
      render: renderBringForwardIcon,
    });

    const sendBackwardControl = new Control({
      x: -0.5,
      y: -0.5,
      offsetY: -16,
      offsetX: -52,
      cursorStyle: 'pointer',
      mouseUpHandler: sendBackward,
      render: renderSendBackwardIcon,
    });

    // Configurar controles para todos los objetos que se agreguen
    const originalAdd = canvas.add.bind(canvas);
    canvas.add = function (...objects: FabricObject[]) {
      objects.forEach((obj) => {
        if (obj.selectable !== false) {
          // Solo agregar controles de eliminación y z-index si es admin
          if (isAdmin) {
            obj.controls = {
              ...obj.controls,
              deleteControl: deleteControl,
              bringForwardControl: bringForwardControl,
              sendBackwardControl: sendBackwardControl,
            };
          }
        }
      });
      return originalAdd(...objects);
    };

    // Agregar listener para la tecla Delete (solo admin)
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        // Solo permitir eliminación si es admin
        if (isAdmin) {
          const activeObject = canvas.getActiveObject();
          if (activeObject && activeObject.selectable !== false) {
            canvas.remove(activeObject);
            canvas.requestRenderAll();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    const handleSelectionCreated = (e: any) => {
      const activeObject = e.selected?.[0];
      if (activeObject) {
        // Crear un elemento genérico basado en el tipo de objeto
        const element = createElementFromObject(activeObject);
        if (element) {
          onElementSelect?.(element);
        }
      }
    };

    const handleSelectionUpdated = (e: any) => {
      const activeObject = e.selected?.[0];
      if (activeObject) {
        // Crear un elemento genérico basado en el tipo de objeto
        const element = createElementFromObject(activeObject);
        if (element) {
          onElementSelect?.(element);
        }
      }
    };

    const handleSelectionCleared = () => {
      onElementSelect?.(null);
    };

    canvas.on('selection:created', handleSelectionCreated);
    canvas.on('selection:updated', handleSelectionUpdated);
    canvas.on('selection:cleared', handleSelectionCleared);

    // Si hay datos guardados, cargarlos; sino, renderizar el template
    if (savedCanvasData) {
      try {
        const jsonData = JSON.parse(savedCanvasData);
        canvas.loadFromJSON(jsonData).then(() => {
          if (isDisposed) return;

          // Asegurar que el canvas tenga el tamaño correcto
          canvas.setDimensions({
            width: template.canvas.width * SCALE,
            height: template.canvas.height * SCALE
          });
          canvas.backgroundColor = template.canvas.backgroundColor;

          // Reemplazar colores variables con colores del cliente si está disponible
          console.log('🔍 clientColorPalette:', clientColorPalette);
          if (clientColorPalette) {
            replaceColorVariables(canvas, clientColorPalette);
          } else {
            console.log('⚠️ No hay clientColorPalette disponible');
          }

          // Aplicar restricciones para usuarios no-admin
          applyUserRestrictions(canvas);

          // Forzar render después de cargar todo
          canvas.requestRenderAll();

          if (!isDisposed && onCanvasReady) {
            onCanvasReady(canvas);
          }
        }).catch((error) => {
          console.error('Error loading saved canvas:', error);
          // Si falla, renderizar template por defecto
          renderTemplate(canvas, template).then(() => {
            applyUserRestrictions(canvas);
            if (!isDisposed && onCanvasReady) {
              onCanvasReady(canvas);
            }
          });
        });
      } catch (error) {
        console.error('Error parsing saved canvas:', error);
        // Si falla, renderizar template por defecto
        renderTemplate(canvas, template).then(() => {
          applyUserRestrictions(canvas);
          if (!isDisposed && onCanvasReady) {
            onCanvasReady(canvas);
          }
        });
      }
    } else {
      renderTemplate(canvas, template).then(() => {
        applyUserRestrictions(canvas);
        if (!isDisposed && onCanvasReady) {
          onCanvasReady(canvas);
        }
      });
    }

    return () => {
      isDisposed = true;
      window.removeEventListener('keydown', handleKeyDown);
      try {
        canvas.off('selection:created', handleSelectionCreated);
        canvas.off('selection:updated', handleSelectionUpdated);
        canvas.off('selection:cleared', handleSelectionCleared);
        canvas.dispose();
      } catch (e) {
        // Ignorar errores
      }
    };
  }, [template.id]);

  const renderTemplate = async (canvas: Canvas, template: Template) => {
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
      selectable: element.editable,
      hasControls: element.editable,
      hasBorders: element.editable,
      originX: 'center',
      originY: 'center',
    });

    (text as any).data = element;
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
        selectable: element.editable,
        hasControls: element.editable,
        hasBorders: element.editable,
        originX: 'center',
        originY: 'center',
      });

      (img as any).data = element;
      canvas.add(img);
    } catch (error) {
      console.error('Error loading image:', error);
    }
  };

  const addShapeElement = async (canvas: Canvas, element: any) => {
    let shape: FabricObject;

    if (element.shapeType === 'rectangle') {
      shape = new Rect({
        left: element.x * SCALE,
        top: element.y * SCALE,
        width: element.width * SCALE,
        height: element.height * SCALE,
        fill: element.fill,
        stroke: element.stroke,
        strokeWidth: element.strokeWidth ? element.strokeWidth * SCALE : 0,
        selectable: element.editable,
        hasControls: element.editable,
        hasBorders: element.editable,
      });
    } else {
      shape = new Circle({
        left: element.x * SCALE,
        top: element.y * SCALE,
        radius: (element.width / 2) * SCALE,
        fill: element.fill,
        stroke: element.stroke,
        strokeWidth: element.strokeWidth ? element.strokeWidth * SCALE : 0,
        selectable: element.editable,
        hasControls: element.editable,
        hasBorders: element.editable,
      });
    }

    (shape as any).data = element;
    canvas.add(shape);
  };

  return (
    <div ref={containerRef} className="h-full flex items-center justify-center p-8">
      <div className="relative group">
        {/* Glow effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity"></div>

        {/* Canvas container */}
        <div className="relative bg-white rounded-xl shadow-2xl p-6">
          <canvas ref={canvasRef} className="rounded-lg" />
        </div>
      </div>
    </div>
  );
};

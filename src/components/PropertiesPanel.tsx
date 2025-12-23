// @ts-nocheck - Fabric.js has complex typing issues
import { Canvas, FabricImage, IText } from 'fabric';
import { useState } from 'react';
import type { TemplateElement, FontFamily } from '../types/template';
import type { ColorPalette, ColorVariableName } from '../types/user';

interface PropertiesPanelProps {
  selectedElement: TemplateElement | null;
  canvas: Canvas | null;
  onUpdate?: () => void;
  demoTheme?: ColorPalette;
}

const fontFamilies: FontFamily[] = ['Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Courier New', 'Verdana'];

interface UnsplashImage {
  id: string;
  urls: {
    small: string;
    regular: string;
  };
  alt_description: string;
  user: {
    name: string;
  };
}

export const PropertiesPanel = ({ selectedElement, canvas, onUpdate, demoTheme }: PropertiesPanelProps) => {
  const [unsplashImages, setUnsplashImages] = useState<UnsplashImage[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showImageSearch, setShowImageSearch] = useState(false);
  const [colorMode, setColorMode] = useState<'fixed' | 'variable'>('fixed');
  const [selectedColorVariable, setSelectedColorVariable] = useState<ColorVariableName>('principal1');

  const searchUnsplash = async (query: string) => {
    if (!query.trim()) return;

    setIsSearching(true);

    try {
      // Obtener la API key desde las variables de entorno
      const apiKey = import.meta.env.VITE_PEXELS_API_KEY;

      if (!apiKey || apiKey === 'your_api_key_here') {
        // Mostrar mensaje de error si no hay API key configurada
        console.error('⚠️ Pexels API Key no configurada');
        console.log('Para usar la búsqueda de imágenes:');
        console.log('1. Obtené tu API key gratis en: https://www.pexels.com/api/');
        console.log('2. Copiá tu API key');
        console.log('3. Abrí el archivo .env.local');
        console.log('4. Reemplazá "your_api_key_here" con tu API key');
        console.log('5. Reiniciá el servidor (npm run dev)');

        setUnsplashImages([]);
        setIsSearching(false);
        return;
      }

      const response = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=12&orientation=landscape`,
        {
          headers: {
            Authorization: apiKey,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.photos && data.photos.length > 0) {
        const images = data.photos.map((photo: any) => ({
          id: `pexels-${photo.id}`,
          urls: {
            small: photo.src.medium,
            regular: photo.src.large,
          },
          alt_description: photo.alt || query,
          user: {
            name: photo.photographer,
          },
        }));

        setUnsplashImages(images);
      } else {
        console.log(`No se encontraron imágenes para: "${query}"`);
        setUnsplashImages([]);
      }
    } catch (error) {
      console.error('Error buscando imágenes:', error);
      setUnsplashImages([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleUnsplashImageSelect = async (imageUrl: string) => {
    const activeObject = canvas?.getActiveObject();
    if (!canvas || !activeObject || activeObject.type !== 'image') return;

    try {
      const fabricImage = activeObject as FabricImage;

      // Obtener el tamaño y posición actuales
      const currentLeft = fabricImage.left || 0;
      const currentTop = fabricImage.top || 0;
      const currentWidth = (fabricImage.width || 100) * (fabricImage.scaleX || 1);
      const currentHeight = (fabricImage.height || 100) * (fabricImage.scaleY || 1);

      // Cargar la nueva imagen primero
      const newImage = await FabricImage.fromURL(imageUrl, {
        crossOrigin: 'anonymous'
      });

      // Calcular la escala para mantener el tamaño
      const newScaleX = currentWidth / (newImage.width || 1);
      const newScaleY = currentHeight / (newImage.height || 1);

      // Reemplazar la imagen en el canvas
      fabricImage.setElement(newImage.getElement());
      fabricImage.set({
        left: currentLeft,
        top: currentTop,
        scaleX: newScaleX,
        scaleY: newScaleY,
      });

      canvas.requestRenderAll();
      onUpdate?.();

      setShowImageSearch(false);
    } catch (error) {
      console.error('Error loading image:', error);
    }
  };

  const handleBringForward = () => {
    if (!canvas) return;
    const activeObject = canvas.getActiveObject();
    if (activeObject && activeObject.selectable !== false) {
      const objects = canvas.getObjects();
      const currentIndex = objects.indexOf(activeObject);

      // Solo mover si no está ya al frente
      if (currentIndex < objects.length - 1) {
        const obj = activeObject;
        canvas.remove(obj);
        canvas.insertAt(obj, currentIndex + 1);
        canvas.setActiveObject(obj);
        canvas.requestRenderAll();

        // Notificar cambio para historial después de que termine la animación
        setTimeout(() => {
          canvas.fire('object:modified', { target: obj });
        }, 200);
      }
    }
  };

  const handleSendBackward = () => {
    if (!canvas) return;
    const activeObject = canvas.getActiveObject();
    if (activeObject && activeObject.selectable !== false) {
      const objects = canvas.getObjects();
      const currentIndex = objects.indexOf(activeObject);

      // Encontrar el índice del primer elemento no-fondo
      let minIndex = 0;
      for (let i = 0; i < objects.length; i++) {
        const obj = objects[i];
        if (obj.selectable === false || obj.evented === false) {
          minIndex = i + 1;
        } else {
          break;
        }
      }

      // Solo mover si no está ya al fondo (después de elementos bloqueados)
      if (currentIndex > minIndex) {
        const obj = activeObject;
        canvas.remove(obj);
        canvas.insertAt(obj, currentIndex - 1);
        canvas.setActiveObject(obj);
        canvas.requestRenderAll();

        // Notificar cambio para historial
        setTimeout(() => {
          canvas.fire('object:modified', { target: obj });
        }, 100);
      }
    }
  };

  const handleBringToFront = () => {
    if (!canvas) return;
    const activeObject = canvas.getActiveObject();
    if (activeObject && activeObject.selectable !== false) {
      const obj = activeObject;
      canvas.remove(obj);
      canvas.add(obj);
      canvas.setActiveObject(obj);
      canvas.requestRenderAll();

      // Notificar cambio para historial
      setTimeout(() => {
        canvas.fire('object:modified', { target: obj });
      }, 100);
    }
  };

  const handleSendToBack = () => {
    if (!canvas) return;
    const activeObject = canvas.getActiveObject();
    if (activeObject && activeObject.selectable !== false) {
      const objects = canvas.getObjects();

      // Encontrar el índice del primer elemento no-fondo
      let minIndex = 0;
      for (let i = 0; i < objects.length; i++) {
        const obj = objects[i];
        if (obj.selectable === false || obj.evented === false) {
          minIndex = i + 1;
        } else {
          break;
        }
      }

      const obj = activeObject;
      canvas.remove(obj);
      canvas.insertAt(obj, minIndex);
      canvas.setActiveObject(obj);
      canvas.requestRenderAll();

      // Notificar cambio para historial
      setTimeout(() => {
        canvas.fire('object:modified', { target: obj });
      }, 100);
    }
  };

  const handleToggleTransparency = () => {
    if (!canvas) return;
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
      const currentOpacity = activeObject.opacity ?? 1;
      activeObject.set('opacity', currentOpacity >= 0.9 ? 0.15 : 1);
      canvas.requestRenderAll();
      onUpdate?.();
    }
  };

  const handleBackgroundColorChange = (color: string, colorVariable?: ColorVariableName) => {
    if (!canvas) return;
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
      activeObject.set('fill', color);
      // Store color variable as a custom property directly on the object
      (activeObject as any).colorVariable = colorVariable || null;

      console.log('💾 Guardando colorVariable:', colorVariable, 'en objeto:', activeObject.type);
      console.log('   colorVariable después de asignar:', (activeObject as any).colorVariable);

      canvas.requestRenderAll();
      onUpdate?.();
    }
  };

  const applyColorVariable = (colorVariable: ColorVariableName) => {
    if (!demoTheme) return;
    const color = demoTheme[colorVariable];
    handleBackgroundColorChange(color, colorVariable);
  };

  if (!selectedElement || !canvas) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/10">
            <svg className="w-8 h-8 text-purple-300/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
            </svg>
          </div>
          <p className="text-sm text-purple-300/60">Click on an element</p>
          <p className="text-xs text-purple-300/40 mt-1">to edit its properties</p>
        </div>
      </div>
    );
  }

  const activeObject = canvas.getActiveObject();

  const handleTextChange = (value: string) => {
    if (activeObject && activeObject.type === 'i-text') {
      (activeObject as IText).set('text', value);
      canvas.renderAll();
      onUpdate?.();
    }
  };

  const handleFontSizeChange = (value: number) => {
    if (activeObject && activeObject.type === 'i-text') {
      (activeObject as IText).set('fontSize', value * 0.35);
      canvas.renderAll();
      onUpdate?.();
    }
  };

  const handleFontFamilyChange = (value: FontFamily) => {
    if (activeObject && activeObject.type === 'i-text') {
      (activeObject as IText).set('fontFamily', value);
      canvas.renderAll();
      onUpdate?.();
    }
  };

  const handleColorChange = (value: string, colorVariable?: ColorVariableName) => {
    if (activeObject && activeObject.type === 'i-text') {
      (activeObject as IText).set('fill', value);
      // Store color variable as a custom property directly on the object
      (activeObject as any).colorVariable = colorVariable || null;

      console.log('💾 Guardando colorVariable en texto:', colorVariable);
      console.log('   colorVariable después de asignar:', (activeObject as any).colorVariable);

      canvas.renderAll();
      onUpdate?.();
    }
  };

  const applyTextColorVariable = (colorVariable: ColorVariableName) => {
    if (!demoTheme) return;
    const color = demoTheme[colorVariable];
    handleColorChange(color, colorVariable);
  };

  const handleFontWeightChange = (value: 'normal' | 'bold') => {
    if (activeObject && activeObject.type === 'i-text') {
      (activeObject as IText).set('fontWeight', value);
      canvas.renderAll();
      onUpdate?.();
    }
  };

  const handleFontStyleChange = (value: 'normal' | 'italic') => {
    if (activeObject && activeObject.type === 'i-text') {
      (activeObject as IText).set('fontStyle', value);
      canvas.renderAll();
      onUpdate?.();
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeObject || activeObject.type !== 'image') return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const imgUrl = event.target?.result as string;
      try {
        const fabricImage = activeObject as FabricImage;

        // Obtener el tamaño y posición actuales
        const currentLeft = fabricImage.left || 0;
        const currentTop = fabricImage.top || 0;
        const currentWidth = (fabricImage.width || 100) * (fabricImage.scaleX || 1);
        const currentHeight = (fabricImage.height || 100) * (fabricImage.scaleY || 1);

        // Cargar la nueva imagen
        const newImage = await FabricImage.fromURL(imgUrl, {
          crossOrigin: 'anonymous'
        });

        // Calcular la escala para mantener el tamaño
        const newScaleX = currentWidth / (newImage.width || 1);
        const newScaleY = currentHeight / (newImage.height || 1);

        // Reemplazar la imagen
        fabricImage.setElement(newImage.getElement());
        fabricImage.set({
          left: currentLeft,
          top: currentTop,
          scaleX: newScaleX,
          scaleY: newScaleY,
        });

        canvas.requestRenderAll();
        onUpdate?.();
      } catch (error) {
        console.error('Error loading image:', error);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="h-full overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
      {/* Controles generales - siempre visibles cuando hay elemento seleccionado */}
      {selectedElement.editable && (
        <div className="space-y-3 mb-4">
          {/* Transparencia */}
          <div>
            <button
              onClick={handleToggleTransparency}
              className="w-full flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all"
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-300/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span className="text-sm text-purple-300/80">Transparencia (85%)</span>
              </div>
              {/* Toggle Switch Moderno */}
              <div className={`relative w-11 h-6 rounded-full transition-colors ${
                activeObject && (activeObject.opacity ?? 1) < 0.9
                  ? 'bg-purple-600'
                  : 'bg-white/20'
              }`}>
                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  activeObject && (activeObject.opacity ?? 1) < 0.9
                    ? 'translate-x-5'
                    : 'translate-x-0'
                }`}></div>
              </div>
            </button>
          </div>

          {/* Color de Fondo */}
          {(selectedElement.type === 'shape' || activeObject?.type === 'rect' || activeObject?.type === 'circle') && (
            <div className="space-y-3">
              <label className="block text-xs font-medium text-purple-300/80 mb-2">
                Color de Fondo
              </label>

              {/* Mode selector */}
              {demoTheme && (
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() => setColorMode('fixed')}
                    className={`flex-1 px-3 py-2 text-xs rounded-lg transition-all ${
                      colorMode === 'fixed'
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                        : 'bg-white/5 text-purple-300/60 border border-white/10 hover:bg-white/10'
                    }`}
                  >
                    Color Fijo
                  </button>
                  <button
                    onClick={() => setColorMode('variable')}
                    className={`flex-1 px-3 py-2 text-xs rounded-lg transition-all ${
                      colorMode === 'variable'
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                        : 'bg-white/5 text-purple-300/60 border border-white/10 hover:bg-white/10'
                    }`}
                  >
                    Color Variable
                  </button>
                </div>
              )}

              {/* Fixed color picker */}
              {colorMode === 'fixed' && (
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={activeObject?.fill as string || '#667eea'}
                    onChange={(e) => handleBackgroundColorChange(e.target.value)}
                    className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl cursor-pointer"
                  />
                  <input
                    type="text"
                    value={activeObject?.fill as string || '#667eea'}
                    onChange={(e) => handleBackgroundColorChange(e.target.value)}
                    className="flex-1 px-3 py-2.5 text-sm bg-white/5 border border-white/10 rounded-xl text-white font-mono focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
                    placeholder="#667eea"
                  />
                </div>
              )}

              {/* Variable color selector */}
              {colorMode === 'variable' && demoTheme && (
                <div className="space-y-2">
                  {(Object.keys(demoTheme) as ColorVariableName[]).map((colorVar) => {
                    const labels: Record<ColorVariableName, string> = {
                      principal1: 'Principal 1',
                      principal2: 'Principal 2',
                      secundario1: 'Secundario 1',
                      secundario2: 'Secundario 2',
                      secundario3: 'Secundario 3',
                    };
                    const isSelected = (activeObject as any)?.colorVariable === colorVar;
                    return (
                      <button
                        key={colorVar}
                        onClick={() => {
                          setSelectedColorVariable(colorVar);
                          applyColorVariable(colorVar);
                        }}
                        className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition-all ${
                          isSelected
                            ? 'bg-gradient-to-r from-purple-600/40 to-pink-600/40 border border-purple-400/50'
                            : 'bg-white/5 border border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <div
                          className="w-8 h-8 rounded border-2 border-white/20"
                          style={{ backgroundColor: demoTheme[colorVar] }}
                        />
                        <div className="flex-1 text-left">
                          <div className="text-xs font-medium text-white">{labels[colorVar]}</div>
                          <div className="text-xs text-purple-300/40 font-mono">{demoTheme[colorVar]}</div>
                        </div>
                        {isSelected && (
                          <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {selectedElement.type === 'text' && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-purple-300/80 mb-2">
              Text Content
            </label>
            <textarea
              value={(activeObject as IText)?.text || ''}
              onChange={(e) => handleTextChange(e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent resize-none"
              rows={3}
              placeholder="Enter your text..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-purple-300/80 mb-2">
                Size
              </label>
              <input
                type="number"
                value={Math.round(((activeObject as IText)?.fontSize || 16) / 0.35)}
                onChange={(e) => handleFontSizeChange(Number(e.target.value))}
                className="w-full px-3 py-2.5 text-sm bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
                min={8}
                max={200}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-purple-300/80 mb-2">
                Font
              </label>
              <select
                value={(activeObject as IText)?.fontFamily || 'Arial'}
                onChange={(e) => handleFontFamilyChange(e.target.value as FontFamily)}
                className="w-full px-3 py-2.5 text-sm bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
              >
                {fontFamilies.map((font) => (
                  <option key={font} value={font} className="bg-slate-900">{font}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-medium text-purple-300/80 mb-2">
              Color
            </label>

            {/* Mode selector */}
            {demoTheme && (
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => setColorMode('fixed')}
                  className={`flex-1 px-3 py-2 text-xs rounded-lg transition-all ${
                    colorMode === 'fixed'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                      : 'bg-white/5 text-purple-300/60 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  Color Fijo
                </button>
                <button
                  onClick={() => setColorMode('variable')}
                  className={`flex-1 px-3 py-2 text-xs rounded-lg transition-all ${
                    colorMode === 'variable'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                      : 'bg-white/5 text-purple-300/60 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  Color Variable
                </button>
              </div>
            )}

            {/* Fixed color picker */}
            {colorMode === 'fixed' && (
              <div className="flex gap-2">
                <input
                  type="color"
                  value={(activeObject as IText)?.fill as string || '#000000'}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl cursor-pointer"
                />
                <input
                  type="text"
                  value={(activeObject as IText)?.fill as string || '#000000'}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="flex-1 px-3 py-2.5 text-sm bg-white/5 border border-white/10 rounded-xl text-white font-mono focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
                />
              </div>
            )}

            {/* Variable color selector */}
            {colorMode === 'variable' && demoTheme && (
              <div className="space-y-2">
                {(Object.keys(demoTheme) as ColorVariableName[]).map((colorVar) => {
                  const labels: Record<ColorVariableName, string> = {
                    principal1: 'Principal 1',
                    principal2: 'Principal 2',
                    secundario1: 'Secundario 1',
                    secundario2: 'Secundario 2',
                    secundario3: 'Secundario 3',
                  };
                  const isSelected = (activeObject as any)?.colorVariable === colorVar;
                  return (
                    <button
                      key={colorVar}
                      onClick={() => {
                        setSelectedColorVariable(colorVar);
                        applyTextColorVariable(colorVar);
                      }}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition-all ${
                        isSelected
                          ? 'bg-gradient-to-r from-purple-600/40 to-pink-600/40 border border-purple-400/50'
                          : 'bg-white/5 border border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <div
                        className="w-8 h-8 rounded border-2 border-white/20"
                        style={{ backgroundColor: demoTheme[colorVar] }}
                      />
                      <div className="flex-1 text-left">
                        <div className="text-xs font-medium text-white">{labels[colorVar]}</div>
                        <div className="text-xs text-purple-300/40 font-mono">{demoTheme[colorVar]}</div>
                      </div>
                      {isSelected && (
                        <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-purple-300/80 mb-2">
              Style
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleFontWeightChange(
                  (activeObject as IText)?.fontWeight === 'bold' ? 'normal' : 'bold'
                )}
                className={`px-4 py-3 text-sm rounded-xl font-bold transition-all ${
                  (activeObject as IText)?.fontWeight === 'bold'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30'
                    : 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10'
                }`}
              >
                Bold
              </button>

              <button
                onClick={() => handleFontStyleChange(
                  (activeObject as IText)?.fontStyle === 'italic' ? 'normal' : 'italic'
                )}
                className={`px-4 py-3 text-sm rounded-xl italic transition-all ${
                  (activeObject as IText)?.fontStyle === 'italic'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30'
                    : 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10'
                }`}
              >
                Italic
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedElement.type === 'image' && (
        <div className="space-y-4">
          {!showImageSearch ? (
            <>
              <div>
                <label className="block text-xs font-medium text-purple-300/80 mb-2">
                  Upload from Computer
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="flex flex-col items-center justify-center w-full px-4 py-6 border-2 border-dashed border-white/10 rounded-xl hover:border-purple-400/50 hover:bg-white/5 transition-all cursor-pointer group"
                >
                  <svg className="w-6 h-6 text-purple-300/40 group-hover:text-purple-300/60 transition-colors mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="text-sm text-purple-300/60 group-hover:text-purple-300/80 transition-colors">Upload Image</span>
                </label>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-slate-900 px-2 text-purple-300/40">or</span>
                </div>
              </div>

              <button
                onClick={() => setShowImageSearch(true)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-purple-400/50 transition-all group"
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5 text-purple-300/60 group-hover:text-purple-300/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span className="text-sm text-purple-300/60 group-hover:text-purple-300/80">Search Free Images</span>
                </div>
              </button>
            </>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowImageSearch(false)}
                  className="text-purple-300/60 hover:text-purple-300"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h3 className="text-sm font-medium text-purple-300/80">Search Images</h3>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchUnsplash(searchQuery)}
                  placeholder="apartment, house, office..."
                  className="flex-1 px-3 py-2 text-sm bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
                <button
                  onClick={() => searchUnsplash(searchQuery)}
                  disabled={isSearching}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm rounded-lg hover:from-purple-500 hover:to-pink-500 transition-all disabled:opacity-50"
                >
                  {isSearching ? '...' : 'Search'}
                </button>
              </div>

              {unsplashImages.length > 0 && (
                <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
                  {unsplashImages.map((img) => (
                    <button
                      key={img.id}
                      onClick={() => handleUnsplashImageSelect(img.urls.regular)}
                      className="relative aspect-square rounded-lg overflow-hidden border border-white/10 hover:border-purple-400/50 transition-all group"
                    >
                      <img
                        src={img.urls.small}
                        alt={img.alt_description || 'Image'}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                    </button>
                  ))}
                </div>
              )}

              {unsplashImages.length === 0 && !isSearching && (
                <div className="text-center py-8 text-purple-300/40 text-sm">
                  Search for images above
                </div>
              )}
            </div>
          )}

          <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3">
            <p className="text-xs text-purple-300/80">
              <span className="font-semibold">Tip:</span> Drag and resize the image directly on the canvas
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

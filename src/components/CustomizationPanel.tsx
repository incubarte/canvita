import { Canvas, FabricImage, IText } from 'fabric';
import { useState, useEffect } from 'react';
import type { CustomizableProperty, FontFamily } from '../types/template';
import type { ColorPalette } from '../types/user';
import { ImageSearchPanel } from './ImageSearchPanel';

interface CustomizationPanelProps {
  canvas: Canvas | null;
  userPalette?: ColorPalette;
  onUpdate?: () => void;
}

const fontFamilies: FontFamily[] = ['Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Courier New', 'Verdana'];

export const CustomizationPanel = ({ canvas, userPalette, onUpdate }: CustomizationPanelProps) => {
  // Todos los hooks deben estar al principio, antes de cualquier return
  const [selectedCustomElementIndex, setSelectedCustomElementIndex] = useState<number>(0);
  const [showImageSearch, setShowImageSearch] = useState(false);
  const [localTextValue, setLocalTextValue] = useState<string>('');

  // Obtener elementos customizables (después de los hooks, pero antes de los early returns)
  const customizableElements = canvas?.getObjects().filter(obj => (obj as any).isCustomizable === true) || [];
  const selectedElement = customizableElements[selectedCustomElementIndex] || customizableElements[0];
  const allowedProperties: CustomizableProperty[] = (selectedElement as any)?.allowedProperties || [];

  // Sincronizar el texto local cuando cambie el elemento seleccionado
  useEffect(() => {
    if (selectedElement && selectedElement.type === 'i-text') {
      setLocalTextValue((selectedElement as IText).text || '');
    }
  }, [selectedElement]);

  // Debounce: actualizar el canvas después de 2 segundos de inactividad
  useEffect(() => {
    if (!canvas) return;

    const timer = setTimeout(() => {
      if (selectedElement && selectedElement.type === 'i-text') {
        const currentText = (selectedElement as IText).text || '';
        // Solo actualizar si el texto realmente cambió
        if (currentText !== localTextValue) {
          (selectedElement as IText).set('text', localTextValue);
          canvas.requestRenderAll();
          onUpdate?.();
        }
      }
    }, 2000); // 2 segundos

    return () => clearTimeout(timer);
  }, [localTextValue, selectedElement, canvas, onUpdate]);

  // Early returns DESPUÉS de todos los hooks
  if (!canvas) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/10">
            <svg className="w-8 h-8 text-purple-300/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
            </svg>
          </div>
          <p className="text-sm text-purple-300/60">Cargando...</p>
        </div>
      </div>
    );
  }

  if (customizableElements.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/10">
            <svg className="w-8 h-8 text-purple-300/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
            </svg>
          </div>
          <p className="text-sm text-purple-300/60">Este template no tiene</p>
          <p className="text-sm text-purple-300/60">elementos customizables</p>
        </div>
      </div>
    );
  }

  // Handlers
  const handleTextChange = (value: string) => {
    // Actualizar estado local inmediatamente para una escritura fluida
    setLocalTextValue(value);
  };

  const handleTextBlur = () => {
    // Actualizar el canvas inmediatamente cuando pierde el foco
    if (selectedElement && selectedElement.type === 'i-text') {
      (selectedElement as IText).set('text', localTextValue);
      canvas.requestRenderAll();
      onUpdate?.();
    }
  };

  const handleColorChange = (value: string) => {
    if (selectedElement) {
      selectedElement.set('fill', value);
      canvas.requestRenderAll();
      onUpdate?.();
    }
  };

  const handleFontSizeChange = (value: number) => {
    if (selectedElement && selectedElement.type === 'i-text') {
      (selectedElement as IText).set('fontSize', value * 0.35);
      canvas.requestRenderAll();
      onUpdate?.();
    }
  };

  const handleFontFamilyChange = (value: FontFamily) => {
    if (selectedElement && selectedElement.type === 'i-text') {
      (selectedElement as IText).set('fontFamily', value);
      canvas.requestRenderAll();
      onUpdate?.();
    }
  };

  const handleFontWeightToggle = () => {
    if (selectedElement && selectedElement.type === 'i-text') {
      const current = (selectedElement as IText).fontWeight;
      (selectedElement as IText).set('fontWeight', current === 'bold' ? 'normal' : 'bold');
      canvas.requestRenderAll();
      onUpdate?.();
    }
  };

  const handleFontStyleToggle = () => {
    if (selectedElement && selectedElement.type === 'i-text') {
      const current = (selectedElement as IText).fontStyle;
      (selectedElement as IText).set('fontStyle', current === 'italic' ? 'normal' : 'italic');
      canvas.requestRenderAll();
      onUpdate?.();
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedElement || selectedElement.type !== 'image') return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const imgUrl = event.target?.result as string;
      await replaceImage(imgUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleImageFromSearch = async (imageUrl: string) => {
    await replaceImage(imageUrl);
    setShowImageSearch(false);
  };

  const replaceImage = async (imgUrl: string) => {
    if (!selectedElement || selectedElement.type !== 'image') return;

    try {
      const fabricImage = selectedElement as FabricImage;

      const currentLeft = fabricImage.left || 0;
      const currentTop = fabricImage.top || 0;
      const currentWidth = (fabricImage.width || 100) * (fabricImage.scaleX || 1);
      const currentHeight = (fabricImage.height || 100) * (fabricImage.scaleY || 1);

      const newImage = await FabricImage.fromURL(imgUrl, {
        crossOrigin: 'anonymous'
      });

      const newScaleX = currentWidth / (newImage.width || 1);
      const newScaleY = currentHeight / (newImage.height || 1);

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

  const handleSizeChange = (dimension: 'width' | 'height', value: number) => {
    if (!selectedElement) return;

    if (selectedElement.type === 'i-text') {
      // Para texto, size es fontSize
      handleFontSizeChange(value);
    } else {
      // Para otros elementos
      const actualValue = value * 0.35;
      if (dimension === 'width') {
        selectedElement.set('width', actualValue);
      } else {
        selectedElement.set('height', actualValue);
      }
      canvas.requestRenderAll();
      onUpdate?.();
    }
  };

  return (
    <div className="h-full overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
      <div className="mb-4">
        <h3 className="text-xs font-semibold text-purple-300/80 uppercase tracking-wider px-1 mb-3">
          Customización
        </h3>
        <p className="text-xs text-purple-300/40 px-1">
          Personaliza los elementos de tu diseño
        </p>
      </div>

      {/* Selector de elementos */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-purple-300/80 mb-2">
          Elemento a Editar
        </label>
        <div className="space-y-2">
          {customizableElements.map((obj, index) => {
            const objName = (obj as any).customizableName || 'Elemento sin nombre';
            const isSelected = selectedCustomElementIndex === index;

            return (
              <button
                key={`custom-element-${index}`}
                onClick={() => {
                  setSelectedCustomElementIndex(index);
                  canvas.setActiveObject(obj);
                  canvas.requestRenderAll();
                }}
                className={`w-full text-left p-3 rounded-xl transition-all flex items-center gap-3 ${
                  isSelected
                    ? 'bg-gradient-to-r from-purple-600/40 to-pink-600/40 border border-purple-400/50'
                    : 'bg-white/5 border border-white/10 hover:bg-white/10'
                }`}
              >
                <div className={`${isSelected ? 'text-purple-300' : 'text-purple-300/60'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-purple-300/80'}`}>
                    {objName}
                  </div>
                  <div className="text-xs text-purple-300/40 capitalize">
                    {obj.type}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Propiedades del elemento seleccionado */}
      {selectedElement && (
        <div className="space-y-4">
          <div className="h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent"></div>

          <h4 className="text-xs font-semibold text-purple-300/80 uppercase tracking-wider">
            Propiedades
          </h4>

          {/* Texto */}
          {allowedProperties.includes('text') && selectedElement.type === 'i-text' && (
            <div>
              <label className="block text-xs font-medium text-purple-300/80 mb-2">
                Texto
              </label>
              <textarea
                value={localTextValue}
                onChange={(e) => handleTextChange(e.target.value)}
                onBlur={handleTextBlur}
                className="w-full px-3 py-2.5 text-sm bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
                rows={3}
              />
            </div>
          )}

          {/* Color */}
          {allowedProperties.includes('color') && (
            <div>
              <label className="block text-xs font-medium text-purple-300/80 mb-2">
                Color
              </label>

              {/* Colores de la paleta del usuario */}
              {userPalette && (
                <div className="mb-3">
                  <label className="block text-xs text-purple-300/60 mb-2">Colores de tu Paleta</label>
                  <div className="grid grid-cols-5 gap-2">
                    {Object.entries(userPalette).map(([key, color]) => (
                      <button
                        key={key}
                        onClick={() => handleColorChange(color)}
                        className="group relative aspect-square rounded-lg overflow-hidden border-2 border-white/10 hover:border-purple-400/50 transition-all hover:scale-110"
                        style={{ backgroundColor: color }}
                        title={key}
                      >
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all"></div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Selector de color personalizado */}
              <div className="flex gap-2">
                <input
                  type="color"
                  value={selectedElement?.fill as string || '#000000'}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl cursor-pointer"
                />
                <input
                  type="text"
                  value={selectedElement?.fill as string || '#000000'}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="flex-1 px-3 py-2.5 text-sm bg-white/5 border border-white/10 rounded-xl text-white font-mono focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
              </div>
            </div>
          )}

          {/* Tamaño */}
          {allowedProperties.includes('size') && (
            <div>
              <label className="block text-xs font-medium text-purple-300/80 mb-2">
                {selectedElement.type === 'i-text' ? 'Tamaño de Fuente' : 'Tamaño'}
              </label>
              {selectedElement.type === 'i-text' ? (
                <input
                  type="number"
                  value={Math.round(((selectedElement as IText)?.fontSize || 16) / 0.35)}
                  onChange={(e) => handleFontSizeChange(Number(e.target.value))}
                  className="w-full px-3 py-2.5 text-sm bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  min={8}
                  max={200}
                />
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-purple-300/60 mb-1">Ancho</label>
                    <input
                      type="number"
                      value={Math.round((selectedElement?.width || 100) / 0.35)}
                      onChange={(e) => handleSizeChange('width', Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-purple-300/60 mb-1">Alto</label>
                    <input
                      type="number"
                      value={Math.round((selectedElement?.height || 100) / 0.35)}
                      onChange={(e) => handleSizeChange('height', Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tipo de Letra */}
          {allowedProperties.includes('fontFamily') && selectedElement.type === 'i-text' && (
            <div>
              <label className="block text-xs font-medium text-purple-300/80 mb-2">
                Tipo de Letra
              </label>
              <select
                value={(selectedElement as IText)?.fontFamily || 'Arial'}
                onChange={(e) => handleFontFamilyChange(e.target.value as FontFamily)}
                className="w-full px-3 py-2.5 text-sm bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              >
                {fontFamilies.map((font) => (
                  <option key={font} value={font} className="bg-slate-900">{font}</option>
                ))}
              </select>
            </div>
          )}

          {/* Negrita e Itálica */}
          {(allowedProperties.includes('fontWeight') || allowedProperties.includes('fontStyle')) && selectedElement.type === 'i-text' && (
            <div>
              <label className="block text-xs font-medium text-purple-300/80 mb-2">
                Estilo
              </label>
              <div className="grid grid-cols-2 gap-2">
                {allowedProperties.includes('fontWeight') && (
                  <button
                    onClick={handleFontWeightToggle}
                    className={`px-4 py-3 text-sm rounded-xl font-bold transition-all ${
                      (selectedElement as IText)?.fontWeight === 'bold'
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                        : 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10'
                    }`}
                  >
                    Negrita
                  </button>
                )}
                {allowedProperties.includes('fontStyle') && (
                  <button
                    onClick={handleFontStyleToggle}
                    className={`px-4 py-3 text-sm rounded-xl italic transition-all ${
                      (selectedElement as IText)?.fontStyle === 'italic'
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                        : 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10'
                    }`}
                  >
                    Itálica
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Cambiar Imagen */}
          {allowedProperties.includes('image') && selectedElement.type === 'image' && (
            <div>
              <label className="block text-xs font-medium text-purple-300/80 mb-2">
                Cambiar Imagen
              </label>

              {!showImageSearch ? (
                <>
                  {/* Botones de opciones */}
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="custom-image-upload"
                    />
                    <label
                      htmlFor="custom-image-upload"
                      className="flex flex-col items-center justify-center px-4 py-4 border border-white/10 rounded-xl hover:border-purple-400/50 hover:bg-white/5 transition-all cursor-pointer group"
                    >
                      <svg className="w-5 h-5 text-purple-300/40 group-hover:text-purple-300/60 transition-colors mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <span className="text-xs text-purple-300/60 group-hover:text-purple-300/80 transition-colors">Subir</span>
                    </label>

                    <button
                      onClick={() => setShowImageSearch(true)}
                      className="flex flex-col items-center justify-center px-4 py-4 border border-white/10 rounded-xl hover:border-purple-400/50 hover:bg-white/5 transition-all group"
                    >
                      <svg className="w-5 h-5 text-purple-300/40 group-hover:text-purple-300/60 transition-colors mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <span className="text-xs text-purple-300/60 group-hover:text-purple-300/80 transition-colors">Buscar</span>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Botón para volver */}
                  <button
                    onClick={() => setShowImageSearch(false)}
                    className="flex items-center gap-2 mb-3 text-xs text-purple-300/60 hover:text-purple-300 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Volver
                  </button>

                  {/* Panel de búsqueda integrado */}
                  <div className="border border-white/10 rounded-xl overflow-hidden">
                    <ImageSearchPanel
                      onImageSelect={handleImageFromSearch}
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

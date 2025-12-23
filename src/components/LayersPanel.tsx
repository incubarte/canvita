import { useState, useEffect } from 'react';
import { Canvas, FabricObject } from 'fabric';

interface LayersPanelProps {
  canvas: Canvas | null;
  onSelectElement?: (obj: FabricObject) => void;
}

export const LayersPanel = ({ canvas, onSelectElement }: LayersPanelProps) => {
  const [objects, setObjects] = useState<FabricObject[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!canvas) return;

    const updateLayers = () => {
      const allObjects = canvas.getObjects();
      setObjects([...allObjects].reverse()); // Reverso para mostrar los de arriba primero
    };

    // Actualizar lista cuando cambian los objetos
    const handleObjectAdded = () => updateLayers();
    const handleObjectRemoved = () => updateLayers();
    const handleObjectModified = () => updateLayers();
    const handleSelectionCreated = (e: any) => {
      const activeObj = e.selected?.[0];
      if (activeObj) {
        setSelectedId(activeObj.id || null);
      }
    };
    const handleSelectionUpdated = (e: any) => {
      const activeObj = e.selected?.[0];
      if (activeObj) {
        setSelectedId(activeObj.id || null);
      }
    };
    const handleSelectionCleared = () => {
      setSelectedId(null);
    };

    canvas.on('object:added', handleObjectAdded);
    canvas.on('object:removed', handleObjectRemoved);
    canvas.on('object:modified', handleObjectModified);
    canvas.on('selection:created', handleSelectionCreated);
    canvas.on('selection:updated', handleSelectionUpdated);
    canvas.on('selection:cleared', handleSelectionCleared);

    updateLayers();

    return () => {
      canvas.off('object:added', handleObjectAdded);
      canvas.off('object:removed', handleObjectRemoved);
      canvas.off('object:modified', handleObjectModified);
      canvas.off('selection:created', handleSelectionCreated);
      canvas.off('selection:updated', handleSelectionUpdated);
      canvas.off('selection:cleared', handleSelectionCleared);
    };
  }, [canvas]);

  const handleSelectLayer = (obj: FabricObject) => {
    if (!canvas) return;
    canvas.setActiveObject(obj);
    canvas.requestRenderAll();
    setSelectedId((obj as any).id || null);
    onSelectElement?.(obj);
  };

  const getLayerName = (obj: any): string => {
    // Intentar obtener nombre de data
    if (obj.data?.id) {
      return obj.data.id;
    }

    // Basado en tipo
    if (obj.type === 'i-text' || obj.type === 'text') {
      const text = obj.text || 'Texto';
      return text.length > 20 ? text.substring(0, 20) + '...' : text;
    } else if (obj.type === 'image') {
      return 'Imagen';
    } else if (obj.type === 'rect') {
      return 'Rectángulo';
    } else if (obj.type === 'circle') {
      return 'Círculo';
    }

    return obj.type || 'Elemento';
  };

  const getLayerIcon = (obj: any) => {
    if (obj.type === 'i-text' || obj.type === 'text') {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
        </svg>
      );
    } else if (obj.type === 'image') {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    } else if (obj.type === 'rect' || obj.type === 'circle') {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V7a4 4 0 014-4h10a4 4 0 014 4v10a4 4 0 01-4 4H7z" />
        </svg>
      );
    }

    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
      </svg>
    );
  };

  if (!canvas) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/10">
            <svg className="w-8 h-8 text-purple-300/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
          </div>
          <p className="text-sm text-purple-300/60">No layers yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
      <div className="mb-3">
        <h3 className="text-xs font-semibold text-purple-300/80 uppercase tracking-wider px-1">
          Capas ({objects.length})
        </h3>
        <p className="text-xs text-purple-300/40 px-1 mt-1">
          Click para seleccionar
        </p>
      </div>

      {objects.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-purple-300/40">No hay elementos</p>
        </div>
      ) : (
        <div className="space-y-1">
          {objects.map((obj, index) => {
            const isSelected = selectedId && (obj as any).id === selectedId;
            const isEditable = obj.selectable !== false;

            return (
              <button
                key={(obj as any).id || `layer-${index}`}
                onClick={() => isEditable && handleSelectLayer(obj)}
                disabled={!isEditable}
                className={`w-full text-left p-3 rounded-xl transition-all flex items-center gap-3 ${
                  isSelected
                    ? 'bg-gradient-to-r from-purple-600/40 to-pink-600/40 border border-purple-400/50 shadow-lg'
                    : isEditable
                    ? 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-purple-400/30'
                    : 'bg-white/5 border border-white/5 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className={`${isSelected ? 'text-purple-300' : 'text-purple-300/60'}`}>
                  {getLayerIcon(obj)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium truncate ${
                    isSelected ? 'text-white' : 'text-purple-300/80'
                  }`}>
                    {getLayerName(obj)}
                  </div>
                  <div className="text-xs text-purple-300/40 capitalize">
                    {obj.type}
                  </div>
                </div>
                {!isEditable && (
                  <svg className="w-4 h-4 text-purple-300/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

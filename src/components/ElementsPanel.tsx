import { useState } from 'react';
import { Canvas, IText, FabricImage, Rect, Circle } from 'fabric';
import { ImageSearchPanel } from './ImageSearchPanel';

interface ElementsPanelProps {
  canvas: Canvas | null;
}

export const ElementsPanel = ({ canvas }: ElementsPanelProps) => {
  const SCALE = 0.35;
  const [imageMenuOpen, setImageMenuOpen] = useState(false);
  const [showImageSearch, setShowImageSearch] = useState(false);

  // Generar posición aleatoria cerca del centro
  const getRandomPosition = (canvasSize: number) => {
    const center = canvasSize / 2;
    const offset = canvasSize * 0.15; // 15% del tamaño del canvas
    const randomOffset = (Math.random() - 0.5) * offset * 2;
    return center + randomOffset;
  };

  // Generar color aleatorio vibrante
  const getRandomColor = () => {
    const colors = [
      '#667eea', '#764ba2', '#f093fb', '#f5576c',
      '#4facfe', '#00f2fe', '#43e97b', '#38f9d7',
      '#fa709a', '#fee140', '#30cfd0', '#330867',
      '#a8edea', '#fed6e3', '#ff9a9e', '#fecfef',
      '#ffecd2', '#fcb69f', '#ff6e7f', '#bfe9ff',
      '#c471f5', '#fa71cd', '#f6d365', '#fda085',
      '#a18cd1', '#fbc2eb', '#fdcbf1', '#e6dee9',
      '#96fbc4', '#f9f586', '#89f7fe', '#66a6ff',
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const addText = () => {
    if (!canvas) return;

    const text = new IText('Texto nuevo', {
      left: getRandomPosition(canvas.width || 400),
      top: getRandomPosition(canvas.height || 400),
      fontSize: 48 * SCALE,
      fontFamily: 'Arial',
      fill: '#000000',
      fontWeight: 'normal',
      fontStyle: 'normal',
      textAlign: 'center',
      originX: 'center',
      originY: 'center',
    });

    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.requestRenderAll();
  };

  const uploadImageFromPC = async () => {
    if (!canvas) return;

    // Crear un input file temporal
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
        const imgUrl = event.target?.result as string;
        try {
          const img = await FabricImage.fromURL(imgUrl, {
            crossOrigin: 'anonymous'
          });

          img.set({
            left: getRandomPosition(canvas.width || 400),
            top: getRandomPosition(canvas.height || 400),
            scaleX: (300 / (img.width || 1)) * SCALE,
            scaleY: (300 / (img.height || 1)) * SCALE,
            originX: 'center',
            originY: 'center',
          });

          canvas.add(img);
          canvas.setActiveObject(img);
          canvas.requestRenderAll();
          setImageMenuOpen(false);
        } catch (error) {
          console.error('Error loading image:', error);
        }
      };
      reader.readAsDataURL(file);
    };

    input.click();
  };

  const handleImageSelect = async (imageUrl: string) => {
    if (!canvas) return;

    try {
      const img = await FabricImage.fromURL(imageUrl, {
        crossOrigin: 'anonymous'
      });

      img.set({
        left: getRandomPosition(canvas.width || 400),
        top: getRandomPosition(canvas.height || 400),
        scaleX: (300 / (img.width || 1)) * SCALE,
        scaleY: (300 / (img.height || 1)) * SCALE,
        originX: 'center',
        originY: 'center',
      });

      canvas.add(img);
      canvas.setActiveObject(img);
      canvas.requestRenderAll();
      setShowImageSearch(false);
      setImageMenuOpen(false);
    } catch (error) {
      console.error('Error loading image:', error);
    }
  };

  const addRectangle = () => {
    if (!canvas) return;

    const rect = new Rect({
      left: getRandomPosition(canvas.width || 400),
      top: getRandomPosition(canvas.height || 400),
      width: 300 * SCALE,
      height: 200 * SCALE,
      fill: getRandomColor(),
      stroke: getRandomColor(),
      strokeWidth: 0,
      originX: 'center',
      originY: 'center',
    });

    canvas.add(rect);
    canvas.setActiveObject(rect);
    canvas.requestRenderAll();
  };

  const addCircle = () => {
    if (!canvas) return;

    const circle = new Circle({
      left: getRandomPosition(canvas.width || 400),
      top: getRandomPosition(canvas.height || 400),
      radius: 100 * SCALE,
      fill: getRandomColor(),
      stroke: getRandomColor(),
      strokeWidth: 0,
      originX: 'center',
      originY: 'center',
    });

    canvas.add(circle);
    canvas.setActiveObject(circle);
    canvas.requestRenderAll();
  };

  if (!canvas) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/10">
            <svg className="w-8 h-8 text-purple-300/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <p className="text-sm text-purple-300/60">Canvas no disponible</p>
        </div>
      </div>
    );
  }

  // Si está mostrando el buscador de imágenes
  if (showImageSearch) {
    return (
      <div className="h-full flex flex-col">
        {/* Header con botón atrás */}
        <div className="p-4 border-b border-white/10">
          <button
            onClick={() => setShowImageSearch(false)}
            className="flex items-center gap-2 text-purple-300 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-medium">Atrás</span>
          </button>
        </div>
        {/* Buscador de imágenes */}
        <div className="flex-1 overflow-hidden">
          <ImageSearchPanel onImageSelect={handleImageSelect} />
        </div>
      </div>
    );
  }

  // Si está mostrando el menú de opciones de imagen
  if (imageMenuOpen) {
    return (
      <div className="h-full flex flex-col p-4">
        {/* Header con botón atrás */}
        <div className="mb-4">
          <button
            onClick={() => setImageMenuOpen(false)}
            className="flex items-center gap-2 text-purple-300 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-medium">Atrás</span>
          </button>
        </div>

        {/* Opciones de imagen */}
        <div className="space-y-3">
          <div>
            <h3 className="text-xs font-semibold text-purple-300/80 uppercase tracking-wider px-1 mb-3">
              Insertar Imagen
            </h3>
          </div>

          {/* Subir desde PC */}
          <button
            onClick={uploadImageFromPC}
            className="w-full p-4 bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border border-blue-400/30 rounded-xl hover:from-blue-600/30 hover:to-cyan-600/30 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center group-hover:bg-white/20 transition-colors">
                <svg className="w-6 h-6 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>
              <div className="flex-1 text-left">
                <div className="text-sm font-medium text-white">Subir desde PC</div>
                <div className="text-xs text-blue-300/60">Desde tu computadora</div>
              </div>
            </div>
          </button>

          {/* Buscar en banco de imágenes */}
          <button
            onClick={() => setShowImageSearch(true)}
            className="w-full p-4 bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-400/30 rounded-xl hover:from-purple-600/30 hover:to-pink-600/30 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center group-hover:bg-white/20 transition-colors">
                <svg className="w-6 h-6 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div className="flex-1 text-left">
                <div className="text-sm font-medium text-white">Buscar Imagen</div>
                <div className="text-xs text-purple-300/60">Banco de imágenes</div>
              </div>
            </div>
          </button>
        </div>
      </div>
    );
  }

  // Menú principal
  return (
    <div className="h-full overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
      <div className="mb-4">
        <h3 className="text-xs font-semibold text-purple-300/80 uppercase tracking-wider px-1 mb-1">
          Agregar Elementos
        </h3>
        <p className="text-xs text-purple-300/40 px-1">
          Click para agregar al canvas
        </p>
      </div>

      <div className="space-y-3">
        {/* Texto */}
        <div>
          <label className="block text-xs font-medium text-purple-300/80 mb-2 px-1">
            Texto
          </label>
          <button
            onClick={addText}
            className="w-full p-4 bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-400/30 rounded-xl hover:from-purple-600/30 hover:to-pink-600/30 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center group-hover:bg-white/20 transition-colors">
                <svg className="w-6 h-6 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
              </div>
              <div className="flex-1 text-left">
                <div className="text-sm font-medium text-white">Agregar Texto</div>
                <div className="text-xs text-purple-300/60">Texto editable</div>
              </div>
              <svg className="w-5 h-5 text-purple-300/40 group-hover:text-purple-300/80 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
          </button>
        </div>

        {/* Imagen */}
        <div>
          <label className="block text-xs font-medium text-purple-300/80 mb-2 px-1">
            Imagen
          </label>
          <button
            onClick={() => setImageMenuOpen(true)}
            className="w-full p-4 bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border border-blue-400/30 rounded-xl hover:from-blue-600/30 hover:to-cyan-600/30 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center group-hover:bg-white/20 transition-colors">
                <svg className="w-6 h-6 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1 text-left">
                <div className="text-sm font-medium text-white">Insertar Imagen</div>
                <div className="text-xs text-blue-300/60">Banco o desde PC</div>
              </div>
              <svg className="w-5 h-5 text-blue-300/40 group-hover:text-blue-300/80 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        </div>

        {/* Formas */}
        <div>
          <label className="block text-xs font-medium text-purple-300/80 mb-2 px-1">
            Formas
          </label>
          <div className="space-y-2">
            <button
              onClick={addRectangle}
              className="w-full p-3 bg-gradient-to-br from-pink-600/20 to-orange-600/20 border border-pink-400/30 rounded-xl hover:from-pink-600/30 hover:to-orange-600/30 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center group-hover:bg-white/20 transition-colors">
                  <svg className="w-5 h-5 text-pink-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium text-white">Rectángulo</div>
                </div>
                <svg className="w-4 h-4 text-pink-300/40 group-hover:text-pink-300/80 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
            </button>

            <button
              onClick={addCircle}
              className="w-full p-3 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-indigo-400/30 rounded-xl hover:from-indigo-600/30 hover:to-purple-600/30 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center group-hover:bg-white/20 transition-colors">
                  <svg className="w-5 h-5 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" strokeWidth={2} />
                  </svg>
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium text-white">Círculo</div>
                </div>
                <svg className="w-4 h-4 text-indigo-300/40 group-hover:text-indigo-300/80 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

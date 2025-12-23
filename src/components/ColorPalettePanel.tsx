import { useState, useEffect } from 'react';
import type { ColorPalette } from '../types/user';

interface ColorPalettePanelProps {
  initialPalette?: ColorPalette;
  onSave: (palette: ColorPalette) => void;
}

const defaultPalette: ColorPalette = {
  principal1: '#667eea',
  principal2: '#764ba2',
  secundario1: '#f093fb',
  secundario2: '#4facfe',
  secundario3: '#43e97b',
};

const colorLabels = {
  principal1: 'Principal 1',
  principal2: 'Principal 2',
  secundario1: 'Secundario 1',
  secundario2: 'Secundario 2',
  secundario3: 'Secundario 3',
};

export const ColorPalettePanel = ({ initialPalette, onSave }: ColorPalettePanelProps) => {
  const [palette, setPalette] = useState<ColorPalette>(initialPalette || defaultPalette);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (initialPalette) {
      setPalette(initialPalette);
    }
  }, [initialPalette]);

  const handleColorChange = (key: keyof ColorPalette, value: string) => {
    setPalette(prev => ({
      ...prev,
      [key]: value
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    onSave(palette);
    setHasChanges(false);
  };

  const handleReset = () => {
    setPalette(defaultPalette);
    setHasChanges(true);
  };

  return (
    <div className="h-full overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h3 className="text-xs font-semibold text-purple-300/80 uppercase tracking-wider px-1 mb-1">
            Tu Paleta de Colores
          </h3>
          <p className="text-xs text-purple-300/40 px-1">
            Define tus colores corporativos para usarlos en todos tus diseños
          </p>
        </div>

        {/* Color Pickers */}
        <div className="space-y-3">
          {(Object.keys(palette) as Array<keyof ColorPalette>).map((key) => (
            <div key={key} className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl">
              <div className="flex-shrink-0">
                <div className="relative">
                  <input
                    type="color"
                    value={palette[key]}
                    onChange={(e) => handleColorChange(key, e.target.value)}
                    className="w-12 h-12 rounded-lg cursor-pointer border-2 border-white/20"
                    style={{ backgroundColor: palette[key] }}
                  />
                </div>
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-white mb-1">
                  {colorLabels[key]}
                </div>
                <div className="text-xs text-purple-300/60 font-mono">
                  {palette[key].toUpperCase()}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleReset}
            className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 text-white text-sm font-medium rounded-xl hover:bg-white/10 transition-all"
          >
            Restaurar Defaults
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className={`flex-1 px-4 py-2.5 text-white text-sm font-medium rounded-xl transition-all ${
              hasChanges
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-lg'
                : 'bg-white/5 border border-white/10 opacity-50 cursor-not-allowed'
            }`}
          >
            Guardar Paleta
          </button>
        </div>

        {/* Preview */}
        <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
          <div className="text-xs font-semibold text-purple-300/80 uppercase tracking-wider mb-3">
            Vista Previa
          </div>
          <div className="flex gap-2">
            {(Object.keys(palette) as Array<keyof ColorPalette>).map((key) => (
              <div
                key={key}
                className="flex-1 h-16 rounded-lg shadow-lg transition-transform hover:scale-105"
                style={{ backgroundColor: palette[key] }}
                title={colorLabels[key]}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

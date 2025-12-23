import { useState } from 'react';
import type { BusinessCategory, TemplateStyle } from '../types/template';
import type { ColorPalette } from '../types/user';

interface TemplateInfoPanelProps {
  onInfoChange: (info: TemplateInfo) => void;
  initialInfo?: TemplateInfo;
}

export interface TemplateInfo {
  name: string;
  description: string;
  businessCategory: BusinessCategory | null;
  style: TemplateStyle | null;
  demoTheme: ColorPalette;
}

const businessCategories: Array<{ value: BusinessCategory; label: string; icon: string }> = [
  { value: 'inmobiliaria', label: 'Inmobiliaria', icon: '🏠' },
  { value: 'comida', label: 'Comida', icon: '🍽️' },
  { value: 'ropa', label: 'Ropa', icon: '👔' },
  { value: 'generico', label: 'Genérico', icon: '✨' },
];

const templateStyles: Array<{ value: TemplateStyle; label: string; dimensions: string }> = [
  { value: 'post', label: 'Post', dimensions: '1080×1080' },
  { value: 'historia', label: 'Historia', dimensions: '1080×1920' },
  { value: 'imagen', label: 'Imagen', dimensions: '1920×1080' },
];

const defaultTheme: ColorPalette = {
  principal1: '#667eea',
  principal2: '#764ba2',
  secundario1: '#f093fb',
  secundario2: '#4facfe',
  secundario3: '#43e97b',
};

export const TemplateInfoPanel = ({ onInfoChange, initialInfo }: TemplateInfoPanelProps) => {
  const [name, setName] = useState(initialInfo?.name || '');
  const [description, setDescription] = useState(initialInfo?.description || '');
  const [businessCategory, setBusinessCategory] = useState<BusinessCategory | null>(
    initialInfo?.businessCategory || null
  );
  const [style, setStyle] = useState<TemplateStyle | null>(initialInfo?.style || null);
  const [demoTheme, setDemoTheme] = useState<ColorPalette>(initialInfo?.demoTheme || defaultTheme);

  const handleChange = (updates: Partial<TemplateInfo>) => {
    const newInfo: TemplateInfo = {
      name: updates.name !== undefined ? updates.name : name,
      description: updates.description !== undefined ? updates.description : description,
      businessCategory: updates.businessCategory !== undefined ? updates.businessCategory : businessCategory,
      style: updates.style !== undefined ? updates.style : style,
      demoTheme: updates.demoTheme !== undefined ? updates.demoTheme : demoTheme,
    };

    onInfoChange(newInfo);
  };

  const handleNameChange = (value: string) => {
    setName(value);
    handleChange({ name: value });
  };

  const handleDescriptionChange = (value: string) => {
    setDescription(value);
    handleChange({ description: value });
  };

  const handleBusinessCategoryChange = (value: BusinessCategory | null) => {
    setBusinessCategory(value);
    handleChange({ businessCategory: value });
  };

  const handleStyleChange = (value: TemplateStyle | null) => {
    setStyle(value);
    handleChange({ style: value });
  };

  const handleThemeColorChange = (colorKey: keyof ColorPalette, value: string) => {
    const newTheme = { ...demoTheme, [colorKey]: value };
    setDemoTheme(newTheme);
    handleChange({ demoTheme: newTheme });
  };

  const isComplete = name.trim() !== '' && businessCategory !== null && style !== null;

  return (
    <div className="h-full overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h3 className="text-xs font-semibold text-purple-300/80 uppercase tracking-wider px-1 mb-1">
            Información del Template
          </h3>
          <p className="text-xs text-purple-300/40 px-1">
            Completa todos los campos para poder guardar
          </p>
        </div>

        {/* Estado de completitud */}
        {!isComplete && (
          <div className="px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-xl">
            <p className="text-xs text-amber-300 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Faltan campos requeridos
            </p>
          </div>
        )}

        {isComplete && (
          <div className="px-3 py-2 bg-green-500/10 border border-green-500/30 rounded-xl">
            <p className="text-xs text-green-300 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              ¡Listo para guardar!
            </p>
          </div>
        )}

        {/* Nombre del Template */}
        <div>
          <label className="block text-sm font-medium text-purple-300/80 mb-2">
            Nombre del Template *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Ej: Post Instagram Propiedades"
            className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-purple-300/30 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-transparent transition-all"
          />
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-sm font-medium text-purple-300/80 mb-2">
            Descripción (opcional)
          </label>
          <textarea
            value={description}
            onChange={(e) => handleDescriptionChange(e.target.value)}
            placeholder="Describe brevemente este template..."
            rows={3}
            className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-purple-300/30 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-transparent transition-all resize-none"
          />
        </div>

        {/* Rubro */}
        <div>
          <label className="block text-sm font-medium text-purple-300/80 mb-2">
            Rubro *
          </label>
          <div className="space-y-2">
            {businessCategories.map((category) => (
              <button
                key={category.value}
                onClick={() => handleBusinessCategoryChange(category.value)}
                className={`w-full px-3 py-2.5 rounded-xl text-left transition-all ${
                  businessCategory === category.value
                    ? 'bg-gradient-to-r from-amber-600/40 to-orange-600/40 border border-amber-400/50 shadow-lg'
                    : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-amber-400/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{category.icon}</span>
                  <span className={`text-sm font-medium ${
                    businessCategory === category.value ? 'text-white' : 'text-purple-300/80'
                  }`}>
                    {category.label}
                  </span>
                  {businessCategory === category.value && (
                    <svg className="w-4 h-4 text-amber-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Estilo */}
        <div>
          <label className="block text-sm font-medium text-purple-300/80 mb-2">
            Estilo *
          </label>
          <div className="space-y-2">
            {templateStyles.map((styleOption) => (
              <button
                key={styleOption.value}
                onClick={() => handleStyleChange(styleOption.value)}
                className={`w-full px-3 py-2.5 rounded-xl text-left transition-all ${
                  style === styleOption.value
                    ? 'bg-gradient-to-r from-amber-600/40 to-orange-600/40 border border-amber-400/50 shadow-lg'
                    : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-amber-400/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className={`text-sm font-medium mb-0.5 ${
                      style === styleOption.value ? 'text-white' : 'text-purple-300/80'
                    }`}>
                      {styleOption.label}
                    </div>
                    <div className="text-xs text-purple-300/40 font-mono">
                      {styleOption.dimensions}
                    </div>
                  </div>
                  {style === styleOption.value && (
                    <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Theme Demo */}
        <div>
          <label className="block text-sm font-medium text-purple-300/80 mb-2">
            Theme de Demostración
          </label>
          <p className="text-xs text-purple-300/40 mb-3">
            Define los colores de ejemplo. Los clientes verán el template con sus propios colores.
          </p>
          <div className="space-y-2">
            {(Object.keys(demoTheme) as Array<keyof ColorPalette>).map((key) => {
              const labels = {
                principal1: 'Principal 1',
                principal2: 'Principal 2',
                secundario1: 'Secundario 1',
                secundario2: 'Secundario 2',
                secundario3: 'Secundario 3',
              };
              return (
                <div key={key} className="flex items-center gap-3 p-2 bg-white/5 border border-white/10 rounded-lg">
                  <input
                    type="color"
                    value={demoTheme[key]}
                    onChange={(e) => handleThemeColorChange(key, e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer border-2 border-white/20"
                  />
                  <div className="flex-1">
                    <div className="text-xs font-medium text-white">{labels[key]}</div>
                    <div className="text-xs text-purple-300/40 font-mono">{demoTheme[key]}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

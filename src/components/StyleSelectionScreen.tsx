import type { TemplateStyle, BusinessCategory } from '../types/template';

interface StyleSelectionScreenProps {
  businessCategory: BusinessCategory;
  onSelectStyle: (style: TemplateStyle) => void;
  onBack: () => void;
}

const styles: Array<{
  id: TemplateStyle;
  name: string;
  description: string;
  icon: React.ReactNode;
  dimensions: string;
}> = [
  {
    id: 'post',
    name: 'Post',
    description: 'Formato cuadrado para feeds de redes sociales',
    dimensions: '1080 × 1080',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <rect x="4" y="4" width="16" height="16" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'historia',
    name: 'Historia',
    description: 'Formato vertical para stories e historias',
    dimensions: '1080 × 1920',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <rect x="7" y="2" width="10" height="20" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'imagen',
    name: 'Imagen',
    description: 'Formato horizontal para banners y portadas',
    dimensions: '1920 × 1080',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <rect x="2" y="7" width="20" height="10" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

const categoryNames: Record<BusinessCategory, string> = {
  inmobiliaria: 'Inmobiliaria',
  comida: 'Comida',
  ropa: 'Ropa',
  generico: 'Genérico',
};

export const StyleSelectionScreen = ({ businessCategory, onSelectStyle, onBack }: StyleSelectionScreenProps) => {
  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-xl border-b border-white/10 flex-shrink-0">
        <div className="px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors"
            >
              <svg className="w-5 h-5 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Selecciona el Estilo
              </h1>
              <p className="text-xs text-purple-300/60">
                {categoryNames[businessCategory]} • Elige el formato que necesitas
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex items-center justify-center p-8">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-3">
              ¿Qué formato necesitas?
            </h2>
            <p className="text-purple-300/80">
              Selecciona el tipo de contenido que vas a crear
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {styles.map((style) => (
              <button
                key={style.id}
                onClick={() => onSelectStyle(style.id)}
                className="group relative p-6 bg-white/5 border border-white/10 rounded-2xl hover:border-purple-400/50 hover:bg-white/10 transition-all"
              >
                {/* Gradient background on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-pink-600 opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity"></div>

                {/* Content */}
                <div className="relative flex flex-col items-center text-center">
                  {/* Icon */}
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center text-white shadow-lg mb-4">
                    {style.icon}
                  </div>

                  {/* Text */}
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">
                    {style.name}
                  </h3>
                  <p className="text-sm text-purple-300/60 group-hover:text-purple-300/80 transition-colors mb-3">
                    {style.description}
                  </p>
                  <div className="text-xs text-purple-400/80 font-mono bg-white/5 px-3 py-1 rounded-lg">
                    {style.dimensions}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

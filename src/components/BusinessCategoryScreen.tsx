import type { BusinessCategory } from '../types/template';

interface BusinessCategoryScreenProps {
  onSelectCategory: (category: BusinessCategory) => void;
  onCancel: () => void;
}

const categories: Array<{
  id: BusinessCategory;
  name: string;
  description: string;
  icon: string;
  gradient: string;
}> = [
  {
    id: 'inmobiliaria',
    name: 'Inmobiliaria',
    description: 'Templates para propiedades y bienes raíces',
    icon: '🏠',
    gradient: 'from-blue-600 to-cyan-600',
  },
  {
    id: 'comida',
    name: 'Comida',
    description: 'Templates para restaurantes y gastronomía',
    icon: '🍽️',
    gradient: 'from-orange-600 to-red-600',
  },
  {
    id: 'ropa',
    name: 'Ropa',
    description: 'Templates para moda y tiendas de ropa',
    icon: '👔',
    gradient: 'from-purple-600 to-pink-600',
  },
  {
    id: 'generico',
    name: 'Genérico',
    description: 'Templates para cualquier tipo de negocio',
    icon: '✨',
    gradient: 'from-indigo-600 to-purple-600',
  },
];

export const BusinessCategoryScreen = ({ onSelectCategory, onCancel }: BusinessCategoryScreenProps) => {
  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-xl border-b border-white/10 flex-shrink-0">
        <div className="px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={onCancel}
              className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors"
            >
              <svg className="w-5 h-5 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Selecciona tu Rubro
              </h1>
              <p className="text-xs text-purple-300/60">Elige la categoría de tu negocio</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex items-center justify-center p-8">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-3">
              ¿Qué tipo de contenido vas a crear?
            </h2>
            <p className="text-purple-300/80">
              Selecciona el rubro que mejor se adapte a tu negocio
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => onSelectCategory(category.id)}
                className="group relative p-8 bg-white/5 border border-white/10 rounded-2xl hover:border-purple-400/50 hover:bg-white/10 transition-all"
              >
                {/* Gradient background on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${category.gradient} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity`}></div>

                {/* Content */}
                <div className="relative">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`w-16 h-16 bg-gradient-to-br ${category.gradient} rounded-2xl flex items-center justify-center text-3xl shadow-lg flex-shrink-0`}>
                      {category.icon}
                    </div>

                    {/* Text */}
                    <div className="flex-1 text-left">
                      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">
                        {category.name}
                      </h3>
                      <p className="text-sm text-purple-300/60 group-hover:text-purple-300/80 transition-colors">
                        {category.description}
                      </p>
                    </div>

                    {/* Arrow */}
                    <svg
                      className="w-6 h-6 text-purple-300/40 group-hover:text-purple-300 group-hover:translate-x-1 transition-all flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
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

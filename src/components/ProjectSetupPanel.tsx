import { useState } from 'react';
import type { BusinessCategory, TemplateStyle, CategorizedTemplate } from '../types/template';

interface ProjectSetupPanelProps {
  templates: CategorizedTemplate[];
  onComplete: (template: CategorizedTemplate) => void;
  onTemplatePreview?: (template: CategorizedTemplate | null) => void;
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

type Step = 'rubro' | 'estilo' | 'template';

export const ProjectSetupPanel = ({ templates, onComplete, onTemplatePreview }: ProjectSetupPanelProps) => {
  const [step, setStep] = useState<Step>('rubro');
  const [selectedRubro, setSelectedRubro] = useState<BusinessCategory | null>(null);
  const [selectedEstilo, setSelectedEstilo] = useState<TemplateStyle | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<CategorizedTemplate | null>(null);

  // Filtrar templates por rubro y estilo
  const getFilteredTemplates = (): CategorizedTemplate[] => {
    if (!selectedEstilo) return templates;

    return templates.filter(t => {
      // Si el template tiene businessCategory y style definidos
      if (t.businessCategory && t.style) {
        return t.businessCategory === selectedRubro && t.style === selectedEstilo;
      }

      // Templates base - inferir estilo por dimensiones
      const { width, height } = t.canvas;
      let inferredStyle: TemplateStyle;

      if (width === height) {
        inferredStyle = 'post';
      } else if (height > width) {
        inferredStyle = 'historia';
      } else {
        inferredStyle = 'imagen';
      }

      // Si no tiene businessCategory, asumimos que es genérico
      const inferredRubro = t.businessCategory || 'generico';

      return inferredRubro === selectedRubro && inferredStyle === selectedEstilo;
    });
  };

  const handleRubroSelect = (rubro: BusinessCategory) => {
    setSelectedRubro(rubro);
    setStep('estilo');
  };

  const handleEstiloSelect = (estilo: TemplateStyle) => {
    setSelectedEstilo(estilo);
    setStep('template');
  };

  const handleTemplateSelect = (template: CategorizedTemplate) => {
    setSelectedTemplate(template);
    // Notificar al padre para mostrar preview
    if (onTemplatePreview) {
      onTemplatePreview(template);
    }
  };

  const handleContinue = () => {
    if (selectedTemplate) {
      onComplete(selectedTemplate);
    }
  };

  const handleBack = () => {
    if (step === 'template') {
      setStep('estilo');
      setSelectedTemplate(null);
      // Limpiar preview
      if (onTemplatePreview) {
        onTemplatePreview(null);
      }
    } else if (step === 'estilo') {
      setStep('rubro');
      setSelectedEstilo(null);
    }
  };

  const filteredTemplates = getFilteredTemplates();

  return (
    <div className="h-full overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
      <div className="space-y-4">
        {/* Header con navegación */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-semibold text-purple-300/80 uppercase tracking-wider">
              Configurar Proyecto
            </h3>
            <p className="text-xs text-purple-300/40 mt-0.5">
              {step === 'rubro' && 'Paso 1: Selecciona el rubro'}
              {step === 'estilo' && 'Paso 2: Selecciona el estilo'}
              {step === 'template' && 'Paso 3: Elige un template'}
            </p>
          </div>
          {step !== 'rubro' && (
            <button
              onClick={handleBack}
              className="p-2 text-purple-300/60 hover:text-purple-300 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
        </div>

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs">
          <span className={step === 'rubro' ? 'text-purple-300' : 'text-purple-300/40'}>
            {selectedRubro ? businessCategories.find(c => c.value === selectedRubro)?.label : 'Rubro'}
          </span>
          {(step === 'estilo' || step === 'template') && (
            <>
              <svg className="w-3 h-3 text-purple-300/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className={step === 'estilo' || step === 'template' ? 'text-purple-300' : 'text-purple-300/40'}>
                {selectedEstilo ? templateStyles.find(s => s.value === selectedEstilo)?.label : 'Estilo'}
              </span>
            </>
          )}
          {step === 'template' && (
            <>
              <svg className="w-3 h-3 text-purple-300/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-purple-300">Template</span>
            </>
          )}
        </div>

        {/* Contenido según el paso */}
        <div className="space-y-2">
          {step === 'rubro' && (
            <>
              {businessCategories.map((category) => (
                <button
                  key={category.value}
                  onClick={() => handleRubroSelect(category.value)}
                  className="w-full px-3 py-3 rounded-xl text-left transition-all bg-white/5 border border-white/10 hover:bg-white/10 hover:border-purple-400/30"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{category.icon}</span>
                    <span className="text-sm font-medium text-purple-300/80">
                      {category.label}
                    </span>
                  </div>
                </button>
              ))}
            </>
          )}

          {step === 'estilo' && (
            <>
              {templateStyles.map((styleOption) => (
                <button
                  key={styleOption.value}
                  onClick={() => handleEstiloSelect(styleOption.value)}
                  className="w-full px-3 py-3 rounded-xl text-left transition-all bg-white/5 border border-white/10 hover:bg-white/10 hover:border-purple-400/30"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-purple-300/80">
                      {styleOption.label}
                    </div>
                    <div className="text-xs text-purple-300/40 font-mono">
                      {styleOption.dimensions}
                    </div>
                  </div>
                </button>
              ))}
            </>
          )}

          {step === 'template' && (
            <>
              {filteredTemplates.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-purple-300/40">
                    No hay templates disponibles para esta combinación
                  </p>
                </div>
              ) : (
                <>
                  {filteredTemplates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleTemplateSelect(template)}
                      className={`w-full px-3 py-3 rounded-xl text-left transition-all ${
                        selectedTemplate?.id === template.id
                          ? 'bg-gradient-to-r from-purple-600/40 to-pink-600/40 border border-purple-400/50'
                          : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-purple-400/30'
                      }`}
                    >
                      <div className="text-sm font-medium text-white mb-1">
                        {template.name}
                      </div>
                      {template.description && (
                        <div className="text-xs text-purple-300/60">
                          {template.description}
                        </div>
                      )}
                    </button>
                  ))}

                  {selectedTemplate && (
                    <button
                      onClick={handleContinue}
                      className="w-full mt-4 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-medium rounded-xl hover:from-purple-500 hover:to-pink-500 transition-all shadow-lg"
                    >
                      Continuar con este template
                    </button>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

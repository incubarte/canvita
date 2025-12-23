import { useState } from 'react';
import type { CategorizedTemplate } from '../types/template';
import type { ColorPalette } from '../types/user';
import { TemplatePreview } from './TemplatePreview';

interface TemplateSelectionScreenProps {
  templates: CategorizedTemplate[];
  onSelectTemplate: (template: CategorizedTemplate) => void;
  onCancel: () => void;
  clientColorPalette?: ColorPalette;
}

export const TemplateSelectionScreen = ({ templates, onSelectTemplate, onCancel, clientColorPalette }: TemplateSelectionScreenProps) => {
  const [selectedTemplate, setSelectedTemplate] = useState<CategorizedTemplate>(templates[0]);

  const handleContinue = () => {
    onSelectTemplate(selectedTemplate);
  };

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
                Elige un Template
              </h1>
              <p className="text-xs text-purple-300/60">Selecciona un template para empezar tu diseño</p>
            </div>
          </div>
          <button
            onClick={handleContinue}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-medium rounded-xl hover:from-purple-500 hover:to-pink-500 transition-all shadow-lg shadow-purple-500/30"
          >
            Continuar
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Templates List */}
        <div className="w-80 bg-black/20 backdrop-blur-xl border-r border-white/10 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          <div className="space-y-2">
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => setSelectedTemplate(template)}
                className={`w-full text-left p-4 rounded-xl transition-all ${
                  selectedTemplate.id === template.id
                    ? 'bg-gradient-to-r from-purple-600/40 to-pink-600/40 border border-purple-400/50 shadow-lg'
                    : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-purple-400/30'
                }`}
              >
                <div className="text-sm font-medium text-white mb-1">
                  {template.name}
                </div>
                <div className="text-xs text-purple-300/60">
                  {template.description}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="max-w-md w-full">
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold text-white mb-2">
                {selectedTemplate.name}
              </h2>
              <p className="text-purple-300/80">
                {selectedTemplate.description}
              </p>
            </div>

            {/* Preview Canvas */}
            <TemplatePreview
              template={selectedTemplate}
              clientColorPalette={clientColorPalette}
            />

            <div className="mt-6 flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 px-4 py-3 bg-white/5 border border-white/10 text-white text-sm font-medium rounded-xl hover:bg-white/10 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleContinue}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-medium rounded-xl hover:from-purple-500 hover:to-pink-500 transition-all shadow-lg shadow-purple-500/30"
              >
                Continuar con este template
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

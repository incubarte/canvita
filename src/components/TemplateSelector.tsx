import type { CategorizedTemplate } from '../types/template';

interface TemplateSelectorProps {
  templates: CategorizedTemplate[];
  selectedTemplate: CategorizedTemplate | null;
  onSelectTemplate: (template: CategorizedTemplate) => void;
}

export const TemplateSelector = ({ templates, selectedTemplate, onSelectTemplate }: TemplateSelectorProps) => {
  const categories = Array.from(new Set(templates.map(t => t.category)));

  return (
    <div className="h-full overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
      {categories.map((category) => (
        <div key={category} className="mb-6">
          <h3 className="text-xs font-semibold text-purple-300/80 uppercase tracking-wider mb-3 px-1">
            {category.replace('-', ' ')}
          </h3>

          <div className="space-y-2">
            {templates
              .filter(t => t.category === category)
              .map((template) => (
                <button
                  key={template.id}
                  onClick={() => onSelectTemplate(template)}
                  className={`group w-full text-left p-3 rounded-xl transition-all ${
                    selectedTemplate?.id === template.id
                      ? 'bg-gradient-to-r from-purple-600/40 to-pink-600/40 border border-purple-400/50 shadow-lg shadow-purple-500/20'
                      : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-purple-400/30'
                  }`}
                >
                  <div className="font-medium text-sm text-white/90 group-hover:text-white">
                    {template.name}
                  </div>
                  <div className="text-xs text-purple-300/50 mt-1">
                    {template.canvas.width} × {template.canvas.height}
                  </div>
                </button>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
};

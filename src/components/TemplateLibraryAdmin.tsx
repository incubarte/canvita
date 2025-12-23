import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { TemplateService } from '../services/templateService';
import { PaletteService } from '../services/paletteService';
import { TemplatePreview } from './TemplatePreview';
import { ColorPalettePanel } from './ColorPalettePanel';
import type { CategorizedTemplate, BusinessCategory, TemplateStyle } from '../types/template';
import type { SavedPalette, ColorPalette } from '../types/user';

interface TemplateLibraryAdminProps {
  onCreateNew: () => void;
  onEditTemplate: (template: CategorizedTemplate) => void;
  onLogout: () => void;
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

export const TemplateLibraryAdmin = ({ onCreateNew, onEditTemplate, onLogout }: TemplateLibraryAdminProps) => {
  const { user, updateUser } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<BusinessCategory | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<TemplateStyle | null>(null);
  const [templates, setTemplates] = useState<CategorizedTemplate[]>(TemplateService.getCustomTemplates());
  const [previewTemplate, setPreviewTemplate] = useState<CategorizedTemplate | null>(null);
  const [showPaletteManager, setShowPaletteManager] = useState(false);
  const [savedPalettes, setSavedPalettes] = useState<SavedPalette[]>([]);
  const [activePalette, setActivePalette] = useState<ColorPalette | null>(null);
  const [editingPalette, setEditingPalette] = useState<ColorPalette | null>(null);
  const [newPaletteName, setNewPaletteName] = useState('');

  useEffect(() => {
    if (user) {
      const palettes = PaletteService.getUserPalettes(user);
      setSavedPalettes(palettes);

      const active = PaletteService.getActivePalette(user);
      setActivePalette(active);
    }
  }, [user]);

  const handleDeleteTemplate = (templateId: string) => {
    if (confirm('¿Estás seguro de eliminar este template?')) {
      TemplateService.deactivateTemplate(templateId);
      setTemplates(TemplateService.getCustomTemplates());
    }
  };

  const handleDuplicateTemplate = (template: CategorizedTemplate) => {
    onEditTemplate(template);
  };

  const handleChangePalette = (paletteId: string) => {
    if (!user) return;

    const palette = savedPalettes.find(p => p.id === paletteId);
    if (palette) {
      setActivePalette(palette.palette);
      updateUser({ activePaletteId: paletteId });

      // Force re-render by updating templates array
      setTemplates([...TemplateService.getCustomTemplates()]);
    }
  };

  // Removed unused function

  const handleDeletePalette = (paletteId: string) => {
    if (!user) return;
    if (!confirm('¿Eliminar esta paleta?')) return;

    const newPalettes = PaletteService.deletePalette(user, paletteId);
    updateUser({ savedPalettes: newPalettes, activePaletteId: newPalettes[0]?.id });
    setSavedPalettes(newPalettes);
    setActivePalette(newPalettes[0]?.palette || null);
  };

  const handleUpdateActivePalette = (palette: ColorPalette) => {
    setEditingPalette(palette);
    setActivePalette(palette);
  };

  const handleSaveNewPalette = () => {
    if (!user || !editingPalette || !newPaletteName.trim()) {
      alert('Por favor ingresa un nombre para la paleta');
      return;
    }

    const newPalettes = PaletteService.savePalette(user, newPaletteName, editingPalette);
    const newPaletteId = newPalettes[newPalettes.length - 1].id;

    updateUser({ savedPalettes: newPalettes, activePaletteId: newPaletteId });
    setSavedPalettes(newPalettes);
    setActivePalette(editingPalette);
    setNewPaletteName('');
    alert('¡Paleta guardada exitosamente!');
  };

  const handleUpdateExistingPalette = (paletteId: string) => {
    if (!user || !editingPalette) return;

    const newPalettes = PaletteService.updatePalette(user, paletteId, { palette: editingPalette });
    updateUser({ savedPalettes: newPalettes });
    setSavedPalettes(newPalettes);
    setActivePalette(editingPalette);
    alert('¡Paleta actualizada exitosamente!');
  };

  const handleRenamePalette = (paletteId: string, currentName: string) => {
    if (!user) return;

    const newName = prompt('Nuevo nombre para la paleta:', currentName);
    if (!newName || newName === currentName) return;

    const newPalettes = PaletteService.updatePalette(user, paletteId, { name: newName });
    updateUser({ savedPalettes: newPalettes });
    setSavedPalettes(newPalettes);
  };

  const filteredTemplates = templates.filter(t => {
    if (selectedCategory && t.businessCategory !== selectedCategory) return false;
    if (selectedStyle && t.style !== selectedStyle) return false;
    return t.isActive !== false;
  });

  const templatesByCategory = businessCategories.map(category => {
    const categoryTemplates = templates.filter(
      t => t.businessCategory === category.value && t.isActive !== false
    );

    const byStyle = templateStyles.map(style => ({
      style: style,
      templates: categoryTemplates.filter(t => t.style === style.value)
    }));

    return {
      category,
      byStyle,
      total: categoryTemplates.length
    };
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="border-b border-white/10 bg-white/5 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Librería de Templates
              </h1>
              <p className="text-purple-300/60 text-sm mt-1">Gestiona tus templates por rubro y estilo</p>
            </div>
            <div className="flex gap-3">
              {/* Selector de paleta */}
              <div className="relative group z-50">
                <button className="px-4 py-2.5 bg-white/5 border border-white/10 text-purple-300/80 rounded-xl hover:bg-white/10 transition-all flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                  <span className="text-sm">Paleta</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown */}
                <div className="absolute right-0 mt-2 w-64 bg-slate-900/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-white">Paletas Guardadas</h3>
                      <button
                        onClick={() => setShowPaletteManager(true)}
                        className="text-xs text-purple-300 hover:text-purple-200"
                      >
                        Gestionar
                      </button>
                    </div>

                    <div className="space-y-1 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
                      {savedPalettes.map((palette) => (
                        <button
                          key={palette.id}
                          onClick={() => handleChangePalette(palette.id)}
                          className={`w-full text-left px-3 py-2 rounded-lg transition-all ${
                            user?.activePaletteId === palette.id || (!user?.activePaletteId && palette.id === savedPalettes[0]?.id)
                              ? 'bg-purple-600/30 border border-purple-400/30'
                              : 'hover:bg-white/5'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-white font-medium">{palette.name}</span>
                            {palette.id.startsWith('palette-') && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeletePalette(palette.id);
                                }}
                                className="text-red-400 hover:text-red-300 p-1"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            )}
                          </div>
                          <div className="flex gap-1 mt-2">
                            {Object.values(palette.palette).map((color, i) => (
                              <div
                                key={i}
                                className="h-6 flex-1 rounded"
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={onCreateNew}
                className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-xl hover:from-purple-500 hover:to-pink-500 transition-all shadow-lg"
              >
                + Nuevo Template
              </button>
              <button
                onClick={onLogout}
                className="px-4 py-2.5 bg-white/5 border border-white/10 text-purple-300/80 rounded-xl hover:bg-white/10 transition-all"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => { setSelectedCategory(null); setSelectedStyle(null); }}
              className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${
                !selectedCategory && !selectedStyle
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                  : 'bg-white/5 text-purple-300/60 hover:bg-white/10'
              }`}
            >
              Todos ({templates.filter(t => t.isActive !== false).length})
            </button>
            {businessCategories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => { setSelectedCategory(cat.value); setSelectedStyle(null); }}
                className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${
                  selectedCategory === cat.value
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                    : 'bg-white/5 text-purple-300/60 hover:bg-white/10'
                }`}
              >
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>

          {selectedCategory && (
            <div className="mt-2 flex gap-2">
              {templateStyles.map((style) => (
                <button
                  key={style.value}
                  onClick={() => setSelectedStyle(style.value)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    selectedStyle === style.value
                      ? 'bg-purple-600/50 text-white border border-purple-400/50'
                      : 'bg-white/5 text-purple-300/60 hover:bg-white/10'
                  }`}
                >
                  {style.label} ({style.dimensions})
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {selectedCategory === null && selectedStyle === null ? (
          // Vista organizada por categoría y estilo
          <div className="space-y-8">
            {templatesByCategory.map(({ category, byStyle, total }) => (
              total > 0 && (
                <div key={category.value} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <span className="text-2xl">{category.icon}</span>
                      {category.label}
                      <span className="text-sm text-purple-300/60 ml-2">({total})</span>
                    </h2>
                  </div>

                  {byStyle.map(({ style, templates }) => (
                    templates.length > 0 && (
                      <div key={style.value} className="mb-6 last:mb-0">
                        <h3 className="text-sm font-semibold text-purple-300/80 mb-3 flex items-center gap-2">
                          {style.label}
                          <span className="text-xs text-purple-300/40">({templates.length})</span>
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                          {templates.map((template) => (
                            <TemplateCard
                              key={template.id}
                              template={template}
                              adminPalette={activePalette}
                              onEdit={() => onEditTemplate(template)}
                              onDuplicate={() => handleDuplicateTemplate(template)}
                              onDelete={() => handleDeleteTemplate(template.id)}
                              onPreview={() => setPreviewTemplate(template)}
                            />
                          ))}
                        </div>
                      </div>
                    )
                  ))}
                </div>
              )
            ))}

            {templates.filter(t => t.isActive !== false).length === 0 && (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/10">
                  <svg className="w-10 h-10 text-purple-300/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-purple-300/80 mb-2">
                  No hay templates creados
                </h3>
                <p className="text-purple-300/40 text-sm mb-4">
                  Crea tu primer template para comenzar
                </p>
                <button
                  onClick={onCreateNew}
                  className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-xl hover:from-purple-500 hover:to-pink-500 transition-all shadow-lg inline-flex items-center gap-2"
                >
                  + Nuevo Template
                </button>
              </div>
            )}
          </div>
        ) : (
          // Vista filtrada
          <div>
            {filteredTemplates.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-purple-300/60">No hay templates en esta categoría</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    adminPalette={activePalette}
                    onEdit={() => onEditTemplate(template)}
                    onDuplicate={() => handleDuplicateTemplate(template)}
                    onDelete={() => handleDeleteTemplate(template.id)}
                    onPreview={() => setPreviewTemplate(template)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewTemplate && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          onClick={() => setPreviewTemplate(null)}
        >
          <div className="max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white">{previewTemplate.name}</h3>
                  <p className="text-sm text-purple-300/60">{previewTemplate.description}</p>
                </div>
                <button
                  onClick={() => setPreviewTemplate(null)}
                  className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors"
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div
                className="flex items-center justify-center bg-slate-800 rounded-xl overflow-hidden"
                style={{
                  height: '70vh',
                  width: '100%'
                }}
              >
                <div
                  className="flex items-center justify-center"
                  style={{
                    maxHeight: '100%',
                    maxWidth: '100%',
                    transform: previewTemplate.style === 'historia'
                      ? 'scale(0.55)'
                      : (previewTemplate.style === 'post' ? 'scale(0.90)' : 'scale(0.75)'),
                    transformOrigin: 'center center'
                  }}
                >
                  <TemplatePreview template={previewTemplate} clientColorPalette={activePalette || undefined} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Palette Manager Modal */}
      {showPaletteManager && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          onClick={() => setShowPaletteManager(false)}
        >
          <div className="max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="bg-slate-900/95 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-white">Gestionar Paletas de Colores</h3>
                  <p className="text-sm text-purple-300/60 mt-1">Crea y edita tus paletas de colores para los templates</p>
                </div>
                <button
                  onClick={() => setShowPaletteManager(false)}
                  className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors"
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Active Palette Editor */}
              <div className="bg-white/5 rounded-xl p-5 mb-6 border border-white/10">
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Editar Paleta Activa
                </h4>
                {activePalette && (
                  <ColorPalettePanel
                    initialPalette={editingPalette || activePalette}
                    onSave={handleUpdateActivePalette}
                  />
                )}

                {/* Actions for active palette */}
                <div className="mt-4 flex gap-3">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={newPaletteName}
                      onChange={(e) => setNewPaletteName(e.target.value)}
                      placeholder="Nombre para nueva paleta..."
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 text-white rounded-xl focus:outline-none focus:border-purple-400/50 transition-colors"
                    />
                  </div>
                  <button
                    onClick={handleSaveNewPalette}
                    className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-xl hover:from-purple-500 hover:to-pink-500 transition-all shadow-lg"
                  >
                    Guardar como Nueva
                  </button>
                  {user?.activePaletteId && !user.activePaletteId.startsWith('default-') && (
                    <button
                      onClick={() => handleUpdateExistingPalette(user.activePaletteId!)}
                      className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-500 transition-all shadow-lg"
                    >
                      Actualizar Actual
                    </button>
                  )}
                </div>
              </div>

              {/* Saved Palettes List */}
              <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                  Paletas Guardadas ({savedPalettes.length})
                </h4>

                <div className="space-y-3">
                  {savedPalettes.map((palette) => {
                    const isActive = user?.activePaletteId === palette.id || (!user?.activePaletteId && palette.id === savedPalettes[0]?.id);
                    const isDefault = palette.id.startsWith('default-');

                    return (
                      <div
                        key={palette.id}
                        className={`p-4 rounded-xl transition-all ${
                          isActive
                            ? 'bg-purple-600/30 border-2 border-purple-400/50'
                            : 'bg-white/5 border border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <h5 className="text-white font-medium">{palette.name}</h5>
                            {isDefault && (
                              <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-xs rounded-full border border-blue-400/30">
                                Predeterminada
                              </span>
                            )}
                            {isActive && (
                              <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-xs rounded-full border border-purple-400/30">
                                Activa
                              </span>
                            )}
                          </div>

                          <div className="flex gap-2">
                            {!isActive && (
                              <button
                                onClick={() => handleChangePalette(palette.id)}
                                className="px-3 py-1.5 bg-purple-600/20 text-purple-300 text-sm rounded-lg hover:bg-purple-600/30 transition-colors"
                              >
                                Activar
                              </button>
                            )}
                            {!isDefault && (
                              <>
                                <button
                                  onClick={() => handleRenamePalette(palette.id, palette.name)}
                                  className="px-3 py-1.5 bg-blue-600/20 text-blue-300 text-sm rounded-lg hover:bg-blue-600/30 transition-colors"
                                >
                                  Renombrar
                                </button>
                                <button
                                  onClick={() => handleDeletePalette(palette.id)}
                                  className="px-3 py-1.5 bg-red-600/20 text-red-300 text-sm rounded-lg hover:bg-red-600/30 transition-colors"
                                >
                                  Eliminar
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Color preview */}
                        <div className="grid grid-cols-5 gap-2">
                          {Object.entries(palette.palette).map(([key, color]) => (
                            <div key={key} className="space-y-1">
                              <div
                                className="h-12 rounded-lg border-2 border-white/20"
                                style={{ backgroundColor: color }}
                              />
                              <p className="text-xs text-purple-300/60 text-center">{key}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface TemplateCardProps {
  template: CategorizedTemplate;
  adminPalette: ColorPalette | null;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onPreview: () => void;
}

const TemplateCard = ({ template, adminPalette, onEdit, onDuplicate, onDelete, onPreview }: TemplateCardProps) => {
  // Create a modified template with admin palette as demoTheme
  const displayTemplate = adminPalette
    ? { ...template, demoTheme: adminPalette }
    : template;

  // Create a unique key based on template and palette to force re-render
  const previewKey = `${template.id}-${adminPalette ? Object.values(adminPalette).join('-') : 'default'}`;

  return (
    <div className="group bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden hover:border-purple-400/30 transition-all">
      <div
        className="aspect-video bg-slate-800 relative cursor-pointer overflow-hidden"
        onClick={onPreview}
      >
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            transform: template.style === 'historia' ? 'scale(0.26)' : (template.style === 'post' ? 'scale(0.46)' : 'scale(0.46)'),
            transformOrigin: 'center center'
          }}
        >
          <TemplatePreview
            key={previewKey}
            template={displayTemplate}
            clientColorPalette={adminPalette || undefined}
          />
        </div>
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 z-10 pointer-events-none group-hover:pointer-events-auto">
          <span className="text-white text-sm font-medium">Ver preview</span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-white font-medium text-sm mb-1 truncate">
          {template.name}
        </h3>
        <p className="text-purple-300/40 text-xs mb-3">
          {new Date(template.createdAt || '').toLocaleDateString()}
        </p>
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="flex-1 px-3 py-1.5 bg-purple-600/20 text-purple-300 text-xs rounded-lg hover:bg-purple-600/30 transition-colors"
          >
            Editar
          </button>
          <button
            onClick={onDuplicate}
            className="flex-1 px-3 py-1.5 bg-blue-600/20 text-blue-300 text-xs rounded-lg hover:bg-blue-600/30 transition-colors"
          >
            Duplicar
          </button>
          <button
            onClick={onDelete}
            className="px-3 py-1.5 bg-red-600/20 text-red-300 text-xs rounded-lg hover:bg-red-600/30 transition-colors"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
};

import { useState, useEffect } from 'react';
import { Canvas } from 'fabric';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthScreen } from './components/AuthScreen';
import { ProjectsLibrary } from './components/ProjectsLibrary';
import { TemplateLibraryAdmin } from './components/TemplateLibraryAdmin';
import { TemplateSelectionScreen } from './components/TemplateSelectionScreen';
import { CanvasEditor } from './components/CanvasEditor';
import { PropertiesPanel } from './components/PropertiesPanel';
import { LayersPanel } from './components/LayersPanel';
import { ElementsPanel } from './components/ElementsPanel';
import { TemplateInfoPanel, type TemplateInfo } from './components/TemplateInfoPanel';
import { ProjectSetupPanel } from './components/ProjectSetupPanel';
import { TemplatePreview } from './components/TemplatePreview';
import { CustomizationPanel } from './components/CustomizationPanel';
import { DebugSupabase } from './components/DebugSupabase';
import { templates } from './data/templates';
import { ProjectService } from './services/projectService';
import { TemplateService } from './services/templateService';
import { PaletteService } from './services/paletteService';
import { useCanvasHistory } from './hooks/useCanvasHistory';
import type { CategorizedTemplate, TemplateElement } from './types/template';
import type { Project, SavedPalette, ColorPalette } from './types/user';

function EditorView() {
  const { user, logout, updateUser } = useAuth();
  const isAdmin = user?.role === 'admin';

  // Estados del flujo
  const [view, setView] = useState<'library' | 'templateSelection' | 'editor' | 'setupProject'>('library');
  const [selectedTemplate, setSelectedTemplate] = useState<CategorizedTemplate>(templates[0]);
  const [selectedElement, setSelectedElement] = useState<TemplateElement | null>(null);
  const [canvas, setCanvas] = useState<Canvas | null>(null);
  const [activeTab, setActiveTab] = useState<'insertar' | 'elementos' | 'properties' | 'info' | 'setup' | 'customization'>(
    isAdmin ? 'info' : 'customization'
  );
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [projectName, setProjectName] = useState(isAdmin ? 'Nuevo Template' : 'Sin título');
  const [canvasBackgroundColor, setCanvasBackgroundColor] = useState('#ffffff');
  const [canvasBackgroundColorVariable, setCanvasBackgroundColorVariable] = useState<string | null>(null);
  const [templateInfo, setTemplateInfo] = useState<TemplateInfo>({
    name: '',
    description: '',
    businessCategory: null,
    style: null,
    demoTheme: {
      principal1: '#667eea',
      principal2: '#764ba2',
      secundario1: '#f093fb',
      secundario2: '#4facfe',
      secundario3: '#43e97b',
    },
  });
  const [previewTemplate, setPreviewTemplate] = useState<CategorizedTemplate | null>(null);

  // Estados para paletas de admin
  const [savedPalettes, setSavedPalettes] = useState<SavedPalette[]>([]);
  const [activePalette, setActivePalette] = useState<ColorPalette | null>(null);

  // Estado para templates personalizados
  const [customTemplates, setCustomTemplates] = useState<CategorizedTemplate[]>([]);

  // Sincronizar el nombre del template con el título
  const handleTemplateInfoChange = (info: TemplateInfo) => {
    setTemplateInfo(info);
    if (isAdmin && info.name) {
      setProjectName(info.name);
    }
  };

  const { saveState, undo, redo, canUndo, canRedo } = useCanvasHistory(canvas);

  // Cargar templates personalizados
  useEffect(() => {
    async function loadCustomTemplates() {
      const templates = await TemplateService.getCustomTemplates();
      setCustomTemplates(templates);
    }
    loadCustomTemplates();
  }, []);

  // Cargar paletas del admin
  useEffect(() => {
    async function loadPalettes() {
      if (isAdmin && user) {
        const palettes = await PaletteService.getUserPalettes(user.id);
        setSavedPalettes(palettes);

        const active = await PaletteService.getActivePalette(user);
        setActivePalette(active);

        // Sincronizar con templateInfo.demoTheme
        if (active) {
          setTemplateInfo(prev => ({ ...prev, demoTheme: active }));
        }
      }
    }
    loadPalettes();
  }, [isAdmin, user]);

  // Actualizar color de fondo del canvas
  const handleCanvasBackgroundChange = (color: string) => {
    if (!canvas) return;
    canvas.backgroundColor = color;
    canvas.requestRenderAll();
    setCanvasBackgroundColor(color);
    setCanvasBackgroundColorVariable(null); // Clear variable when manually setting color
  };

  // Actualizar variable de color de fondo del canvas
  const handleCanvasBackgroundColorVariable = (colorVariable: string | null) => {
    if (!canvas) return;
    setCanvasBackgroundColorVariable(colorVariable);

    if (colorVariable && isAdmin && activePalette) {
      const color = activePalette[colorVariable as keyof typeof activePalette];
      if (color) {
        canvas.backgroundColor = color;
        canvas.requestRenderAll();
        setCanvasBackgroundColor(color);
      }
    }
  };

  // Cambiar paleta activa (solo admin)
  const handleChangePalette = (paletteId: string) => {
    if (!user || !isAdmin) return;

    const palette = savedPalettes.find(p => p.id === paletteId);
    if (palette) {
      console.log('🎨 handleChangePalette:', palette.name, palette.palette);
      setActivePalette(palette.palette);
      setTemplateInfo(prev => ({ ...prev, demoTheme: palette.palette }));
      updateUser({ activePaletteId: paletteId });

      // Aplicar la nueva paleta al canvas actual
      if (canvas) {
        // Actualizar objetos con variables de color
        canvas.getObjects().forEach(_obj => {
          const obj = _obj as any;
          const colorVariable = obj.colorVariable;
          if (colorVariable && palette.palette[colorVariable as keyof typeof palette.palette]) {
            obj.set('fill', palette.palette[colorVariable as keyof typeof palette.palette]);
          }
        });

        // Actualizar color de fondo si tiene variable asignada
        if (canvasBackgroundColorVariable) {
          const bgColor = palette.palette[canvasBackgroundColorVariable as keyof typeof palette.palette];
          if (bgColor) {
            canvas.backgroundColor = bgColor;
            setCanvasBackgroundColor(bgColor);
          }
        }

        canvas.requestRenderAll();
      }
    }
  };

  // Guardar estado cuando el canvas cambia
  useEffect(() => {
    if (!canvas) return;

    let modificationTimeout: ReturnType<typeof setTimeout> | null = null;
    let lastRemoveTime = 0;
    let lastAddTime = 0;

    // Solo guardar después de que el usuario termine de modificar (debounce)
    const handleObjectModified = () => {
      if (modificationTimeout) {
        clearTimeout(modificationTimeout);
      }
      modificationTimeout = setTimeout(() => {
        saveState();
      }, 300); // Esperar 300ms después de que deje de mover
    };

    const handleObjectAdded = () => {
      const now = Date.now();
      lastAddTime = now;

      // Si hubo un remove muy reciente (< 250ms), es un cambio de capa, no guardar
      if (now - lastRemoveTime < 250) {
        return;
      }

      // Guardar cuando se agrega un elemento nuevo (no cambio de capa)
      setTimeout(() => {
        // Verificar que no haya habido un remove justo después
        if (Date.now() - lastRemoveTime > 250) {
          saveState();
        }
      }, 300);
    };

    const handleObjectRemoved = () => {
      const now = Date.now();
      lastRemoveTime = now;

      // Si hubo un add muy reciente (< 250ms), es un cambio de capa, no guardar
      if (now - lastAddTime < 250) {
        return;
      }

      // Guardar cuando se elimina un elemento (no cambio de capa)
      setTimeout(() => {
        // Verificar que no haya habido un add justo después
        if (Date.now() - lastAddTime > 250) {
          saveState();
        }
      }, 300);
    };

    canvas.on('object:modified', handleObjectModified);
    canvas.on('object:added', handleObjectAdded);
    canvas.on('object:removed', handleObjectRemoved);

    // Guardar estado inicial
    setTimeout(() => saveState(), 500);

    return () => {
      if (modificationTimeout) {
        clearTimeout(modificationTimeout);
      }
      canvas.off('object:modified', handleObjectModified);
      canvas.off('object:added', handleObjectAdded);
      canvas.off('object:removed', handleObjectRemoved);
    };
  }, [canvas, saveState]);

  const handleNewProject = () => {
    setCurrentProject(null);
    setProjectName(isAdmin ? 'Nuevo Template' : 'Sin título');
    setPreviewTemplate(null);

    if (isAdmin) {
      // Administradores van directo a selección de template base
      setView('templateSelection');
    } else {
      // Clientes van a la vista de setup con panel integrado
      setView('setupProject');
      setActiveTab('setup');
    }
  };

  const handleTemplateSelected = (template: CategorizedTemplate) => {
    setSelectedTemplate(template);
    setView('editor');
    // Resetear a la tab por defecto según el rol
    setActiveTab(isAdmin ? 'info' : 'customization');
    // Limpiar preview
    setPreviewTemplate(null);
  };

  const handleCancelTemplateSelection = () => {
    setView('library');
    setPreviewTemplate(null);
  };

  const handleOpenProject = (project: Project) => {
    setCurrentProject(project);
    setProjectName(project.name);

    // Encontrar el template
    const template = templates.find(t => t.id === project.templateId);
    if (template) {
      setSelectedTemplate(template);
    }

    setView('editor');
  };

  const handleSaveProject = async () => {
    if (!canvas || !user) return;

    if (isAdmin) {
      // Administradores guardan templates - validar que la info esté completa
      if (!templateInfo.name.trim()) {
        alert('Por favor ingresa un nombre para el template');
        setActiveTab('info');
        return;
      }

      if (!templateInfo.businessCategory) {
        alert('Por favor selecciona un rubro para el template');
        setActiveTab('info');
        return;
      }

      if (!templateInfo.style) {
        alert('Por favor selecciona un estilo para el template');
        setActiveTab('info');
        return;
      }

      const savedTemplate = await TemplateService.saveTemplate(
        user.id,
        templateInfo.name,
        templateInfo.description,
        templateInfo.businessCategory,
        templateInfo.style,
        canvas,
        templateInfo.demoTheme,
        selectedTemplate.id
      );

      setProjectName(savedTemplate.name);
      alert('✅ Template guardado exitosamente!\n\nLos clientes ya pueden usarlo en:\n' +
            `• Rubro: ${templateInfo.businessCategory}\n` +
            `• Estilo: ${templateInfo.style}`);
    } else {
      // Clientes guardan proyectos
      const name = prompt('Nombre del proyecto:', projectName);
      if (!name) return;

      const saved = await ProjectService.saveProject(
        user.id,
        name,
        selectedTemplate.id,
        canvas,
        null,
        currentProject?.id
      );

      setCurrentProject(saved);
      setProjectName(saved.name);
      alert('Proyecto guardado!');
    }
  };

  const handleBackToLibrary = () => {
    setView('library');
    setCurrentProject(null);
  };

  const handleExport = () => {
    if (!canvas) return;

    const dataURL = canvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 1 / 0.35,
    });

    const link = document.createElement('a');
    link.download = `${projectName.toLowerCase().replace(/\s+/g, '-')}.png`;
    link.href = dataURL;
    link.click();
  };

  if (view === 'library') {
    // Admin: Librería de templates organizados por rubro y estilo
    if (isAdmin) {
      return (
        <TemplateLibraryAdmin
          onCreateNew={() => setView('templateSelection')}
          onEditTemplate={(template) => {
            setSelectedTemplate(template);
            setView('editor');
            setTemplateInfo({
              name: template.name + ' (copia)',
              description: template.description,
              businessCategory: template.businessCategory || null,
              style: template.style || null,
              demoTheme: template.demoTheme || {
                principal1: '#667eea',
                principal2: '#764ba2',
                secundario1: '#f093fb',
                secundario2: '#4facfe',
                secundario3: '#43e97b',
              },
            });
          }}
          onLogout={logout}
        />
      );
    }

    // Cliente: Librería de proyectos
    return (
      <ProjectsLibrary
        onOpenProject={handleOpenProject}
        onNewProject={handleNewProject}
      />
    );
  }

  // Solo para admins: Selección de template base
  if (view === 'templateSelection') {
    return (
      <TemplateSelectionScreen
        templates={templates}
        onSelectTemplate={handleTemplateSelected}
        onCancel={handleCancelTemplateSelection}
        clientColorPalette={!isAdmin ? user?.colorPalette : undefined}
      />
    );
  }

  // Para clientes: Setup de proyecto con panel integrado
  if (view === 'setupProject') {
    const allTemplates = [...customTemplates, ...templates];

    return (
      <div className="h-screen flex flex-col bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
        {/* Header */}
        <header className="bg-black/20 backdrop-blur-xl border-b border-white/10 flex-shrink-0">
          <div className="px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <button
                onClick={handleCancelTemplateSelection}
                className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <svg className="w-5 h-5 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Nuevo Proyecto
                </h1>
                <p className="text-xs text-purple-300/60">
                  {previewTemplate ? previewTemplate.name : 'Configura tu proyecto paso a paso'}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar con panel de setup */}
          <div className="w-72 flex flex-col overflow-hidden bg-black/20 backdrop-blur-xl border-r border-white/10">
            <ProjectSetupPanel
              templates={allTemplates}
              onComplete={handleTemplateSelected}
              onTemplatePreview={setPreviewTemplate}
            />
          </div>

          {/* Área de preview/info */}
          <div className="flex-1 flex items-center justify-center p-8">
            {previewTemplate ? (
              <div className="flex flex-col items-center justify-center max-w-2xl w-full">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-white mb-2 text-center">
                    {previewTemplate.name}
                  </h2>
                  {previewTemplate.description && (
                    <p className="text-purple-300/60 text-center">
                      {previewTemplate.description}
                    </p>
                  )}
                </div>

                {/* Preview del template */}
                <TemplatePreview
                  template={previewTemplate}
                  clientColorPalette={!isAdmin ? user?.colorPalette : undefined}
                />

                <div className="mt-6 flex items-center gap-3 text-xs text-purple-300/60">
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                    {previewTemplate.canvas.width} × {previewTemplate.canvas.height}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center max-w-md">
                <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-white mb-3">
                  Configura tu Proyecto
                </h2>
                <p className="text-purple-300/60 mb-6">
                  Sigue los pasos en el panel de la izquierda para seleccionar el rubro, estilo y template perfecto para tu proyecto.
                </p>
                <div className="space-y-3 text-left">
                  <div className="flex items-start gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                    <div className="w-6 h-6 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-purple-300 text-sm font-bold">1</span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">Selecciona el Rubro</div>
                      <div className="text-xs text-purple-300/60">Elige la categoría de tu negocio</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                    <div className="w-6 h-6 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-purple-300 text-sm font-bold">2</span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">Selecciona el Estilo</div>
                      <div className="text-xs text-purple-300/60">Formato del diseño (post, historia, imagen)</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                    <div className="w-6 h-6 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-purple-300 text-sm font-bold">3</span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">Elige un Template</div>
                      <div className="text-xs text-purple-300/60">Selecciona el diseño base que más te guste</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
      {/* Header moderno */}
      <header className="bg-black/20 backdrop-blur-xl border-b border-white/10 flex-shrink-0 relative z-50">
        <div className="px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBackToLibrary}
              className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors"
            >
              <svg className="w-5 h-5 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl blur opacity-75"></div>
              <div className="relative w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    {projectName}
                  </h1>
                  {isAdmin && (
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-md shadow-lg">
                      Template
                    </span>
                  )}
                </div>
                <p className="text-xs text-purple-300/60">
                  {isAdmin ? (
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      Modo Administrador
                    </span>
                  ) : (
                    selectedTemplate.name
                  )}
                </p>
              </div>
            </div>

            {/* Undo/Redo buttons */}
            <div className="flex gap-2 ml-6">
              <button
                onClick={undo}
                disabled={!canUndo}
                className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="Deshacer (Ctrl+Z)"
              >
                <svg className="w-5 h-5 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
              </button>
              <button
                onClick={redo}
                disabled={!canRedo}
                className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="Rehacer (Ctrl+Y)"
              >
                <svg className="w-5 h-5 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
                </svg>
              </button>
            </div>
          </div>
          <div className="flex gap-3 items-center">
            {/* Color de fondo del canvas */}
            <div className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-xl">
              <svg className="w-4 h-4 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
              <input
                type="color"
                value={canvasBackgroundColor}
                onChange={(e) => handleCanvasBackgroundChange(e.target.value)}
                className="w-8 h-8 bg-transparent border-none cursor-pointer"
                title="Color de fondo del canvas"
              />
              {isAdmin && (
                <select
                  value={canvasBackgroundColorVariable || ''}
                  onChange={(e) => handleCanvasBackgroundColorVariable(e.target.value || null)}
                  className="text-xs bg-white/5 border border-white/10 text-purple-300 rounded px-2 py-1 cursor-pointer"
                  title="Variable de color para fondo"
                >
                  <option value="">Color fijo</option>
                  <option value="principal1">Principal 1</option>
                  <option value="principal2">Principal 2</option>
                  <option value="secundario1">Secundario 1</option>
                  <option value="secundario2">Secundario 2</option>
                  <option value="secundario3">Secundario 3</option>
                </select>
              )}
            </div>

            {/* Selector de paleta (solo admin) */}
            {isAdmin && savedPalettes.length > 0 && (
              <div className="relative group z-50">
                <button className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 text-purple-300/80 rounded-xl hover:bg-white/10 transition-all">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                  <span className="text-xs">
                    {savedPalettes.find(p => p.id === user?.activePaletteId || p.id === savedPalettes[0]?.id)?.name || 'Paleta'}
                  </span>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown */}
                <div className="absolute right-0 mt-2 w-56 bg-slate-900/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  <div className="p-2">
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
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-white font-medium">{palette.name}</span>
                          </div>
                          <div className="flex gap-1">
                            {Object.values(palette.palette).map((color, i) => (
                              <div
                                key={i}
                                className="h-4 flex-1 rounded"
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
            )}

            <button
              onClick={handleSaveProject}
              className={`px-5 py-2.5 text-white text-sm font-medium rounded-xl transition-all ${
                isAdmin
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-lg shadow-amber-500/30'
                  : 'bg-white/10 border border-white/20 hover:bg-white/20'
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isAdmin ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  )}
                </svg>
                {isAdmin ? 'Guardar Template' : 'Guardar Proyecto'}
              </span>
            </button>
            <button
              onClick={handleExport}
              className="group relative px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-medium rounded-xl hover:from-purple-500 hover:to-pink-500 transition-all shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:-translate-y-0.5"
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export PNG
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar izquierda con glassmorphism */}
        <div className="w-72 flex flex-col overflow-hidden bg-black/20 backdrop-blur-xl border-r border-white/10">
          {/* Tabs elegantes */}
          <div className="p-2 border-b border-white/10">
            {isAdmin ? (
              <div className="bg-white/5 rounded-xl p-1 gap-1 grid grid-cols-4">
                <button
                  onClick={() => setActiveTab('info')}
                  className={`px-2 py-2.5 text-xs font-medium rounded-lg transition-all ${
                    activeTab === 'info'
                      ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg'
                      : 'text-purple-300/60 hover:text-purple-300 hover:bg-white/5'
                  }`}
                >
                  Info
                </button>
                <button
                  onClick={() => setActiveTab('insertar')}
                  className={`px-2 py-2.5 text-xs font-medium rounded-lg transition-all ${
                    activeTab === 'insertar'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                      : 'text-purple-300/60 hover:text-purple-300 hover:bg-white/5'
                  }`}
                >
                  Insertar
                </button>
                <button
                  onClick={() => setActiveTab('elementos')}
                  className={`px-2 py-2.5 text-xs font-medium rounded-lg transition-all ${
                    activeTab === 'elementos'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                      : 'text-purple-300/60 hover:text-purple-300 hover:bg-white/5'
                  }`}
                >
                  Elementos
                </button>
                <button
                  onClick={() => setActiveTab('properties')}
                  className={`px-2 py-2.5 text-xs font-medium rounded-lg transition-all ${
                    activeTab === 'properties'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                      : 'text-purple-300/60 hover:text-purple-300 hover:bg-white/5'
                  }`}
                >
                  Propiedades
                </button>
              </div>
            ) : (
              <div className="bg-white/5 rounded-xl p-1">
                <button
                  onClick={() => setActiveTab('customization')}
                  className="w-full px-4 py-3 text-sm font-medium rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg"
                >
                  Customización
                </button>
              </div>
            )}
          </div>

          {/* Content area */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'info' ? (
              <TemplateInfoPanel
                onInfoChange={handleTemplateInfoChange}
                initialInfo={templateInfo}
                activePaletteName={activePalette ? savedPalettes.find(p => p.id === user?.activePaletteId)?.name : undefined}
                activePaletteColors={activePalette || undefined}
              />
            ) : activeTab === 'customization' ? (
              <CustomizationPanel
                canvas={canvas}
                userPalette={user?.colorPalette}
              />
            ) : activeTab === 'insertar' ? (
              <ElementsPanel canvas={canvas} />
            ) : activeTab === 'elementos' ? (
              <LayersPanel
                canvas={canvas}
                onSelectElement={(obj) => {
                  setActiveTab('properties');
                }}
              />
            ) : (
              <PropertiesPanel
                selectedElement={selectedElement}
                canvas={canvas}
                demoTheme={isAdmin ? templateInfo.demoTheme : user?.colorPalette}
                isAdmin={isAdmin}
              />
            )}
          </div>
        </div>

        {/* Canvas area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <CanvasEditor
            key={currentProject?.id || selectedTemplate.id}
            template={selectedTemplate}
            savedCanvasData={
              currentProject?.canvasData ||
              ((selectedTemplate as any).canvasJson ? JSON.stringify((selectedTemplate as any).canvasJson) : undefined)
            }
            clientColorPalette={!isAdmin ? user?.colorPalette : undefined}
            isAdmin={isAdmin}
            onElementSelect={(element) => {
              setSelectedElement(element);
              // Solo cambiar a properties si es admin, usuarios se quedan en customization
              if (element && isAdmin) setActiveTab('properties');
            }}
            onCanvasReady={(c) => {
              setCanvas(c);
              setCanvasBackgroundColor(c.backgroundColor as string || '#ffffff');
            }}
          />
        </div>
      </div>
    </div>
  );
}

function AppContent() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <div className="text-purple-300/80 text-lg">Cargando...</div>
          <div className="text-purple-300/40 text-sm mt-2">Verificando sesión</div>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 px-4 py-2 bg-purple-600/20 text-purple-300 rounded-lg hover:bg-purple-600/30 transition-colors text-sm"
          >
            Recargar página
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return <EditorView />;
}

function App() {
  // Modo debug - presiona Shift+D para activar
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key === 'D') {
        setShowDebug(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <AuthProvider>
      {showDebug && <DebugSupabase />}
      <AppContent />
    </AuthProvider>
  );
}

export default App;

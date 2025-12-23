import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ProjectService } from '../services/projectService';
import { ColorPalettePanel } from './ColorPalettePanel';
import type { Project, Folder, ColorPalette } from '../types/user';

interface ProjectsLibraryProps {
  onOpenProject: (project: Project) => void;
  onNewProject: () => void;
}

export const ProjectsLibrary = ({ onOpenProject, onNewProject }: ProjectsLibraryProps) => {
  const { user, logout, updateUser } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [activeTab, setActiveTab] = useState<'projects' | 'palette'>('projects');

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = () => {
    if (user) {
      setProjects(ProjectService.getProjects(user.id));
      setFolders(ProjectService.getFolders(user.id));
    }
  };

  const handleCreateFolder = () => {
    if (user && newFolderName.trim()) {
      ProjectService.createFolder(user.id, newFolderName.trim());
      setNewFolderName('');
      setShowNewFolderDialog(false);
      loadData();
    }
  };

  const handleDeleteProject = (projectId: string) => {
    if (confirm('¿Estás seguro de eliminar este proyecto?')) {
      ProjectService.deleteProject(projectId);
      loadData();
    }
  };

  const handleDeleteFolder = (folderId: string) => {
    if (confirm('¿Eliminar esta carpeta? Los proyectos se moverán a "Sin carpeta"')) {
      ProjectService.deleteFolder(folderId);
      loadData();
      if (selectedFolder === folderId) {
        setSelectedFolder(null);
      }
    }
  };

  const filteredProjects = selectedFolder
    ? projects.filter(p => p.folderId === selectedFolder)
    : projects.filter(p => p.folderId === null);

  const handleSavePalette = (palette: ColorPalette) => {
    updateUser({ colorPalette: palette });
    alert('¡Paleta de colores guardada exitosamente!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="border-b border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                {activeTab === 'projects' ? 'Mis Proyectos' : 'Mi Paleta de Colores'}
              </h1>
              <p className="text-purple-300/60 text-sm mt-1">Hola, {user?.name}</p>
            </div>
            <div className="flex gap-3">
              {activeTab === 'projects' && (
                <button
                  onClick={onNewProject}
                  className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-xl hover:from-purple-500 hover:to-pink-500 transition-all shadow-lg"
                >
                  + Nuevo Proyecto
                </button>
              )}
              <button
                onClick={logout}
                className="px-4 py-2.5 bg-white/5 border border-white/10 text-purple-300/80 rounded-xl hover:bg-white/10 transition-all"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setActiveTab('projects')}
              className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${
                activeTab === 'projects'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                  : 'bg-white/5 text-purple-300/60 hover:bg-white/10'
              }`}
            >
              📁 Proyectos
            </button>
            <button
              onClick={() => setActiveTab('palette')}
              className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${
                activeTab === 'palette'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                  : 'bg-white/5 text-purple-300/60 hover:bg-white/10'
              }`}
            >
              🎨 Paleta de Colores
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'palette' ? (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl">
              <ColorPalettePanel
                initialPalette={user?.colorPalette}
                onSave={handleSavePalette}
              />
            </div>
          </div>
        ) : (
          <div className="flex gap-6">
            {/* Sidebar - Folders */}
            <div className="w-64 flex-shrink-0">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-purple-300/80">Carpetas</h3>
                <button
                  onClick={() => setShowNewFolderDialog(true)}
                  className="text-purple-300/60 hover:text-purple-300 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>

              <div className="space-y-1">
                <button
                  onClick={() => setSelectedFolder(null)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-all ${
                    selectedFolder === null
                      ? 'bg-purple-600/30 text-white border border-purple-400/30'
                      : 'text-purple-300/60 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                    <span className="text-sm">Sin carpeta</span>
                  </div>
                </button>

                {folders.map(folder => (
                  <div key={folder.id} className="group relative">
                    <button
                      onClick={() => setSelectedFolder(folder.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-all ${
                        selectedFolder === folder.id
                          ? 'bg-purple-600/30 text-white border border-purple-400/30'
                          : 'text-purple-300/60 hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                        <span className="text-sm">{folder.name}</span>
                      </div>
                    </button>
                    <button
                      onClick={() => handleDeleteFolder(folder.id)}
                      className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 text-red-400/60 hover:text-red-400 transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>

              {showNewFolderDialog && (
                <div className="mt-3 p-3 bg-white/5 border border-white/10 rounded-lg">
                  <input
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Nombre de la carpeta"
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 mb-2"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleCreateFolder}
                      className="flex-1 px-3 py-1.5 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-500 transition-colors"
                    >
                      Crear
                    </button>
                    <button
                      onClick={() => {
                        setShowNewFolderDialog(false);
                        setNewFolderName('');
                      }}
                      className="flex-1 px-3 py-1.5 bg-white/5 text-purple-300/60 text-xs rounded-lg hover:bg-white/10 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Projects Grid */}
          <div className="flex-1">
            {filteredProjects.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/10">
                  <svg className="w-10 h-10 text-purple-300/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-purple-300/80 mb-2">
                  No hay proyectos aquí
                </h3>
                <p className="text-purple-300/40 text-sm mb-4">
                  Creá tu primer proyecto para comenzar
                </p>
                <button
                  onClick={onNewProject}
                  className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-xl hover:from-purple-500 hover:to-pink-500 transition-all shadow-lg inline-flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Nuevo Proyecto
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProjects.map(project => (
                  <div
                    key={project.id}
                    className="group bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden hover:border-purple-400/30 transition-all"
                  >
                    <div
                      className="aspect-video bg-slate-800 relative cursor-pointer"
                      onClick={() => onOpenProject(project)}
                    >
                      <img
                        src={project.thumbnail}
                        alt={project.name}
                        className="w-full h-full object-contain"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <span className="text-white text-sm font-medium">Abrir</span>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="text-white font-medium text-sm mb-1 truncate">
                        {project.name}
                      </h3>
                      <p className="text-purple-300/40 text-xs">
                        {new Date(project.updatedAt).toLocaleDateString()}
                      </p>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => onOpenProject(project)}
                          className="flex-1 px-3 py-1.5 bg-purple-600/20 text-purple-300 text-xs rounded-lg hover:bg-purple-600/30 transition-colors"
                        >
                          Abrir
                        </button>
                        <button
                          onClick={() => handleDeleteProject(project.id)}
                          className="px-3 py-1.5 bg-red-600/20 text-red-300 text-xs rounded-lg hover:bg-red-600/30 transition-colors"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        )}
      </div>
    </div>
  );
};

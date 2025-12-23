import type { Project, Folder } from '../types/user';
import { Canvas } from 'fabric';

export class ProjectService {
  private static PROJECTS_KEY = 'projects';
  private static FOLDERS_KEY = 'folders';

  // Proyectos
  static getProjects(userId: string): Project[] {
    const projectsJson = localStorage.getItem(this.PROJECTS_KEY) || '[]';
    const allProjects = JSON.parse(projectsJson);
    return allProjects.filter((p: Project) => p.userId === userId);
  }

  static getProject(projectId: string): Project | null {
    const projectsJson = localStorage.getItem(this.PROJECTS_KEY) || '[]';
    const allProjects = JSON.parse(projectsJson);
    return allProjects.find((p: Project) => p.id === projectId) || null;
  }

  static saveProject(
    userId: string,
    name: string,
    templateId: string,
    canvas: Canvas,
    folderId: string | null = null,
    existingProjectId?: string
  ): Project {
    const projectsJson = localStorage.getItem(this.PROJECTS_KEY) || '[]';
    const allProjects = JSON.parse(projectsJson);

    const canvasData = JSON.stringify(canvas.toJSON());
    const thumbnail = canvas.toDataURL({ format: 'png', quality: 0.5, multiplier: 0.2 });

    let project: Project;

    if (existingProjectId) {
      // Actualizar proyecto existente
      const index = allProjects.findIndex((p: Project) => p.id === existingProjectId);
      if (index !== -1) {
        project = {
          ...allProjects[index],
          name,
          folderId,
          canvasData,
          thumbnail,
          updatedAt: new Date().toISOString(),
        };
        allProjects[index] = project;
      } else {
        throw new Error('Project not found');
      }
    } else {
      // Crear nuevo proyecto
      project = {
        id: crypto.randomUUID(),
        userId,
        name,
        folderId,
        templateId,
        canvasData,
        thumbnail,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      allProjects.push(project);
    }

    localStorage.setItem(this.PROJECTS_KEY, JSON.stringify(allProjects));
    return project;
  }

  static deleteProject(projectId: string): void {
    const projectsJson = localStorage.getItem(this.PROJECTS_KEY) || '[]';
    const allProjects = JSON.parse(projectsJson);
    const filtered = allProjects.filter((p: Project) => p.id !== projectId);
    localStorage.setItem(this.PROJECTS_KEY, JSON.stringify(filtered));
  }

  static duplicateProject(projectId: string): Project | null {
    const original = this.getProject(projectId);
    if (!original) return null;

    const duplicate: Project = {
      ...original,
      id: crypto.randomUUID(),
      name: `${original.name} (copia)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const projectsJson = localStorage.getItem(this.PROJECTS_KEY) || '[]';
    const allProjects = JSON.parse(projectsJson);
    allProjects.push(duplicate);
    localStorage.setItem(this.PROJECTS_KEY, JSON.stringify(allProjects));

    return duplicate;
  }

  // Carpetas
  static getFolders(userId: string): Folder[] {
    const foldersJson = localStorage.getItem(this.FOLDERS_KEY) || '[]';
    const allFolders = JSON.parse(foldersJson);
    return allFolders.filter((f: Folder) => f.userId === userId);
  }

  static createFolder(userId: string, name: string, color?: string): Folder {
    const foldersJson = localStorage.getItem(this.FOLDERS_KEY) || '[]';
    const allFolders = JSON.parse(foldersJson);

    const folder: Folder = {
      id: crypto.randomUUID(),
      userId,
      name,
      color,
      createdAt: new Date().toISOString(),
    };

    allFolders.push(folder);
    localStorage.setItem(this.FOLDERS_KEY, JSON.stringify(allFolders));
    return folder;
  }

  static updateFolder(folderId: string, updates: Partial<Folder>): void {
    const foldersJson = localStorage.getItem(this.FOLDERS_KEY) || '[]';
    const allFolders = JSON.parse(foldersJson);
    const index = allFolders.findIndex((f: Folder) => f.id === folderId);

    if (index !== -1) {
      allFolders[index] = { ...allFolders[index], ...updates };
      localStorage.setItem(this.FOLDERS_KEY, JSON.stringify(allFolders));
    }
  }

  static deleteFolder(folderId: string): void {
    // Mover proyectos de esta carpeta a "sin carpeta"
    const projectsJson = localStorage.getItem(this.PROJECTS_KEY) || '[]';
    const allProjects = JSON.parse(projectsJson);
    const updatedProjects = allProjects.map((p: Project) =>
      p.folderId === folderId ? { ...p, folderId: null } : p
    );
    localStorage.setItem(this.PROJECTS_KEY, JSON.stringify(updatedProjects));

    // Eliminar carpeta
    const foldersJson = localStorage.getItem(this.FOLDERS_KEY) || '[]';
    const allFolders = JSON.parse(foldersJson);
    const filtered = allFolders.filter((f: Folder) => f.id !== folderId);
    localStorage.setItem(this.FOLDERS_KEY, JSON.stringify(filtered));
  }
}

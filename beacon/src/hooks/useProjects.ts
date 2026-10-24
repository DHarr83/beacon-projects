import { useCallback, useEffect, useState } from 'react';
import { loadDataSync, loadServerData, saveData } from '../api/beacon-store';
import type { Project, ProjectTask, ProjectTaskStatus } from '../types/projects';

const STORAGE_KEY = 'beacon-projects';
const COLORS = ['#3b82f6', '#8b5cf6', '#14b8a6', '#f97316', '#ec4899', '#22c55e'];

const id = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function defaultProjects(): Project[] {
  return [];
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>(() => loadDataSync(STORAGE_KEY, defaultProjects()));
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    loadServerData<Project[]>(STORAGE_KEY).then((server) => {
      if (!active) return;
      if (server) setProjects(server);
      setLoaded(true);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (loaded) void saveData(STORAGE_KEY, projects);
  }, [loaded, projects]);

  const addProject = useCallback((name: string, owner = '') => {
    const now = new Date().toISOString();
    const project: Project = {
      id: id('project'), name: name.trim(), owner, description: '',
      color: COLORS[projects.length % COLORS.length], status: 'active', dueDate: '',
      createdAt: now, sections: [{ id: id('section'), name: 'Planning', tasks: [] }],
    };
    setProjects((prev) => [...prev, project]);
    return project.id;
  }, [projects.length]);

  const updateProject = useCallback((projectId: string, patch: Partial<Project>) => {
    setProjects((prev) => prev.map((p) => p.id === projectId ? { ...p, ...patch } : p));
  }, []);

  const removeProject = useCallback((projectId: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
  }, []);

  const addSection = useCallback((projectId: string, name: string) => {
    setProjects((prev) => prev.map((p) => p.id === projectId
      ? { ...p, sections: [...p.sections, { id: id('section'), name: name.trim(), tasks: [] }] }
      : p));
  }, []);

  const updateTask = useCallback((projectId: string, sectionId: string, taskId: string, patch: Partial<ProjectTask>) => {
    setProjects((prev) => prev.map((p) => p.id !== projectId ? p : {
      ...p, sections: p.sections.map((s) => s.id !== sectionId ? s : {
        ...s, tasks: s.tasks.map((t) => t.id === taskId ? { ...t, ...patch } : t),
      }),
    }));
  }, []);

  const addTask = useCallback((projectId: string, sectionId: string, title: string) => {
    const task: ProjectTask = {
      id: id('task'), title: title.trim(), description: '', status: 'backlog',
      assignee: '', priority: 'normal', dueDate: '', comments: [], attachments: [],
      createdAt: new Date().toISOString(),
    };
    setProjects((prev) => prev.map((p) => p.id !== projectId ? p : {
      ...p, sections: p.sections.map((s) => s.id === sectionId ? { ...s, tasks: [...s.tasks, task] } : s),
    }));
  }, []);

  const moveTask = useCallback((projectId: string, sectionId: string, taskId: string, status: ProjectTaskStatus) => {
    updateTask(projectId, sectionId, taskId, { status });
  }, [updateTask]);

  const deleteTask = useCallback((projectId: string, sectionId: string, taskId: string) => {
    setProjects((prev) => prev.map((p) => p.id !== projectId ? p : {
      ...p, sections: p.sections.map((s) => s.id !== sectionId ? s : { ...s, tasks: s.tasks.filter((t) => t.id !== taskId) }),
    }));
  }, []);

  return { projects, addProject, updateProject, removeProject, addSection, addTask, updateTask, moveTask, deleteTask };
}


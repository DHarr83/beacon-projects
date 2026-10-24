export type ProjectStatus = 'active' | 'on-hold' | 'completed';
export type ProjectTaskStatus = 'backlog' | 'next' | 'in-progress' | 'blocked' | 'done';

export interface ProjectComment {
  id: string;
  author: string;
  body: string;
  createdAt: string;
}

export interface ProjectAttachment {
  id: string;
  name: string;
  url: string;
  kind: 'image' | 'file' | 'link';
}

export interface ProjectTask {
  id: string;
  title: string;
  description: string;
  status: ProjectTaskStatus;
  assignee: string;
  priority: 'low' | 'normal' | 'high';
  dueDate: string;
  comments: ProjectComment[];
  attachments: ProjectAttachment[];
  createdAt: string;
}

export interface ProjectSection {
  id: string;
  name: string;
  tasks: ProjectTask[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  status: ProjectStatus;
  owner: string;
  dueDate: string;
  sections: ProjectSection[];
  createdAt: string;
}


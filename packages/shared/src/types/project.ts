export interface ProjectDto {
  id: string;
  name: string;
  url: string;
  createdAt: string;
  updatedAt: string;
  executionCount?: number;
}

export interface CreateProjectDto {
  name: string;
  url: string;
}

export interface ProjectDto {
  id: string;
  name: string;
  url: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectDto {
  name: string;
  url: string;
}

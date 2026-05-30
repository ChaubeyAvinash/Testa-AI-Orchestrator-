import type { ProjectDto, CreateProjectDto, ExecutionDto, CreateExecutionDto, TestResultDto } from '@testa/shared';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}/api/v1${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText);
    throw new Error(err);
  }
  return res.json() as Promise<T>;
}

export const api = {
  projects: {
    list: () => request<ProjectDto[]>('/projects'),
    get: (id: string) => request<ProjectDto>(`/projects/${id}`),
    create: (dto: CreateProjectDto) =>
      request<ProjectDto>('/projects', { method: 'POST', body: JSON.stringify(dto) }),
  },
  executions: {
    create: (dto: CreateExecutionDto) =>
      request<ExecutionDto>('/executions', { method: 'POST', body: JSON.stringify(dto) }),
    get: (id: string) => request<ExecutionDto>(`/executions/${id}`),
    results: (id: string) => request<TestResultDto[]>(`/executions/${id}/results`),
    generatedCode: (id: string) => request<{ code: string }>(`/executions/${id}/generated-code`),
    byProject: (projectId: string) => request<ExecutionDto[]>(`/projects/${projectId}/executions`),
  },
};

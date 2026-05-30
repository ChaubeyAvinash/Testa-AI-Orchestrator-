'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';
import type { ProjectDto } from '@testa/shared';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.projects.list()
      .then(setProjects)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-8 py-14 text-[#737373] font-mono text-sm">
        Loading projects...
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-8 py-14 space-y-10">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 bg-[#a100ff]" />
          <h1 className="text-4xl font-black tracking-tight uppercase">History</h1>
        </div>
        <a
          href="/projects/new"
          className="text-xs tracking-widest uppercase border border-[#1e1e1e] px-5 py-3 text-[#737373] hover:border-[#a100ff] hover:text-white transition-colors"
        >
          {'>'} New Run
        </a>
      </div>

      {projects.length === 0 ? (
        <div className="border border-[#1e1e1e] bg-[#0d0d0d] px-8 py-16 text-center">
          <p className="text-[#444] font-mono text-sm">No projects yet.</p>
          <a
            href="/projects/new"
            className="inline-block mt-6 text-xs tracking-widest uppercase border border-[#1e1e1e] px-5 py-3 text-[#737373] hover:border-[#a100ff] hover:text-white transition-colors"
          >
            {'>'} Start your first run
          </a>
        </div>
      ) : (
        <div className="border border-[#1e1e1e] divide-y divide-[#1e1e1e]">
          {/* Table header */}
          <div className="grid grid-cols-12 px-6 py-3 bg-[#0d0d0d]">
            <span className="col-span-4 text-xs tracking-widest uppercase text-[#444]">Project</span>
            <span className="col-span-4 text-xs tracking-widest uppercase text-[#444]">URL</span>
            <span className="col-span-2 text-xs tracking-widest uppercase text-[#444] text-center">Runs</span>
            <span className="col-span-2 text-xs tracking-widest uppercase text-[#444] text-right">Actions</span>
          </div>

          {projects.map((project) => (
            <div key={project.id} className="grid grid-cols-12 items-center px-6 py-5 hover:bg-[#0d0d0d] transition-colors">
              <div className="col-span-4">
                <p className="text-sm font-bold text-white truncate">{project.name}</p>
                <p className="text-xs font-mono text-[#444] mt-0.5">{project.id}</p>
              </div>

              <div className="col-span-4">
                <p className="text-xs font-mono text-[#737373] truncate">{project.url}</p>
              </div>

              <div className="col-span-2 text-center">
                <span className="text-2xl font-black text-[#a100ff]">
                  {project.executionCount ?? 0}
                </span>
                <p className="text-xs text-[#444] uppercase tracking-widest mt-0.5">runs</p>
              </div>

              <div className="col-span-2 flex justify-end gap-3">
                <a
                  href={`/projects/${project.id}`}
                  className="text-xs tracking-widest uppercase text-[#737373] hover:text-[#a100ff] transition-colors"
                >
                  History
                </a>
                <a
                  href={`/projects/new?projectId=${project.id}`}
                  className="text-xs tracking-widest uppercase text-[#737373] hover:text-white transition-colors"
                >
                  Run
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

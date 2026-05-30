'use client';

import { use, useEffect, useState } from 'react';
import { api } from '@/lib/api-client';
import type { ProjectDto, ExecutionDto } from '@testa/shared';
import { ExecutionStatus } from '@testa/shared';

const STATUS_COLORS: Record<string, string> = {
  [ExecutionStatus.COMPLETED]: '#00cc66',
  [ExecutionStatus.FAILED]:    '#ff3333',
  [ExecutionStatus.RUNNING]:   '#a100ff',
  [ExecutionStatus.ANALYZING]: '#a100ff',
  [ExecutionStatus.GENERATING]:'#a100ff',
  [ExecutionStatus.CRAWLING]:  '#a100ff',
  [ExecutionStatus.PENDING]:   '#737373',
};

function passRate(e: ExecutionDto) {
  return e.totalTests > 0 ? Math.round((e.passedTests / e.totalTests) * 100) : null;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    + ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [project, setProject] = useState<ProjectDto | null>(null);
  const [executions, setExecutions] = useState<ExecutionDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.projects.get(id), api.executions.byProject(id)])
      .then(([proj, execs]) => { setProject(proj); setExecutions(execs); })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-8 py-14 text-[#737373] font-mono text-sm">
        Loading history...
      </div>
    );
  }

  if (!project) {
    return (
      <div className="max-w-5xl mx-auto px-8 py-14 text-[#ff3333] font-mono text-sm">
        Project not found.
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-8 py-14 space-y-10">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1 h-8 bg-[#a100ff]" />
            <h1 className="text-4xl font-black tracking-tight uppercase">{project.name}</h1>
          </div>
          <p className="text-[#737373] text-xs font-mono ml-4">{project.url}</p>
          <a
            href="/projects"
            className="ml-4 mt-2 inline-block text-xs tracking-widest uppercase text-[#444] hover:text-[#a100ff] transition-colors"
          >
            {'<'} All Projects
          </a>
        </div>
        <a
          href="/projects/new"
          className="text-xs tracking-widest uppercase border border-[#1e1e1e] px-5 py-3 text-[#737373] hover:border-[#a100ff] hover:text-white transition-colors"
        >
          {'>'} New Run
        </a>
      </div>

      {/* Execution history table */}
      {executions.length === 0 ? (
        <div className="border border-[#1e1e1e] bg-[#0d0d0d] px-8 py-16 text-center">
          <p className="text-[#444] font-mono text-sm">No executions yet for this project.</p>
          <a
            href="/projects/new"
            className="inline-block mt-6 text-xs tracking-widest uppercase border border-[#1e1e1e] px-5 py-3 text-[#737373] hover:border-[#a100ff] hover:text-white transition-colors"
          >
            {'>'} Run tests now
          </a>
        </div>
      ) : (
        <div className="border border-[#1e1e1e]">
          {/* Table header */}
          <div className="grid grid-cols-12 px-6 py-3 bg-[#0d0d0d] border-b border-[#1e1e1e]">
            <span className="col-span-3 text-xs tracking-widest uppercase text-[#444]">Date</span>
            <span className="col-span-2 text-xs tracking-widest uppercase text-[#444]">Status</span>
            <span className="col-span-2 text-xs tracking-widest uppercase text-[#444]">Tests</span>
            <span className="col-span-2 text-xs tracking-widest uppercase text-[#444]">Pass Rate</span>
            <span className="col-span-2 text-xs tracking-widest uppercase text-[#444]">Source</span>
            <span className="col-span-1 text-xs tracking-widest uppercase text-[#444] text-right">Report</span>
          </div>

          <div className="divide-y divide-[#1e1e1e]">
            {executions.map((exec) => {
              const rate = passRate(exec);
              const rateColor = rate === null ? '#737373'
                : rate >= 80 ? '#00cc66'
                : rate >= 50 ? '#ffaa00'
                : '#ff3333';

              return (
                <div key={exec.id} className="grid grid-cols-12 items-center px-6 py-4 hover:bg-[#0d0d0d] transition-colors">

                  {/* Date */}
                  <div className="col-span-3">
                    <p className="text-xs font-mono text-[#ccc]">{formatDate(exec.createdAt)}</p>
                    <p className="text-xs font-mono text-[#444] mt-0.5 truncate">
                      {(exec.testTypes ?? []).join(', ')}
                    </p>
                  </div>

                  {/* Status badge */}
                  <div className="col-span-2">
                    <span
                      className="text-xs font-bold tracking-widest px-2 py-1"
                      style={{
                        color: STATUS_COLORS[exec.status] ?? '#737373',
                        background: `${STATUS_COLORS[exec.status] ?? '#737373'}18`,
                      }}
                    >
                      {exec.status}
                    </span>
                  </div>

                  {/* Test counts */}
                  <div className="col-span-2">
                    {exec.totalTests > 0 ? (
                      <p className="text-xs font-mono">
                        <span className="text-[#00cc66]">{exec.passedTests}↑</span>
                        <span className="text-[#444] mx-1">/</span>
                        <span className="text-[#ff3333]">{exec.failedTests}↓</span>
                        <span className="text-[#444] ml-1">of {exec.totalTests}</span>
                      </p>
                    ) : (
                      <span className="text-xs text-[#444]">—</span>
                    )}
                  </div>

                  {/* Pass rate */}
                  <div className="col-span-2">
                    {rate !== null ? (
                      <span className="text-sm font-black" style={{ color: rateColor }}>{rate}%</span>
                    ) : (
                      <span className="text-xs text-[#444]">—</span>
                    )}
                  </div>

                  {/* Source badge */}
                  <div className="col-span-2">
                    {exec.isMock === true && (
                      <span className="text-xs font-bold tracking-widest px-2 py-1 bg-[#ffaa0018] text-[#ffaa00]">
                        SAMPLE
                      </span>
                    )}
                    {exec.isMock === false && (
                      <span className="text-xs font-bold tracking-widest px-2 py-1 bg-[#a100ff18] text-[#a100ff]">
                        REAL AI
                      </span>
                    )}
                    {exec.isMock === undefined || exec.isMock === null ? (
                      <span className="text-xs text-[#444]">—</span>
                    ) : null}
                  </div>

                  {/* Report link */}
                  <div className="col-span-1 text-right">
                    {exec.status === ExecutionStatus.COMPLETED ? (
                      <a
                        href={`/executions/${exec.id}/report`}
                        className="text-xs tracking-widest uppercase text-[#a100ff] hover:text-white transition-colors"
                      >
                        View
                      </a>
                    ) : exec.status === ExecutionStatus.FAILED ? (
                      <span className="text-xs text-[#444]">—</span>
                    ) : (
                      <a
                        href={`/executions/${exec.id}`}
                        className="text-xs tracking-widest uppercase text-[#737373] hover:text-white transition-colors"
                      >
                        Live
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

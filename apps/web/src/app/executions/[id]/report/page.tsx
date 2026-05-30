'use client';

import { use, useEffect, useState } from 'react';
import { api } from '@/lib/api-client';
import type { ExecutionDto, TestResultDto } from '@testa/shared';
import { TestStatus } from '@testa/shared';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// '<svg' base64-encodes to 'PHN2' — use svg+xml MIME type for SVG placeholders
function screenshotSrc(base64: string): string {
  return base64.startsWith('PHN2')
    ? `data:image/svg+xml;base64,${base64}`
    : `data:image/png;base64,${base64}`;
}

const COLORS = {
  pass: '#00cc66',
  fail: '#ff3333',
  skip: '#444444',
  purple: '#a100ff',
};

export default function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [execution, setExecution] = useState<ExecutionDto | null>(null);
  const [results, setResults] = useState<TestResultDto[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.executions.get(id), api.executions.results(id)])
      .then(([exec, res]) => { setExecution(exec); setResults(res); })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="max-w-5xl mx-auto px-8 py-14 text-[#737373] font-mono text-sm">
      Loading report...
    </div>
  );
  if (!execution) return (
    <div className="max-w-5xl mx-auto px-8 py-14 text-[#ff3333] font-mono text-sm">
      Execution not found.
    </div>
  );

  const skipped = Math.max(0, execution.totalTests - execution.passedTests - execution.failedTests);
  const passRate = execution.totalTests > 0
    ? Math.round((execution.passedTests / execution.totalTests) * 100) : 0;

  const pieData = [
    { name: 'Passed',  value: execution.passedTests, color: COLORS.pass },
    { name: 'Failed',  value: execution.failedTests, color: COLORS.fail },
    ...(skipped > 0 ? [{ name: 'Skipped', value: skipped, color: COLORS.skip }] : []),
  ].filter((d) => d.value > 0);

  const durationSec = execution.completedAt && execution.startedAt
    ? Math.round((new Date(execution.completedAt).getTime() - new Date(execution.startedAt).getTime()) / 1000)
    : null;

  const passColor = passRate >= 80 ? COLORS.pass : passRate >= 50 ? '#ffaa00' : COLORS.fail;

  return (
    <div className="max-w-5xl mx-auto px-8 py-14 space-y-10">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1 h-8 bg-[#a100ff]" />
            <h1 className="text-4xl font-black tracking-tight uppercase">Test Report</h1>
          </div>
          <p className="text-[#444] text-xs font-mono ml-4">{id}</p>
          {durationSec !== null && (
            <p className="text-[#737373] text-xs ml-4 mt-1 tracking-wide uppercase">
              Completed in {durationSec}s &nbsp;&bull;&nbsp; {(execution as any).testTypes?.join(', ') ?? ''}
            </p>
          )}
          <div className="ml-4 mt-2">
            {execution.isMock === true && (
              <span
                className="text-xs font-bold tracking-widest px-2.5 py-1 bg-[#ffaa0018] text-[#ffaa00]"
                title="Azure AI was unavailable — results are illustrative sample data"
              >
                SAMPLE DATA
              </span>
            )}
            {execution.isMock === false && (
              <span
                className="text-xs font-bold tracking-widest px-2.5 py-1 bg-[#a100ff18] text-[#a100ff]"
                title="Generated and executed by Azure AI"
              >
                REAL AI
              </span>
            )}
          </div>
        </div>
        <a
          href="/projects/new"
          className="text-xs tracking-widest uppercase border border-[#1e1e1e] px-5 py-3 text-[#737373] hover:border-[#a100ff] hover:text-white transition-colors"
        >
          {'>'} New Run
        </a>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-4 gap-px bg-[#1e1e1e]">
        {[
          { label: 'PASS RATE',     value: `${passRate}%`, color: passColor      },
          { label: 'TOTAL TESTS',   value: execution.totalTests,   color: '#fff'      },
          { label: 'PASSED',        value: execution.passedTests,  color: COLORS.pass },
          { label: 'FAILED',        value: execution.failedTests,  color: COLORS.fail },
        ].map((m) => (
          <div key={m.label} className="bg-[#0d0d0d] px-6 py-7 text-center">
            <div className="text-5xl font-black" style={{ color: m.color }}>{m.value}</div>
            <div className="text-xs tracking-widest uppercase text-[#737373] mt-3">{m.label}</div>
          </div>
        ))}
      </div>

      {/* Charts + breakdown */}
      <div className="grid grid-cols-5 gap-4">

        {/* Pie chart */}
        <div className="col-span-2 border border-[#1e1e1e] bg-[#0d0d0d] p-6">
          <div className="text-xs tracking-widest uppercase text-[#737373] mb-4">DISTRIBUTION</div>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={2}>
                  {pieData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#111', border: '1px solid #1e1e1e', color: '#fff', fontSize: '12px' }}
                  labelStyle={{ color: '#a100ff' }}
                />
                <Legend iconType="square" iconSize={8} wrapperStyle={{ fontSize: '11px', color: '#737373' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-[#444] text-xs text-center pt-8">No data</div>
          )}
        </div>

        {/* Status breakdown bar */}
        <div className="col-span-3 border border-[#1e1e1e] bg-[#0d0d0d] p-6">
          <div className="text-xs tracking-widest uppercase text-[#737373] mb-5">COVERAGE BREAKDOWN</div>
          <div className="space-y-4">
            {[
              { label: 'Passed',  val: execution.passedTests,  total: execution.totalTests, color: COLORS.pass },
              { label: 'Failed',  val: execution.failedTests,  total: execution.totalTests, color: COLORS.fail },
              { label: 'Skipped', val: skipped,                total: execution.totalTests, color: COLORS.skip },
            ].map((row) => {
              const pct = execution.totalTests > 0 ? (row.val / execution.totalTests) * 100 : 0;
              return (
                <div key={row.label}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-[#737373] uppercase tracking-wider">{row.label}</span>
                    <span className="font-mono" style={{ color: row.color }}>{row.val}</span>
                  </div>
                  <div className="h-1 bg-[#1e1e1e]">
                    <div className="h-1 transition-all" style={{ width: `${pct}%`, background: row.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Results table */}
      <div className="border border-[#1e1e1e]">
        <div className="border-b border-[#1e1e1e] px-6 py-4 flex items-center justify-between bg-[#0d0d0d]">
          <span className="text-xs tracking-widest uppercase text-[#737373]">All Test Results</span>
          <span className="text-xs font-mono text-[#444]">{results.length} tests</span>
        </div>

        <div className="divide-y divide-[#1e1e1e]">
          {results.map((result) => (
            <div key={result.id}>
              <button
                onClick={() => setExpanded(expanded === result.id ? null : result.id)}
                className="w-full flex items-center gap-4 px-6 py-4 hover:bg-[#0d0d0d] text-left transition-colors group"
              >
                {/* Status badge */}
                <span
                  className="text-xs font-bold tracking-widest px-2.5 py-1 flex-shrink-0"
                  style={{
                    background: result.status === TestStatus.PASSED ? 'rgba(0,204,102,0.12)'
                              : result.status === TestStatus.FAILED ? 'rgba(255,51,51,0.12)'
                              : 'rgba(68,68,68,0.2)',
                    color: result.status === TestStatus.PASSED ? COLORS.pass
                         : result.status === TestStatus.FAILED ? COLORS.fail
                         : '#737373',
                  }}
                >
                  {result.status}
                </span>

                <span className="flex-1 text-sm text-[#ccc] group-hover:text-white transition-colors truncate">
                  {result.testName}
                </span>

                <span className="text-xs font-mono text-[#444] flex-shrink-0">{result.duration}ms</span>

                {result.status !== TestStatus.PASSED && (
                  <span className="text-[#a100ff] font-mono text-xs flex-shrink-0">
                    {expanded === result.id ? '▲' : '▼'}
                  </span>
                )}
              </button>

              {expanded === result.id && (
                <div className="px-6 py-5 bg-black border-t border-[#1e1e1e] space-y-5">

                  {result.errorMessage && (
                    <div>
                      <div className="text-xs tracking-widest uppercase text-[#ff3333] mb-2">Error</div>
                      <pre className="text-xs text-[#ccc] bg-[#0d0d0d] border border-[#1e1e1e] p-4 overflow-x-auto whitespace-pre-wrap leading-relaxed font-mono">
                        {result.errorMessage}
                      </pre>
                    </div>
                  )}

                  {result.aiSuggestion && (
                    <div className="border-l-2 border-[#a100ff] pl-4">
                      <div className="text-xs tracking-widest uppercase text-[#a100ff] mb-2">AI Diagnosis</div>
                      <p className="text-sm text-[#ccc] leading-relaxed">{result.aiSuggestion}</p>
                    </div>
                  )}

                  {result.screenshotBase64 && (
                    <div>
                      <div className="text-xs tracking-widest uppercase text-[#737373] mb-3">Failure Screenshot</div>
                      <button
                        onClick={() => setScreenshot(result.screenshotBase64!)}
                        className="block hover:opacity-80 transition-opacity"
                      >
                        <img
                          src={screenshotSrc(result.screenshotBase64!)}
                          alt="Failure screenshot"
                          className="max-h-48 border border-[#1e1e1e]"
                        />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {results.length === 0 && (
            <div className="px-6 py-10 text-center text-[#444] text-sm font-mono">
              No test results recorded.
            </div>
          )}
        </div>
      </div>

      {/* Screenshot lightbox */}
      {screenshot && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-8"
          style={{ background: 'rgba(0,0,0,0.92)' }}
          onClick={() => setScreenshot(null)}
        >
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setScreenshot(null)}
              className="absolute -top-10 right-0 text-xs tracking-widest uppercase text-[#737373] hover:text-[#a100ff] transition-colors"
            >
              {'>'} CLOSE
            </button>
            <img
              src={screenshotSrc(screenshot)}
              alt="Screenshot"
              className="max-w-full max-h-screen border border-[#1e1e1e]"
            />
          </div>
        </div>
      )}

    </div>
  );
}

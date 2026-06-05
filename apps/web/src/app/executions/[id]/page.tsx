'use client';

import { use, useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSSEStream } from '@/hooks/useSSEStream';
import type { SSEEvent, StageChangeData, TestCompleteData, CrawlProgressData } from '@testa/shared';
import { ExecutionStatus, TestStatus } from '@testa/shared';

type LogEntry = { time: string; message: string; level: 'pass' | 'fail' | 'info' | 'log' };
type FailedResult = { testName: string; errorMessage?: string; screenshotBase64?: string; duration: number };

// '<svg' base64-encodes to 'PHN2'
function screenshotSrc(base64: string): string {
  return base64.startsWith('PHN2')
    ? `data:image/svg+xml;base64,${base64}`
    : `data:image/png;base64,${base64}`;
}

const STAGES = [
  { id: ExecutionStatus.CRAWLING,   label: 'CRAWL'    },
  { id: ExecutionStatus.GENERATING, label: 'GENERATE' },
  { id: ExecutionStatus.RUNNING,    label: 'EXECUTE'  },
  { id: ExecutionStatus.ANALYZING,  label: 'ANALYZE'  },
];
const STAGE_ORDER = [
  ExecutionStatus.CRAWLING, ExecutionStatus.GENERATING,
  ExecutionStatus.RUNNING,  ExecutionStatus.ANALYZING,
  ExecutionStatus.COMPLETED,
];

export default function ExecutionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [currentStage, setCurrentStage] = useState<ExecutionStatus>(ExecutionStatus.PENDING);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [passed, setPassed] = useState(0);
  const [failed, setFailed] = useState(0);
  const [pages, setPages] = useState(0);
  const [done, setDone] = useState(false);
  const [failedResults, setFailedResults] = useState<FailedResult[]>([]);
  const [expandedScreenshot, setExpandedScreenshot] = useState<string | null>(null);

  // If the pipeline already completed before the SSE stream connected, redirect immediately
  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    fetch(`${base}/api/v1/executions/${id}`)
      .then((r) => r.json())
      .then((exec) => {
        if (exec?.status === ExecutionStatus.COMPLETED) {
          router.replace(`/executions/${id}/report`);
        } else if (exec?.status === ExecutionStatus.FAILED) {
          setDone(true);
        }
      })
      .catch(() => {});
  }, [id, router]);

  const addLog = (message: string, level: LogEntry['level'] = 'log') =>
    setLog((prev) => [...prev, { time: new Date().toLocaleTimeString('en', { hour12: false }), message, level }]);

  const handleEvent = useCallback((event: SSEEvent) => {
    switch (event.event) {
      case 'stage_change': {
        const d = event.data as StageChangeData;
        setCurrentStage(d.stage);
        addLog(d.message, 'info');
        break;
      }
      case 'crawl_progress': {
        const d = event.data as CrawlProgressData;
        setPages(d.pagesFound);
        addLog(`Discovered: ${d.currentUrl}`);
        break;
      }
      case 'generation_complete':
        addLog('Test code generation complete', 'info');
        break;
      case 'test_complete': {
        const d = event.data as TestCompleteData;
        if (d.status === TestStatus.PASSED) {
          setPassed((p) => p + 1);
          addLog(`PASS  ${d.testName}  (${d.duration}ms)`, 'pass');
        } else {
          setFailed((f) => f + 1);
          addLog(`FAIL  ${d.testName}  ${d.errorMessage ? '— ' + d.errorMessage.slice(0, 80) : ''}`, 'fail');
          setFailedResults((prev) => [...prev, {
            testName: d.testName,
            errorMessage: d.errorMessage,
            screenshotBase64: d.screenshotBase64,
            duration: d.duration,
          }]);
        }
        break;
      }
      case 'execution_complete':
        setCurrentStage(ExecutionStatus.COMPLETED);
        setDone(true);
        addLog('Execution complete. Redirecting to report...', 'info');
        setTimeout(() => router.push(`/executions/${id}/report`), 1800);
        break;
      case 'error': {
        const d = event.data as { message: string };
        addLog(`ERROR: ${d.message}`, 'fail');
        setDone(true);
        break;
      }
    }
  }, [id, router]);

  useSSEStream(id, handleEvent);

  const currentIdx = STAGE_ORDER.indexOf(currentStage);

  return (
    <div className="max-w-4xl mx-auto px-8 py-14 space-y-10">

      {/* Page heading */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-1 h-6 bg-[#a100ff]" />
          <h1 className="text-2xl font-black tracking-tight uppercase">Live Execution</h1>
        </div>
        <p className="text-[#444] text-xs font-mono ml-4">{id}</p>
      </div>

      {/* Stage pipeline */}
      <div className="border border-[#1e1e1e] bg-[#0d0d0d]">
        <div className="flex">
          {STAGES.map((stage, i) => {
            const stageIdx = STAGE_ORDER.indexOf(stage.id);
            const isComplete = currentIdx > stageIdx;
            const isActive   = currentIdx === stageIdx;
            return (
              <div
                key={stage.id}
                className="flex-1 px-6 py-5 border-r border-[#1e1e1e] last:border-r-0"
                style={{ background: isActive ? 'rgba(161,0,255,0.1)' : 'transparent' }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="font-mono text-xs font-bold"
                    style={{ color: isComplete ? '#00cc66' : isActive ? '#a100ff' : '#444' }}
                  >
                    {isComplete ? '✓' : isActive ? '◉' : String(i + 1).padStart(2, '0')}
                  </span>
                  <span
                    className="text-xs font-bold tracking-widest uppercase"
                    style={{ color: isComplete ? '#00cc66' : isActive ? '#fff' : '#444' }}
                  >
                    {stage.label}
                  </span>
                </div>
                {isActive && (
                  <div className="h-0.5 mt-2" style={{ background: '#a100ff', animation: 'pulse 2s infinite' }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'PAGES CRAWLED',  value: pages,  color: '#a100ff' },
          { label: 'TESTS PASSED',   value: passed, color: '#00cc66' },
          { label: 'TESTS FAILED',   value: failed, color: '#ff3333' },
        ].map((m) => (
          <div key={m.label} className="border border-[#1e1e1e] bg-[#0d0d0d] p-6">
            <div className="text-4xl font-black" style={{ color: m.color }}>{m.value}</div>
            <div className="text-xs tracking-widest uppercase text-[#737373] mt-2">{m.label}</div>
          </div>
        ))}
      </div>

      {/* Live log terminal */}
      <div className="border border-[#1e1e1e] bg-black">
        <div className="border-b border-[#1e1e1e] px-5 py-3 flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#ff3333]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#ffaa00]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#00cc66]" />
          <span className="ml-3 text-[#444] text-xs font-mono tracking-widest">EXECUTION LOG</span>
        </div>
        <div className="font-mono text-xs p-5 space-y-1 max-h-80 overflow-y-auto">
          {log.length === 0 && (
            <span className="text-[#444]">Waiting for pipeline to start...</span>
          )}
          {log.map((entry, i) => (
            <div key={i} className="flex gap-4">
              <span className="text-[#444] flex-shrink-0 w-20">{entry.time}</span>
              <span style={{
                color: entry.level === 'pass' ? '#00cc66'
                     : entry.level === 'fail' ? '#ff3333'
                     : entry.level === 'info' ? '#a100ff'
                     : '#737373',
              }}>
                {entry.message}
              </span>
            </div>
          ))}
          {done && currentStage === ExecutionStatus.COMPLETED && (
            <div className="text-[#a100ff] pt-2">{'>'} Redirecting to report...</div>
          )}
        </div>
      </div>

      {/* Failed test screenshots — appear live as tests fail */}
      {failedResults.length > 0 && (
        <div className="border border-[#1e1e1e]">
          <div className="border-b border-[#1e1e1e] px-5 py-3 bg-[#0d0d0d] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-widest uppercase text-[#ff3333]">
                Failed Tests
              </span>
              <span className="text-xs font-mono text-[#444]">({failedResults.length})</span>
            </div>
          </div>

          <div className="divide-y divide-[#1e1e1e]">
            {failedResults.map((r, i) => (
              <div key={i} className="p-5 space-y-3">
                {/* Test name + duration */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold tracking-widest px-2 py-0.5 bg-[#ff333318] text-[#ff3333]">
                      FAIL
                    </span>
                    <span className="text-sm text-[#ccc] font-mono">{r.testName}</span>
                  </div>
                  <span className="text-xs text-[#444] font-mono flex-shrink-0">{r.duration}ms</span>
                </div>

                {/* Error message */}
                {r.errorMessage && (
                  <pre className="text-xs text-[#737373] bg-[#0d0d0d] border border-[#1e1e1e] p-3 overflow-x-auto whitespace-pre-wrap leading-relaxed font-mono">
                    {r.errorMessage}
                  </pre>
                )}

                {/* Screenshot */}
                {r.screenshotBase64 && (
                  <div>
                    <div className="text-xs tracking-widest uppercase text-[#444] mb-2">Failure Screenshot</div>
                    <button
                      onClick={() => setExpandedScreenshot(r.screenshotBase64!)}
                      className="block hover:opacity-80 transition-opacity"
                    >
                      <img
                        src={screenshotSrc(r.screenshotBase64)}
                        alt={`Failure screenshot — ${r.testName}`}
                        className="max-h-44 border border-[#1e1e1e]"
                      />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fullscreen screenshot lightbox */}
      {expandedScreenshot && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-8"
          style={{ background: 'rgba(0,0,0,0.92)' }}
          onClick={() => setExpandedScreenshot(null)}
        >
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setExpandedScreenshot(null)}
              className="absolute -top-10 right-0 text-xs tracking-widest uppercase text-[#737373] hover:text-[#a100ff] transition-colors"
            >
              {'>'} CLOSE
            </button>
            <img
              src={screenshotSrc(expandedScreenshot)}
              alt="Screenshot"
              className="max-w-full max-h-screen border border-[#1e1e1e]"
            />
          </div>
        </div>
      )}

    </div>
  );
}

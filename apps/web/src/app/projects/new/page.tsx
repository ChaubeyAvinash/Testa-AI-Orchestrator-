'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';

const TEST_TYPES = [
  { id: 'navigation', label: 'Navigation Testing', desc: 'Verify all discovered pages load correctly and return no errors' },
  { id: 'forms',      label: 'Form Validation',   desc: 'Fill and submit every form with realistic test data' },
  { id: 'accessibility', label: 'Accessibility Audit', desc: 'Check alt text, ARIA labels, and heading hierarchy' },
  { id: 'visual',     label: 'Visual Regression', desc: 'Capture full-page screenshots for comparison' },
  { id: 'api',        label: 'API Intercept',     desc: 'Assert all XHR/fetch calls return 2xx status codes' },
];

export default function NewProjectPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set(['navigation', 'forms']));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggle = (id: string) =>
    setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !url || selected.size === 0) { setError('All fields and at least one test type are required.'); return; }
    setError('');
    setLoading(true);
    try {
      const project = await api.projects.create({ name, url });
      const execution = await api.executions.create({ projectId: project.id, testTypes: Array.from(selected) });
      router.push(`/executions/${execution.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Request failed — check that the API is running.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-8 py-16">

      {/* Page heading */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1 h-8 bg-[#a100ff]" />
          <h1 className="text-4xl font-black tracking-tight">NEW TEST RUN</h1>
        </div>
        <p className="text-[#737373] text-sm leading-relaxed ml-4">
          Enter a target URL. TESTA will crawl the site, generate Playwright tests using Azure AI,
          execute them, and deliver a full diagnostic report.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">

        {/* Project Name */}
        <div>
          <label className="block text-xs font-bold tracking-widest uppercase text-[#737373] mb-2">
            Project Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My E-Commerce Site"
            className="w-full bg-[#0d0d0d] border border-[#1e1e1e] text-white placeholder-[#444] px-4 py-3 text-sm focus:outline-none focus:border-[#a100ff] transition-colors"
            required
          />
        </div>

        {/* Website URL */}
        <div>
          <label className="block text-xs font-bold tracking-widest uppercase text-[#737373] mb-2">
            Target URL
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="w-full bg-[#0d0d0d] border border-[#1e1e1e] text-white placeholder-[#444] px-4 py-3 text-sm focus:outline-none focus:border-[#a100ff] transition-colors"
            required
          />
        </div>

        {/* Test Type Selection */}
        <div>
          <label className="block text-xs font-bold tracking-widest uppercase text-[#737373] mb-4">
            Test Coverage
          </label>
          <div className="space-y-2">
            {TEST_TYPES.map((t) => {
              const isSelected = selected.has(t.id);
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => toggle(t.id)}
                  className="w-full flex items-center gap-4 px-5 py-4 text-left border transition-all"
                  style={{
                    background: isSelected ? 'rgba(161,0,255,0.08)' : '#0d0d0d',
                    borderColor: isSelected ? '#a100ff' : '#1e1e1e',
                  }}
                >
                  {/* Checkbox indicator */}
                  <div
                    className="flex-shrink-0 w-4 h-4 border flex items-center justify-center"
                    style={{ borderColor: isSelected ? '#a100ff' : '#444', background: isSelected ? '#a100ff' : 'transparent' }}
                  >
                    {isSelected && (
                      <svg viewBox="0 0 10 8" className="w-2.5 h-2" fill="none">
                        <polyline points="1,4 3.5,7 9,1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold tracking-wide" style={{ color: isSelected ? '#fff' : '#737373' }}>
                      {t.label}
                    </div>
                    <div className="text-xs text-[#444] mt-0.5">{t.desc}</div>
                  </div>
                  {isSelected && (
                    <span className="text-[#a100ff] font-mono text-xs font-bold flex-shrink-0">ACTIVE</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="border border-[#ff3333] bg-[#ff333310] px-4 py-3 text-[#ff3333] text-sm">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 text-sm font-bold tracking-widest uppercase transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: loading ? '#7500c0' : '#a100ff',
            color: '#fff',
          }}
        >
          {loading ? 'Initializing...' : 'Generate & Execute Tests  >'}
        </button>

        {/* Info strip */}
        <div className="border-l-2 border-[#1e1e1e] pl-4">
          <p className="text-[#444] text-xs leading-relaxed">
            Powered by <span className="text-[#a100ff]">Azure AI Foundry GPT-5.1</span> &nbsp;&bull;&nbsp;
            Tests run via <span className="text-[#a100ff]">Playwright</span> &nbsp;&bull;&nbsp;
            No infrastructure required
          </p>
        </div>

      </form>
    </div>
  );
}

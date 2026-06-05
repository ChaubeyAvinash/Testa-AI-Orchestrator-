'use client';

import { useEffect, useRef } from 'react';
import type { SSEEvent } from '@testa/shared';

export function useSSEStream(
  executionId: string | null,
  onEvent: (event: SSEEvent) => void,
  onComplete?: () => void,
) {
  const onEventRef = useRef(onEvent);
  const onCompleteRef = useRef(onComplete);
  onEventRef.current = onEvent;
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!executionId) return;

    const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const es = new EventSource(`${base}/api/v1/executions/${executionId}/stream`);

    es.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data) as SSEEvent;
        onEventRef.current(event);
        if (event.event === 'execution_complete' || event.event === 'error') {
          es.close();
          onCompleteRef.current?.();
        }
      } catch {
        // ignore parse errors
      }
    };

    es.onerror = () => {
      es.close();
      // Poll once to check if execution already completed while we were connecting
      const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      fetch(`${base}/api/v1/executions/${executionId}`)
        .then((r) => r.json())
        .then((exec) => {
          if (exec?.status === 'COMPLETED') {
            onEventRef.current({ event: 'execution_complete', executionId: executionId!, timestamp: new Date().toISOString(), data: {} } as any);
          }
        })
        .catch(() => {});
      onCompleteRef.current?.();
    };

    return () => es.close();
  }, [executionId]);
}

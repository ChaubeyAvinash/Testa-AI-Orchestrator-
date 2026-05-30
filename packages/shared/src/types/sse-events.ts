import { ExecutionStatus, TestStatus } from './enums';

export type SSEEventType =
  | 'stage_change'
  | 'crawl_progress'
  | 'generation_complete'
  | 'test_started'
  | 'test_complete'
  | 'analysis_complete'
  | 'execution_complete'
  | 'error';

export interface SSEEvent<T = unknown> {
  event: SSEEventType;
  executionId: string;
  timestamp: string;
  data: T;
}

export interface StageChangeData {
  stage: ExecutionStatus;
  message: string;
}

export interface CrawlProgressData {
  pagesFound: number;
  currentUrl: string;
}

export interface GenerationCompleteData {
  linesOfCode: number;
}

export interface TestStartedData {
  testName: string;
}

export interface TestCompleteData {
  testName: string;
  status: TestStatus;
  duration: number;
  errorMessage?: string;
}

export interface AnalysisCompleteData {
  failuresAnalyzed: number;
}

export interface ExecutionCompleteData {
  totalTests: number;
  passedTests: number;
  failedTests: number;
}

export interface ErrorData {
  message: string;
}

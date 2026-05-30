import { ExecutionStatus, TestStatus } from './enums';

export interface TestResultDto {
  id: string;
  executionId: string;
  testName: string;
  status: TestStatus;
  duration: number;
  errorMessage?: string;
  stackTrace?: string;
  screenshotBase64?: string;
  aiSuggestion?: string;
  createdAt: string;
}

export interface ExecutionDto {
  id: string;
  projectId: string;
  status: ExecutionStatus;
  testTypes: string[];
  totalTests: number;
  passedTests: number;
  failedTests: number;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface CreateExecutionDto {
  projectId: string;
  testTypes: string[];
  customPrompt?: string;
}

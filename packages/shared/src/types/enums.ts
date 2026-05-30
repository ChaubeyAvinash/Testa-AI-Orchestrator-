export enum ExecutionStatus {
  PENDING = 'PENDING',
  CRAWLING = 'CRAWLING',
  GENERATING = 'GENERATING',
  RUNNING = 'RUNNING',
  ANALYZING = 'ANALYZING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum TestStatus {
  PASSED = 'PASSED',
  FAILED = 'FAILED',
  SKIPPED = 'SKIPPED',
  TIMEDOUT = 'TIMEDOUT',
}

export enum TestType {
  NAVIGATION = 'navigation',
  FORMS = 'forms',
  ACCESSIBILITY = 'accessibility',
  VISUAL = 'visual',
  API = 'api',
}

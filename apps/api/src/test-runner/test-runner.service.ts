import { Injectable, Logger } from '@nestjs/common';
import { spawn } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { TestStatus } from '@testa/shared';

export interface TestRunResult {
  testName: string;
  status: TestStatus;
  duration: number;
  errorMessage?: string;
  stackTrace?: string;
  screenshotBase64?: string;
}

interface PlaywrightSuiteResult {
  title: string;
  suites?: PlaywrightSuiteResult[];
  specs?: PlaywrightSpecResult[];
}

interface PlaywrightSpecResult {
  title: string;
  tests: PlaywrightTestResult[];
}

interface PlaywrightTestResult {
  status: string;
  results: PlaywrightResultEntry[];
}

interface PlaywrightResultEntry {
  status: string;
  duration: number;
  error?: { message: string; stack?: string };
  attachments?: { name: string; path?: string; body?: string; contentType: string }[];
}

const PLAYWRIGHT_CONFIG = `
import { defineConfig } from '@playwright/test';
export default defineConfig({
  timeout: ${parseInt(process.env.PLAYWRIGHT_TEST_TIMEOUT || '30000')},
  retries: 0,
  workers: ${parseInt(process.env.PLAYWRIGHT_MAX_CONCURRENCY || '2')},
  use: {
    headless: true,
    screenshot: 'only-on-failure',
    video: 'off',
    trace: 'off',
  },
  reporter: [['json', { outputFile: 'results.json' }]],
});
`;

@Injectable()
export class TestRunnerService {
  private readonly logger = new Logger(TestRunnerService.name);

  async run(
    generatedCode: string,
    onTestComplete?: (result: TestRunResult) => void,
  ): Promise<TestRunResult[]> {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'testa-'));

    try {
      await fs.writeFile(path.join(tmpDir, 'generated.spec.ts'), generatedCode, 'utf-8');
      await fs.writeFile(path.join(tmpDir, 'playwright.config.ts'), PLAYWRIGHT_CONFIG, 'utf-8');

      // Copy node_modules resolution via symlink is complex in temp dirs;
      // install minimal playwright test runner locally
      await this.installPlaywrightLocally(tmpDir);

      const resultsPath = path.join(tmpDir, 'results.json');

      await new Promise<void>((resolve, reject) => {
        const child = spawn(
          'npx',
          ['playwright', 'test', 'generated.spec.ts', '--config', 'playwright.config.ts'],
          {
            cwd: tmpDir,
            env: {
              ...process.env,
              PLAYWRIGHT_JSON_OUTPUT_NAME: 'results.json',
            },
            shell: true,
          },
        );

        child.stdout.on('data', (data) => this.logger.verbose(data.toString().trim()));
        child.stderr.on('data', (data) => this.logger.verbose(data.toString().trim()));

        child.on('close', () => resolve());
        child.on('error', reject);
      });

      const raw = await fs.readFile(resultsPath, 'utf-8').catch(() => '{}');
      const report = JSON.parse(raw);
      const results = this.parseReport(report);

      // Attach screenshot base64 from test-results directory
      const testResultsDir = path.join(tmpDir, 'test-results');
      for (const result of results) {
        if (result.status === TestStatus.FAILED) {
          try {
            const files = await fs.readdir(testResultsDir).catch(() => []);
            const screenshot = files.find((f) => f.endsWith('.png'));
            if (screenshot) {
              const buf = await fs.readFile(path.join(testResultsDir, screenshot));
              result.screenshotBase64 = buf.toString('base64');
            }
          } catch {
            // no screenshot
          }
        }
        onTestComplete?.(result);
      }

      return results;
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    }
  }

  private async installPlaywrightLocally(tmpDir: string): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      const child = spawn('npm', ['init', '-y'], { cwd: tmpDir, shell: true });
      child.on('close', resolve);
      child.on('error', reject);
    });

    await new Promise<void>((resolve, reject) => {
      const child = spawn('npm', ['install', '@playwright/test', 'typescript', 'ts-node'], {
        cwd: tmpDir,
        shell: true,
        env: { ...process.env, NODE_ENV: 'development' },
      });
      child.on('close', resolve);
      child.on('error', reject);
    });

    await new Promise<void>((resolve, reject) => {
      const child = spawn('npx', ['playwright', 'install', 'chromium', '--with-deps'], {
        cwd: tmpDir,
        shell: true,
      });
      child.on('close', resolve);
      child.on('error', reject);
    });
  }

  private parseReport(report: any): TestRunResult[] {
    const results: TestRunResult[] = [];

    const walkSuite = (suite: PlaywrightSuiteResult) => {
      for (const spec of suite.specs || []) {
        for (const test of spec.tests || []) {
          const entry = test.results?.[0];
          if (!entry) continue;

          const status = this.mapStatus(entry.status);
          results.push({
            testName: spec.title,
            status,
            duration: entry.duration || 0,
            errorMessage: entry.error?.message,
            stackTrace: entry.error?.stack,
          });
        }
      }
      for (const sub of suite.suites || []) {
        walkSuite(sub);
      }
    };

    for (const suite of report.suites || []) {
      walkSuite(suite);
    }

    return results;
  }

  private mapStatus(s: string): TestStatus {
    switch (s) {
      case 'passed': return TestStatus.PASSED;
      case 'failed': return TestStatus.FAILED;
      case 'timedOut': return TestStatus.TIMEDOUT;
      default: return TestStatus.SKIPPED;
    }
  }
}

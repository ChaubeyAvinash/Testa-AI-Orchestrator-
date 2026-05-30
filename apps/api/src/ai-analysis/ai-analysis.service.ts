import { Injectable, Logger } from '@nestjs/common';
import ModelClient, { isUnexpected } from '@azure-rest/ai-inference';
import { AzureKeyCredential } from '@azure/core-auth';
import { TestRunResult } from '../test-runner/test-runner.service';
import { TestStatus } from '@testa/shared';

const SYSTEM_PROMPT = `You are a QA engineer specializing in diagnosing Playwright test failures.
Given a test name, error message, stack trace, and the test code that failed, provide a concise (3-5 sentences) actionable diagnosis.
Be specific: name the selector, URL, or assertion that failed and suggest a concrete fix.
Output plain text only — no markdown, no bullet points, no headers.`;

@Injectable()
export class AiAnalysisService {
  private readonly logger = new Logger(AiAnalysisService.name);
  private readonly client: ReturnType<typeof ModelClient>;
  private readonly model: string;

  constructor() {
    this.client = ModelClient(
      process.env.AZURE_INFERENCE_ENDPOINT!,
      new AzureKeyCredential(process.env.AZURE_AI_API_KEY!),
    );
    this.model = process.env.AZURE_AI_MODEL ?? 'gpt-5.1';
  }

  async analyzeFailures(
    results: TestRunResult[],
    generatedCode: string,
  ): Promise<Map<string, string>> {
    const failures = results.filter((r) => r.status === TestStatus.FAILED || r.status === TestStatus.TIMEDOUT);
    const suggestions = new Map<string, string>();

    if (failures.length === 0) return suggestions;
    this.logger.log(`Analyzing ${failures.length} test failures`);

    const CONCURRENCY = 3;
    const chunks: TestRunResult[][] = [];
    for (let i = 0; i < failures.length; i += CONCURRENCY) {
      chunks.push(failures.slice(i, i + CONCURRENCY));
    }

    for (const chunk of chunks) {
      await Promise.all(
        chunk.map(async (failure) => {
          try {
            const suggestion = await this.analyzeSingle(failure, generatedCode);
            suggestions.set(failure.testName, suggestion);
          } catch (err) {
            this.logger.warn(`Failed to analyze "${failure.testName}": ${err}`);
            suggestions.set(failure.testName, 'Analysis unavailable for this failure.');
          }
        }),
      );
    }

    return suggestions;
  }

  private async analyzeSingle(failure: TestRunResult, generatedCode: string): Promise<string> {
    const testBlock = this.extractTestBlock(generatedCode, failure.testName);
    const stackLines = (failure.stackTrace || '').split('\n').slice(0, 10).join('\n');

    const prompt = `TEST NAME: ${failure.testName}
ERROR: ${failure.errorMessage || 'No error message'}
STACK TRACE (first 10 lines):
${stackLines || 'No stack trace'}
TEST CODE:
${testBlock || 'Code not available'}`;

    const response = await this.client.path('/chat/completions').post({
      body: {
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        model: this.model,
        max_tokens: 300,
      },
    });

    if (isUnexpected(response)) {
      throw new Error(`Azure AI error: ${JSON.stringify(response.body)}`);
    }

    return response.body.choices?.[0]?.message?.content ?? 'Analysis unavailable.';
  }

  private extractTestBlock(code: string, testName: string): string {
    const escapedName = testName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`test\\(['"\`]${escapedName}['"\`][\\s\\S]{0,2000}?\\}\\);`, 'm');
    const match = code.match(regex);
    return match ? match[0].slice(0, 800) : '';
  }
}

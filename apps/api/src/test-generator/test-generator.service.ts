import { Injectable, Logger } from '@nestjs/common';
import ModelClient, { isUnexpected } from '@azure-rest/ai-inference';
import { AzureKeyCredential } from '@azure/core-auth';
import { CrawlResult } from '../crawler/crawler.service';

const SYSTEM_PROMPT = `You are an expert Playwright test engineer. Given information about a web application, you generate comprehensive, robust Playwright tests using TypeScript.
Your tests use best practices: data-testid selectors preferred, meaningful assertions, proper async/await, and descriptive test names.
IMPORTANT: Output ONLY the TypeScript code — no markdown fences, no explanations, no comments before the imports.
The output must be a single valid .spec.ts file using @playwright/test.`;

@Injectable()
export class TestGeneratorService {
  private readonly logger = new Logger(TestGeneratorService.name);
  private readonly client: ReturnType<typeof ModelClient>;
  private readonly model: string;

  constructor() {
    this.client = ModelClient(
      process.env.AZURE_INFERENCE_ENDPOINT!,
      new AzureKeyCredential(process.env.AZURE_AI_API_KEY!),
    );
    this.model = process.env.AZURE_AI_MODEL ?? 'gpt-5.1';
  }

  async generate(crawlResult: CrawlResult, testTypes: string[]): Promise<string> {
    const prompt = this.buildPrompt(crawlResult, testTypes);
    this.logger.log(`Generating tests for ${crawlResult.pages.length} pages, types: ${testTypes.join(', ')}`);

    const response = await this.client.path('/chat/completions').post({
      body: {
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        model: this.model,
        max_tokens: 4096,
      },
    });

    if (isUnexpected(response)) {
      throw new Error(`Azure AI error: ${JSON.stringify(response.body)}`);
    }

    const text = response.body.choices?.[0]?.message?.content ?? '';
    return text.replace(/^```(?:typescript)?\n?/m, '').replace(/\n?```$/m, '').trim();
  }

  private buildPrompt(crawlResult: CrawlResult, testTypes: string[]): string {
    const pagesSummary = crawlResult.pages
      .map((p) => {
        const formSummary = p.forms.length > 0
          ? `\n    Forms: ${p.forms.map((f) => `[${f.inputs.join(', ')}]`).join(', ')}`
          : '';
        const buttonSummary = p.buttons.length > 0
          ? `\n    Buttons: ${p.buttons.slice(0, 5).join(', ')}`
          : '';
        const inputSummary = p.inputs.length > 0
          ? `\n    Inputs: ${p.inputs.slice(0, 5).map((i) => i.name || i.type).join(', ')}`
          : '';
        return `- URL: ${p.url}\n  Title: "${p.title}"${formSummary}${buttonSummary}${inputSummary}`;
      })
      .join('\n');

    const testInstructions: Record<string, string> = {
      navigation: '- NAVIGATION: For each page, visit it and assert status is not error, title is not empty, and page has visible content.',
      forms: '- FORMS: For each form found, fill inputs with realistic test data and submit. Assert success or expected error states.',
      accessibility: '- ACCESSIBILITY: Check that images have alt attributes, buttons have accessible labels, and headings have proper hierarchy.',
      visual: '- VISUAL: Take full-page screenshots of key pages for visual comparison.',
      api: '- API: Intercept key network requests (fetch/XHR) and assert they return 2xx status codes.',
    };

    const instructions = testTypes
      .filter((t) => testInstructions[t])
      .map((t) => testInstructions[t])
      .join('\n');

    return `Generate Playwright tests for the following web application.

BASE URL: ${crawlResult.baseUrl}

DISCOVERED PAGES (${crawlResult.pages.length} total):
${pagesSummary}

TEST TYPES REQUESTED:
${instructions}

REQUIREMENTS:
- Import from '@playwright/test'
- Use page.waitForLoadState('networkidle') after navigation when needed
- Use realistic test data (real-looking emails, names, etc.)
- Each test must be independent (no shared state)
- Group related tests with describe blocks
- Add a beforeEach that navigates to the relevant page URL

Generate the complete .spec.ts file now:`;
  }
}

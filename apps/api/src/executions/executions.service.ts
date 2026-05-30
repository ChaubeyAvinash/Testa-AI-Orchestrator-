import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CrawlerService } from '../crawler/crawler.service';
import { TestGeneratorService } from '../test-generator/test-generator.service';
import { TestRunnerService } from '../test-runner/test-runner.service';
import { AiAnalysisService } from '../ai-analysis/ai-analysis.service';
import { SseService } from '../sse/sse.service';
import { CreateExecutionDto } from './dto/create-execution.dto';
import { ExecutionStatus, TestStatus } from '@testa/shared';

function parseTestTypes(raw: string): string[] {
  try { return JSON.parse(raw || '[]'); } catch { return []; }
}

function serializeExecution(e: any) {
  if (!e) return e;
  return { ...e, testTypes: parseTestTypes(e.testTypes) };
}

@Injectable()
export class ExecutionsService {
  private readonly logger = new Logger(ExecutionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly crawler: CrawlerService,
    private readonly generator: TestGeneratorService,
    private readonly runner: TestRunnerService,
    private readonly analyzer: AiAnalysisService,
    private readonly sse: SseService,
  ) {}

  async create(dto: CreateExecutionDto) {
    const project = await this.prisma.project.findUnique({ where: { id: dto.projectId } });
    if (!project) throw new NotFoundException(`Project ${dto.projectId} not found`);

    const execution = await this.prisma.execution.create({
      data: {
        projectId: dto.projectId,
        testTypes: JSON.stringify(dto.testTypes),
        status: ExecutionStatus.PENDING,
      },
    });

    this.sse.create(execution.id);
    this.runPipeline(execution.id, project.url, dto.testTypes).catch((err) => {
      this.logger.error(`Pipeline failed for execution ${execution.id}: ${err}`);
    });

    return serializeExecution(execution);
  }

  async findOne(id: string) {
    const execution = await this.prisma.execution.findUnique({ where: { id } });
    if (!execution) throw new NotFoundException(`Execution ${id} not found`);
    return serializeExecution(execution);
  }

  async findResults(id: string) {
    await this.findOne(id);
    return this.prisma.testResult.findMany({
      where: { executionId: id },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findGeneratedCode(id: string) {
    const execution = await this.prisma.execution.findUnique({ where: { id } });
    if (!execution) throw new NotFoundException(`Execution ${id} not found`);
    return { code: execution.generatedCode || '' };
  }

  async findByProject(projectId: string) {
    const rows = await this.prisma.execution.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(serializeExecution);
  }

  private async runPipeline(executionId: string, url: string, testTypes: string[]) {
    const emit = (event: string, data: unknown) => {
      this.sse.emit(executionId, {
        event: event as any,
        executionId,
        timestamp: new Date().toISOString(),
        data,
      });
    };

    try {
      // ── Phase 1: Crawl ────────────────────────────────────────────────
      await this.prisma.execution.update({
        where: { id: executionId },
        data: { status: ExecutionStatus.CRAWLING, startedAt: new Date() },
      });
      emit('stage_change', { stage: ExecutionStatus.CRAWLING, message: 'Crawling website...' });

      const crawlResult = await this.crawler.crawl(url, undefined, (count, currentUrl) => {
        emit('crawl_progress', { pagesFound: count, currentUrl });
      });

      await this.prisma.execution.update({
        where: { id: executionId },
        data: { crawlResult: JSON.stringify(crawlResult) },
      });

      // ── Phase 2: Generate ─────────────────────────────────────────────
      await this.prisma.execution.update({
        where: { id: executionId },
        data: { status: ExecutionStatus.GENERATING },
      });
      emit('stage_change', { stage: ExecutionStatus.GENERATING, message: 'Generating Playwright tests with AI...' });

      const generatedCode = await this.generator.generate(crawlResult, testTypes);
      const linesOfCode = generatedCode.split('\n').length;

      await this.prisma.execution.update({
        where: { id: executionId },
        data: { generatedCode, status: ExecutionStatus.RUNNING },
      });
      emit('generation_complete', { linesOfCode });

      // ── Phase 3: Run ──────────────────────────────────────────────────
      emit('stage_change', { stage: ExecutionStatus.RUNNING, message: 'Executing Playwright tests...' });

      const runResults = await this.runner.run(generatedCode, (result) => {
        emit('test_complete', {
          testName: result.testName,
          status: result.status,
          duration: result.duration,
          errorMessage: result.errorMessage,
        });
      });

      const passed = runResults.filter((r) => r.status === TestStatus.PASSED).length;
      const failed = runResults.filter((r) => r.status !== TestStatus.PASSED).length;

      // ── Phase 4: Analyze ──────────────────────────────────────────────
      await this.prisma.execution.update({
        where: { id: executionId },
        data: { status: ExecutionStatus.ANALYZING, totalTests: runResults.length, passedTests: passed, failedTests: failed },
      });
      emit('stage_change', { stage: ExecutionStatus.ANALYZING, message: 'AI analyzing failures...' });

      const suggestions = await this.analyzer.analyzeFailures(runResults, generatedCode);
      emit('analysis_complete', { failuresAnalyzed: suggestions.size });

      // ── Persist results ───────────────────────────────────────────────
      await this.prisma.testResult.createMany({
        data: runResults.map((r) => ({
          executionId,
          testName: r.testName,
          status: r.status,
          duration: r.duration,
          errorMessage: r.errorMessage,
          stackTrace: r.stackTrace,
          screenshotBase64: r.screenshotBase64,
          aiSuggestion: suggestions.get(r.testName),
        })),
      });

      await this.prisma.execution.update({
        where: { id: executionId },
        data: { status: ExecutionStatus.COMPLETED, completedAt: new Date() },
      });

      emit('execution_complete', { totalTests: runResults.length, passedTests: passed, failedTests: failed });
      this.sse.complete(executionId);
    } catch (err) {
      this.logger.error(`Execution ${executionId} failed: ${err}`);
      await this.prisma.execution.update({
        where: { id: executionId },
        data: { status: ExecutionStatus.FAILED, completedAt: new Date() },
      }).catch(() => {});
      emit('error', { message: String(err) });
      this.sse.complete(executionId);
    }
  }
}

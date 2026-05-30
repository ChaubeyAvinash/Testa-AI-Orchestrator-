import { Module } from '@nestjs/common';
import { ExecutionsController } from './executions.controller';
import { ExecutionsService } from './executions.service';
import { CrawlerModule } from '../crawler/crawler.module';
import { TestGeneratorModule } from '../test-generator/test-generator.module';
import { TestRunnerModule } from '../test-runner/test-runner.module';
import { AiAnalysisModule } from '../ai-analysis/ai-analysis.module';

@Module({
  imports: [CrawlerModule, TestGeneratorModule, TestRunnerModule, AiAnalysisModule],
  controllers: [ExecutionsController],
  providers: [ExecutionsService],
})
export class ExecutionsModule {}

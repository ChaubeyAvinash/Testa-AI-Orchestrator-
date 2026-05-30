import { Module } from '@nestjs/common';
import { TestRunnerService } from './test-runner.service';

@Module({
  providers: [TestRunnerService],
  exports: [TestRunnerService],
})
export class TestRunnerModule {}

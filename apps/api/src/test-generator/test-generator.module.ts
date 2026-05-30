import { Module } from '@nestjs/common';
import { TestGeneratorService } from './test-generator.service';

@Module({
  providers: [TestGeneratorService],
  exports: [TestGeneratorService],
})
export class TestGeneratorModule {}

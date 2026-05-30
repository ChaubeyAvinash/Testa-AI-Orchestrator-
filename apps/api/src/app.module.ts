import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { SseModule } from './sse/sse.module';
import { ProjectsModule } from './projects/projects.module';
import { ExecutionsModule } from './executions/executions.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    SseModule,
    ProjectsModule,
    ExecutionsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}

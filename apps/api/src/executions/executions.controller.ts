import { Body, Controller, Get, MessageEvent, Param, Post, Res, Sse } from '@nestjs/common';
import { Observable, map } from 'rxjs';
import type { Response } from 'express';
import { ExecutionsService } from './executions.service';
import { SseService } from '../sse/sse.service';
import { CreateExecutionDto } from './dto/create-execution.dto';

@Controller()
export class ExecutionsController {
  constructor(
    private readonly service: ExecutionsService,
    private readonly sse: SseService,
  ) {}

  @Post('executions')
  create(@Body() dto: CreateExecutionDto) {
    return this.service.create(dto);
  }

  @Get('executions/:id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Sse('executions/:id/stream')
  stream(@Param('id') id: string, @Res() res: Response): Observable<MessageEvent> {
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('X-Accel-Buffering', 'no');
    return this.sse.getStream(id).pipe(
      map((event) => ({ data: JSON.stringify(event) }) as MessageEvent),
    );
  }

  @Get('executions/:id/results')
  findResults(@Param('id') id: string) {
    return this.service.findResults(id);
  }

  @Get('executions/:id/generated-code')
  findGeneratedCode(@Param('id') id: string) {
    return this.service.findGeneratedCode(id);
  }

  @Get('projects/:id/executions')
  findByProject(@Param('id') id: string) {
    return this.service.findByProject(id);
  }
}

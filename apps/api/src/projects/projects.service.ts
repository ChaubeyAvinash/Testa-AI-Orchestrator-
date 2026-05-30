import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';

function parseTestTypes(raw: string): string[] {
  try { return JSON.parse(raw || '[]'); } catch { return []; }
}

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const rows = await this.prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { executions: true } } },
    });
    return rows.map(({ _count, ...p }) => ({ ...p, executionCount: _count.executions }));
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        executions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            status: true,
            testTypes: true,
            totalTests: true,
            passedTests: true,
            failedTests: true,
            startedAt: true,
            completedAt: true,
            createdAt: true,
          },
        },
      },
    });
    if (!project) throw new NotFoundException(`Project ${id} not found`);
    return {
      ...project,
      executions: project.executions.map((e) => ({
        ...e,
        testTypes: parseTestTypes(e.testTypes),
      })),
    };
  }

  async create(dto: CreateProjectDto) {
    return this.prisma.project.create({ data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.project.delete({ where: { id } });
  }
}

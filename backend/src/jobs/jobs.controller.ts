import { Controller, Get, Post, Body, Param, Delete, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, getSchemaPath, ApiExtraModels } from '@nestjs/swagger';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { JobResponseDto } from './dto/job-response.dto';
import { UrlResultDto } from './dto/url-result.dto';
import { JobEntity } from './entities/job.entity';

@ApiTags('Jobs')
@ApiExtraModels(JobResponseDto, UrlResultDto)
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) { }

  @Post()
  @Throttle({ medium: { limit: 3, ttl: 60000 } })
  @ApiOperation({ summary: 'Создать новую задачу' })
  @ApiResponse({ status: HttpStatus.CREATED, type: JobResponseDto })
  create(@Body() createJobDto: CreateJobDto): Promise<JobResponseDto> {
    return this.jobsService.create(createJobDto);
  }

  @Get()
  @Throttle({ medium: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: 'Список заданий с краткой информацией' })
  @ApiResponse({ status: HttpStatus.OK, type: [JobResponseDto] })
  findAll(): Promise<JobResponseDto[]> {
    return this.jobsService.findAll();
  }

  @Get(':id')
  @SkipThrottle()
  @ApiOperation({ summary: 'Детальная информация о задании' })
  @ApiResponse({
    status: HttpStatus.OK,
    schema: {
      allOf: [
        { $ref: getSchemaPath(JobResponseDto) },
        {
          type: 'object',
          properties: {
            urls: {
              type: 'array',
              items: { $ref: getSchemaPath(UrlResultDto) },
            },
          },
          required: ['urls'],
        },
      ],
    },
  })
  findOne(@Param('id') id: string): Promise<JobEntity> {
    return this.jobsService.findOne(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Отменить выполнение задачи' })
  @ApiResponse({ status: HttpStatus.OK })
  remove(@Param('id') id: string) {
    return this.jobsService.cancel(id);
  }
}
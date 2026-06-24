import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { JobEntity } from './entities/job.entity';
import { CreateJobDto } from './dto/create-job.dto';
import { JobResponseDto } from './dto/job-response.dto';
import { UrlResultDto } from './dto/url-result.dto';

@Injectable()
export class JobsService {
  private readonly db = new Map<string, JobEntity>();

  constructor(
    @InjectQueue('url-processing') private readonly urlQueue: Queue,
  ) {}

  async create(createJobDto: CreateJobDto): Promise<JobResponseDto> {
    const uniqueUrls = Array.from(new Set(createJobDto.urls));

    const jobId = Math.random().toString(36).substring(2, 15);
    const job = new JobEntity(jobId, new Date().toISOString(), uniqueUrls);

    this.db.set(job.id, job);

    await this.enqueueUrlProcessing(job.id, uniqueUrls);
    
    job.startProcessing();

    return job.toLightweight();
  }

  async findAll(): Promise<JobResponseDto[]> {
    return Array.from(this.db.values()).map((job) => job.toLightweight());
  }

  async findOne(id: string): Promise<JobEntity> {
    const job = this.db.get(id);
    if (!job) {
      throw new NotFoundException(`Задача с ID ${id} не найдена`);
    }
    return job;
  }

  async cancel(id: string): Promise<{ success: boolean }> {
    const job = await this.findOne(id);
    
    job.cancel();
    await this.clearQueueForJob(job.id, job.urlsCount);

    return { success: true };
  }

  updateUrlStatus(parentJobId: string, index: number, result: Omit<UrlResultDto, 'url'>): void {
    const job = this.db.get(parentJobId);
    if (job) {
      job.updateUrlResult(index, result);
    }
  }

  private async enqueueUrlProcessing(jobId: string, urls: string[]): Promise<void> {
    await this.urlQueue.add('process-job-pool', {
      parentJobId: jobId,
      urls
    }, {
      jobId: jobId,
      attempts: 1,
    });
  }

  private async clearQueueForJob(jobId: string, urlsCount: number): Promise<void> {
    const redisJob = await this.urlQueue.getJob(jobId);
    if (redisJob) {
      await redisJob.remove();
    }
  }
}
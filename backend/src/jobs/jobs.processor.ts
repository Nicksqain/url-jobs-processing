import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { firstValueFrom } from 'rxjs';

@Processor('url-processing', { concurrency: 10 })
@Injectable()
export class JobsProcessor extends WorkerHost {
  private readonly logger = new Logger(JobsProcessor.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly jobsService: JobsService,
  ) {
    super();
  }

  private delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async process(job: Job<{ parentJobId: string; urls: string[] }>): Promise<any> {
    const { parentJobId, urls } = job.data;

    this.logger.log(`Начало параллельной обработки задания: ${parentJobId}, уникальных URL: ${urls.length}`);

    const CONCURRENCY_LIMIT = 5;
    const executing = new Set<Promise<void>>();

    for (let index = 0; index < urls.length; index++) {
      const url = urls[index];

      try {
        const parentJob = await this.jobsService.findOne(parentJobId);
        if (parentJob.status === 'cancelled') {
          this.logger.log(`[Прерывание] Задание ${parentJobId} отменено. Останавливаем обработку.`);
          break;
        }
      } catch {
        break;
      }

      const taskPromise = (async () => {
        this.logger.log(`Начало обработки URL: ${url} для задачи ${parentJobId}`);

        const startedAt = new Date().toISOString();

        this.jobsService.updateUrlStatus(parentJobId, index, {
          status: 'in_progress',
          startedAt,
        });

        try {
          const randomDelay = Math.floor(Math.random() * 10000);
          await this.delay(randomDelay);

          const parentJobAfterSleep = await this.jobsService.findOne(parentJobId);
          if (parentJobAfterSleep.status === 'cancelled') {
            this.logger.log(`[Отмена после сна] Задание ${parentJobId} отменено. Скипаем URL: ${url}`);
            return;
          }

          const startTime = Date.now();

          // HEAD проверка ссылки
          const response = await firstValueFrom(
            this.httpService.head(url, { timeout: 5000, validateStatus: () => true })
          );

          const duration = Date.now() - startTime;
          const finishedAt = new Date().toISOString();

          const result = {
            status: (response.status >= 400 ? 'error' : 'success') as 'error' | 'success',
            httpStatus: response.status,
            duration,
            startedAt,
            finishedAt,
          };

          this.jobsService.updateUrlStatus(parentJobId, index, result);

        } catch (error: any) {
          const duration = Date.now() - new Date(startedAt).getTime();
          const finishedAt = new Date().toISOString();

          const result = {
            status: 'error' as const,
            httpStatus: error.response?.status || null,
            error: error.message || 'Unknown network error',
            duration,
            startedAt,
            finishedAt,
          };

          this.jobsService.updateUrlStatus(parentJobId, index, result);
        }
      })();

      executing.add(taskPromise);

      taskPromise.then(() => executing.delete(taskPromise));

      if (executing.size >= CONCURRENCY_LIMIT) {
        await Promise.race(executing);
      }
    }

    await Promise.all(executing);

    this.logger.log(`Задание ${parentJobId} полностью обработано воркером.`);
    return { status: 'completed' };
  }
}
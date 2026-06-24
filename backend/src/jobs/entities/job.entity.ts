import { JobResponseDto } from '../dto/job-response.dto';
import { UrlResultDto } from '../dto/url-result.dto';

export class JobEntity implements JobResponseDto {
  readonly id: string;
  readonly createdAt: string;
  status: string;
  readonly urlsCount: number;
  readonly stats: { success: number; error: number };
  readonly urls: UrlResultDto[];

  constructor(id: string, createdAt: string, urls: string[]) {
    this.id = id;
    this.createdAt = createdAt;
    this.status = 'pending';
    this.urlsCount = urls.length;
    this.stats = { success: 0, error: 0 };
    this.urls = urls.map((url) => ({ url, status: 'pending' }));
  }

  startProcessing(): void {
    if (this.status === 'pending') {
      this.status = 'in_progress';
    }
  }

  cancel(): void {
    if (this.status === 'in_progress' || this.status === 'pending') {
      this.status = 'cancelled';
      this.urls.forEach((u) => {
        if (u.status === 'pending' || u.status === 'in_progress') {
          u.status = 'cancelled';
        }
      });
    }
  }

  updateUrlResult(index: number, result: Partial<UrlResultDto>): void {
    if (!this.urls[index]) {
      return;
    }

    if (this.status === 'cancelled') {
      this.urls[index] = {
        ...this.urls[index],
        status: 'cancelled',
        finishedAt: new Date().toISOString()
      };
      return;
    }

    this.urls[index] = { ...this.urls[index], ...result };

    this.recalculateStats();
    this.checkCompletion();
  }

  toLightweight(): JobResponseDto {
    const { urls, ...rest } = this;
    return rest;
  }

  private recalculateStats(): void {
    this.stats.success = this.urls.filter((u) => u.status === 'success').length;
    this.stats.error = this.urls.filter((u) => u.status === 'error').length;
  }

  private checkCompletion(): void {
    const processedCount = this.stats.success + this.stats.error;
    if (processedCount === this.urlsCount) {
      this.status = 'completed';
    }
  }
}
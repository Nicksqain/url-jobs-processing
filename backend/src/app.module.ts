import { Module } from '@nestjs/common';
import { JobsModule } from './jobs/jobs.module';
import { BullModule } from '@nestjs/bullmq';
import { ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: 'short',
          ttl: 1000,
          limit: 2,
        },
        {
          name: 'medium',
          ttl: 60000,
          limit: 5,
        },
      ],
      storage: new ThrottlerStorageRedisService(),
    }),
    BullModule.forRoot(
      {
        connection: {
          host: process.env.REDIS_HOST || 'localhost', port: 6379
        }
      }),
    JobsModule
  ],
})
export class AppModule { }

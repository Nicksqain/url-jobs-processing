import { ApiProperty } from '@nestjs/swagger';

export class JobStatsDto {
  @ApiProperty({ example: 5 })
  success!: number;

  @ApiProperty({ example: 1 })
  error!: number;
}

export class JobResponseDto {
  @ApiProperty({ example: 'a9b8c7d6-e5f4-3c2b-1a0z-9876543210fe' })
  id!: string;

  @ApiProperty({ example: '2026-06-23T12:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: 'in_progress', enum: ['pending', 'in_progress', 'completed', 'cancelled', 'failed'] })
  status!: string;

  @ApiProperty({ example: 10 })
  urlsCount!: number;

  @ApiProperty({ type: JobStatsDto })
  stats!: JobStatsDto;
}
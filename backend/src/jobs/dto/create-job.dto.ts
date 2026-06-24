import { ApiProperty } from '@nestjs/swagger';

export class CreateJobDto {
  @ApiProperty({
    example: ['https://google.com', 'https://github.com'],
    description: 'Список URL-адресов для параллельной или последовательной проверки',
    type: [String],
  })
  urls!: string[];
}